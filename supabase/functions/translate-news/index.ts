const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Translation request received");
    
    const { title, summary, targetLang = "zh-CN" } = await req.json();
    
    if (!title) {
      console.log("No title provided");
      return new Response(
        JSON.stringify({ error: "Title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Translating: ${title.substring(0, 50)}...`);

    // Language code mapping for MyMemory API
    const langCodeMap: Record<string, string> = {
      "zh-CN": "zh-CN",
      "zh-TW": "zh-TW",
      "en": "en",
      "ja": "ja",
      "ko": "ko",
    };

    const targetCode = langCodeMap[targetLang] || "zh-CN";

    // Detect source language (assume English if not Chinese)
    const isChinese = /[\u4e00-\u9fa5]/.test(title);
    const sourceLang = isChinese ? "zh-CN" : "en";

    // If already in target language, return original
    if (sourceLang === targetCode) {
      console.log("Content already in target language");
      return new Response(
        JSON.stringify({
          translatedTitle: title,
          translatedSummary: summary,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Translate title using MyMemory free API
    const translateText = async (text: string): Promise<string> => {
      if (!text) return "";
      
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetCode}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.responseStatus !== 200) {
        console.error("MyMemory API error:", data);
        throw new Error(data.responseDetails || "Translation failed");
      }
      
      return data.responseData.translatedText;
    };

    console.log("Calling MyMemory translation API...");
    
    const translatedTitle = await translateText(title);
    const translatedSummary = summary ? await translateText(summary) : null;

    console.log("Translation successful");

    return new Response(
      JSON.stringify({
        translatedTitle,
        translatedSummary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Translation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
