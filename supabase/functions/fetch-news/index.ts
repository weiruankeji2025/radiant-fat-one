import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 新闻源配置
const NEWS_SOURCES = [
  // 政治新闻
  { url: 'https://www.bbc.com/news/world', name: 'BBC World', category: 'politics' },
  { url: 'https://www.reuters.com/world/', name: 'Reuters', category: 'politics' },
  { url: 'https://www.aljazeera.com/news/', name: 'Al Jazeera', category: 'world' },
  
  // 科技新闻
  { url: 'https://techcrunch.com/', name: 'TechCrunch', category: 'technology' },
  { url: 'https://www.theverge.com/', name: 'The Verge', category: 'technology' },
  { url: 'https://arstechnica.com/', name: 'Ars Technica', category: 'technology' },
  
  // 军事新闻
  { url: 'https://www.defense.gov/News/', name: 'Defense.gov', category: 'military' },
  
  // 经济新闻
  { url: 'https://www.bloomberg.com/markets', name: 'Bloomberg', category: 'economy' },
]

interface NewsArticle {
  title: string
  summary: string | null
  content: string | null
  source_url: string
  source_name: string
  category: string
  image_url: string | null
  published_at: string | null
}

async function verifyAuth(req: Request): Promise<{ user: any; error: string | null }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { user: null, error: 'Authorization header required' }
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabaseClient.auth.getUser()
  if (error || !user) {
    return { user: null, error: 'Invalid token' }
  }

  return { user, error: null }
}

async function scrapeNewsFromUrl(
  firecrawlApiKey: string,
  url: string,
  sourceName: string,
  category: string
): Promise<NewsArticle[]> {
  console.log(`Scraping news from ${sourceName}: ${url}`)
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      }),
    })

    if (!response.ok) {
      console.error(`Failed to scrape ${url}: ${response.status}`)
      return []
    }

    const data = await response.json()
    const markdown = data.data?.markdown || data.markdown || ''
    const links = data.data?.links || data.links || []
    const metadata = data.data?.metadata || data.metadata || {}

    // 从 markdown 内容中提取新闻标题和摘要
    const articles: NewsArticle[] = []
    
    // 使用正则表达式提取标题（通常是 ## 或 ### 开头的行）
    const titleMatches = markdown.match(/^#{1,3}\s+(.+)$/gm) || []
    const uniqueTitles = [...new Set(titleMatches.map((t: string) => t.replace(/^#+\s+/, '').trim()))]
    
    // 取前10条新闻
    const titlesToProcess = uniqueTitles.slice(0, 10) as string[]
    
    for (const title of titlesToProcess) {
      if (title.length < 10 || title.length > 300) continue
      
      // 尝试从链接中找到对应的文章链接
      const matchedLink = links.find((link: string) => {
        const titleWords = title.toLowerCase().split(' ').filter((w: string) => w.length > 3)
        return titleWords.some((word: string) => link.toLowerCase().includes(word))
      })
      
      const articleUrl = matchedLink || url
      
      articles.push({
        title: title,
        summary: null,
        content: null,
        source_url: articleUrl,
        source_name: sourceName,
        category: category,
        image_url: metadata.ogImage || null,
        published_at: new Date().toISOString(),
      })
    }

    console.log(`Found ${articles.length} articles from ${sourceName}`)
    return articles
  } catch (error) {
    console.error(`Error scraping ${url}:`, error)
    return []
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(req)
    if (authError) {
      console.log('Auth failed:', authError)
      return new Response(
        JSON.stringify({ success: false, error: authError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log(`Authenticated user: ${user.email}`)

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 可选：获取指定的新闻源
    let sourcesToScrape = NEWS_SOURCES
    try {
      const body = await req.json()
      if (body.sources && Array.isArray(body.sources)) {
        sourcesToScrape = NEWS_SOURCES.filter(s => body.sources.includes(s.name))
      }
      if (body.category) {
        sourcesToScrape = sourcesToScrape.filter(s => s.category === body.category)
      }
    } catch {
      // 没有 body，使用所有源
    }

    console.log(`Starting to scrape ${sourcesToScrape.length} news sources`)

    const allArticles: NewsArticle[] = []

    // 并行爬取所有新闻源（限制并发数）
    const batchSize = 3
    for (let i = 0; i < sourcesToScrape.length; i += batchSize) {
      const batch = sourcesToScrape.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(source => 
          scrapeNewsFromUrl(firecrawlApiKey, source.url, source.name, source.category)
        )
      )
      allArticles.push(...results.flat())
    }

    console.log(`Total articles scraped: ${allArticles.length}`)

    // 插入新闻到数据库（忽略重复）
    let insertedCount = 0
    for (const article of allArticles) {
      const { error } = await supabase
        .from('news_articles')
        .upsert(article, { 
          onConflict: 'source_url',
          ignoreDuplicates: true 
        })
      
      if (!error) {
        insertedCount++
      } else {
        console.log(`Duplicate or error for: ${article.title.substring(0, 50)}...`)
      }
    }

    console.log(`Inserted ${insertedCount} new articles`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        scraped: allArticles.length,
        inserted: insertedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in fetch-news function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
