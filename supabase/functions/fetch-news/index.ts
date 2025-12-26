import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 新闻源配置 - 扩展版本
const NEWS_SOURCES = [
  // 政治新闻
  { url: 'https://www.bbc.com/news/world', name: 'BBC World', category: 'politics' },
  { url: 'https://www.reuters.com/world/', name: 'Reuters', category: 'politics' },
  { url: 'https://www.politico.com/', name: 'Politico', category: 'politics' },
  
  // 国际新闻
  { url: 'https://www.aljazeera.com/news/', name: 'Al Jazeera', category: 'world' },
  { url: 'https://www.dw.com/en/top-stories/s-9097', name: 'DW News', category: 'world' },
  { url: 'https://www.france24.com/en/', name: 'France24', category: 'world' },
  
  // 科技新闻
  { url: 'https://techcrunch.com/', name: 'TechCrunch', category: 'technology' },
  { url: 'https://www.theverge.com/', name: 'The Verge', category: 'technology' },
  { url: 'https://arstechnica.com/', name: 'Ars Technica', category: 'technology' },
  { url: 'https://www.wired.com/', name: 'Wired', category: 'technology' },
  
  // 军事新闻
  { url: 'https://www.defense.gov/News/', name: 'Defense.gov', category: 'military' },
  { url: 'https://www.defensenews.com/', name: 'Defense News', category: 'military' },
  { url: 'https://www.janes.com/defence-news', name: 'Janes', category: 'military' },
  
  // 经济新闻
  { url: 'https://www.bloomberg.com/markets', name: 'Bloomberg', category: 'economy' },
  { url: 'https://www.cnbc.com/world/', name: 'CNBC', category: 'economy' },
  { url: 'https://www.ft.com/', name: 'Financial Times', category: 'economy' },
  
  // 中美关系
  { url: 'https://www.scmp.com/topics/china-us-relations', name: 'SCMP China-US', category: 'china_us' },
  { url: 'https://www.reuters.com/world/china/', name: 'Reuters China', category: 'china_us' },
  
  // CNMD专栏 - 专门抓取cnmdnews.com全部内容
  { url: 'https://www.cnmdnews.com/', name: 'CNMD News', category: 'cnmd' },
  
  // 俄乌冲突
  { url: 'https://www.reuters.com/world/europe/', name: 'Reuters Europe', category: 'russia_ukraine' },
  { url: 'https://www.bbc.com/news/world/europe', name: 'BBC Europe', category: 'russia_ukraine' },
  { url: 'https://www.aljazeera.com/tag/ukraine-russia-crisis/', name: 'Al Jazeera Ukraine', category: 'russia_ukraine' },
  
  // 朝韩半岛
  { url: 'https://www.nknews.org/', name: 'NK News', category: 'korea' },
  { url: 'https://en.yna.co.kr/', name: 'Yonhap News', category: 'korea' },
  { url: 'https://www.koreaherald.com/', name: 'Korea Herald', category: 'korea' },
  
  // 东南亚
  { url: 'https://www.channelnewsasia.com/asia', name: 'CNA Asia', category: 'southeast_asia' },
  { url: 'https://www.straitstimes.com/asia', name: 'Straits Times', category: 'southeast_asia' },
  { url: 'https://www.bangkokpost.com/', name: 'Bangkok Post', category: 'southeast_asia' },
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

// 深度抓取 cnmdnews.com 全部新闻
async function crawlCnmdNews(
  firecrawlApiKey: string,
  category: string
): Promise<NewsArticle[]> {
  console.log('Deep crawling cnmdnews.com for ALL news articles...')
  
  try {
    // 首先使用 map API 获取网站所有URL
    console.log('Step 1: Mapping cnmdnews.com to discover all URLs...')
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.cnmdnews.com/',
        limit: 5000, // 获取最多5000个URL
        includeSubdomains: false,
      }),
    })
    
    let urlsToScrape: string[] = []
    
    if (mapResponse.ok) {
      const mapData = await mapResponse.json()
      urlsToScrape = mapData.links || []
      console.log(`Found ${urlsToScrape.length} URLs from cnmdnews.com`)
    }
    
    // 过滤出新闻文章URL（通常包含日期或特定路径模式）
    const newsUrls = urlsToScrape.filter(url => {
      const isArticle = url.includes('/20') || // 年份模式
                       url.includes('/news/') ||
                       url.includes('/article/') ||
                       url.includes('/post/') ||
                       url.match(/\/\d{4}\/\d{2}\//) // 日期格式
      const isNotAsset = !url.match(/\.(jpg|png|gif|css|js|pdf)$/i)
      return isArticle && isNotAsset
    })
    
    console.log(`Filtered to ${newsUrls.length} potential news article URLs`)
    
    // Step 2: 使用 crawl API 深度抓取
    console.log('Step 2: Deep crawling cnmdnews.com...')
    const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.cnmdnews.com/',
        limit: 500, // 抓取最多500个页面
        maxDepth: 5, // 增加深度
        scrapeOptions: {
          formats: ['markdown', 'links'],
          onlyMainContent: true,
        },
      }),
    })

    if (!crawlResponse.ok) {
      console.error(`Failed to start crawl: ${crawlResponse.status}`)
      // 回退到普通抓取
      return scrapeNewsFromUrl(firecrawlApiKey, 'https://www.cnmdnews.com/', 'CNMD News', category)
    }

    const crawlData = await crawlResponse.json()
    console.log('Crawl response:', JSON.stringify(crawlData).substring(0, 500))
    
    const articles: NewsArticle[] = []
    
    // 处理爬取结果
    const pages = crawlData.data || []
    console.log(`Crawled ${pages.length} pages from cnmdnews.com`)
    
    for (const page of pages) {
      const markdown = page.markdown || ''
      const metadata = page.metadata || {}
      const sourceUrl = metadata.sourceURL || 'https://www.cnmdnews.com/'
      
      // 从页面标题提取新闻
      if (metadata.title && metadata.title.length > 10 && metadata.title.length < 300) {
        // 检查是否是6个月内的新闻（通过URL或内容判断）
        articles.push({
          title: metadata.title,
          summary: metadata.description || null,
          content: markdown.substring(0, 1000) || null,
          source_url: sourceUrl,
          source_name: 'CNMD News',
          category: category,
          image_url: metadata.ogImage || null,
          published_at: new Date().toISOString(),
        })
      }
      
      // 从 markdown 中提取更多标题
      const titleMatches = markdown.match(/^#{1,3}\s+(.+)$/gm) || []
      for (const match of titleMatches.slice(0, 5)) {
        const title = match.replace(/^#+\s+/, '').trim()
        if (title.length >= 10 && title.length <= 300) {
          articles.push({
            title: title,
            summary: null,
            content: null,
            source_url: sourceUrl,
            source_name: 'CNMD News',
            category: category,
            image_url: metadata.ogImage || null,
            published_at: new Date().toISOString(),
          })
        }
      }
    }
    
    // 去重
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex(a => a.title === article.title)
    )
    
    console.log(`Found ${uniqueArticles.length} unique articles from cnmdnews.com`)
    return uniqueArticles
  } catch (error) {
    console.error('Error crawling cnmdnews.com:', error)
    return []
  }
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
    console.log('Fetch news request received')

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

    // 特殊处理 cnmdnews.com - 深度抓取
    const cnmdSource = sourcesToScrape.find(s => s.name === 'CNMD News')
    if (cnmdSource) {
      console.log('Deep crawling cnmdnews.com...')
      const cnmdArticles = await crawlCnmdNews(firecrawlApiKey, cnmdSource.category)
      allArticles.push(...cnmdArticles)
      // 从列表中移除，避免重复抓取
      sourcesToScrape = sourcesToScrape.filter(s => s.name !== 'CNMD News')
    }

    // 并行爬取其他新闻源（限制并发数）
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
