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
  
  // WeiRuanKeJi专栏 - 单独抓取weiruan.org全部内容
  { url: 'https://weiruan.org/', name: 'WeiRuanKeJi', category: 'weiruan' },
  
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

// 排除的URL模式 - 登录页、管理页、无实际内容的页面
const EXCLUDED_URL_PATTERNS = [
  '/wp-login',
  '/wp-admin',
  '/login',
  '/signin',
  '/sign-in',
  '/register',
  '/signup',
  '/sign-up',
  '/admin',
  '/dashboard',
  '/account',
  '/cart',
  '/checkout',
  '/feed',
  '/rss',
  '/xmlrpc',
  '/wp-json',
  '/api/',
  '/search',
  '/tag/',
  '/category/',
  '/author/',
  '/page/',
  '/attachment/',
  '/comments/',
]

// 排除的标题关键词 - 登录、管理等非内容页面
const EXCLUDED_TITLE_PATTERNS = [
  '登录',
  '登陆',
  'Login',
  'Sign In',
  'Sign Up',
  '注册',
  'WordPress',
  'Dashboard',
  '管理',
  '后台',
  'Admin',
  'Error',
  '错误',
  '404',
  '找不到',
  'Not Found',
  'Password',
  '密码',
  'Reset',
  '重置',
]

// 检查URL是否应该被排除
function isExcludedUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase()
  return EXCLUDED_URL_PATTERNS.some(pattern => lowerUrl.includes(pattern.toLowerCase()))
}

// 检查标题是否应该被排除
function isExcludedTitle(title: string): boolean {
  if (!title) return true
  const lowerTitle = title.toLowerCase()
  return EXCLUDED_TITLE_PATTERNS.some(pattern => lowerTitle.includes(pattern.toLowerCase()))
}

// 超时控制的fetch
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

// 重试机制
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 2, 
  timeoutMs = 15000
): Promise<Response | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs)
      if (response.ok) return response
      
      // 如果是客户端错误（4xx），不重试
      if (response.status >= 400 && response.status < 500) {
        console.log(`Client error ${response.status} for ${url}, not retrying`)
        return null
      }
      
      console.log(`Attempt ${attempt + 1} failed with status ${response.status}, retrying...`)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`Attempt ${attempt + 1} timed out for ${url}`)
      } else {
        console.log(`Attempt ${attempt + 1} error:`, error)
      }
    }
    
    // 等待后重试
    if (attempt < maxRetries) {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  
  return null
}

// 深度抓取 cnmdnews.com 全部新闻
async function crawlCnmdNews(
  firecrawlApiKey: string,
  category: string
): Promise<NewsArticle[]> {
  return crawlSiteDeep(firecrawlApiKey, 'https://www.cnmdnews.com/', 'CNMD News', category)
}

// 专门抓取 weiruan.org 导航链接 - WeiRuanKeJi专栏（资源推荐）
async function crawlWeiruanResources(
  firecrawlApiKey: string,
  category: string
): Promise<NewsArticle[]> {
  console.log('Fetching WeiRuanKeJi resources from weiruan.org...')
  
  try {
    // 抓取导航页面内容
    const response = await fetchWithRetry(
      'https://api.firecrawl.dev/v1/scrape',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://weiruan.org/',
          formats: ['markdown', 'links'],
          onlyMainContent: true,
        }),
      },
      2,
      20000
    )

    if (!response) {
      console.error('Failed to scrape weiruan.org')
      return []
    }

    let data
    try {
      data = await response.json()
    } catch (e) {
      console.error('Failed to parse weiruan.org response:', e)
      return []
    }

    const markdown = data.data?.markdown || data.markdown || ''
    const links = data.data?.links || data.links || []
    
    console.log(`Weiruan.org markdown length: ${markdown.length}, links: ${links.length}`)
    
    const articles: NewsArticle[] = []
    
    // 定义分类映射
    const categoryPatterns = [
      { name: '威软科技集群', emoji: '🔧' },
      { name: '常用推荐', emoji: '⭐' },
      { name: '论坛', emoji: '💬' },
      { name: 'VPS服务', emoji: '🖥️' },
      { name: 'AI 工具', emoji: '🤖' },
      { name: '面板工具', emoji: '📊' },
      { name: '影视资源', emoji: '🎬' },
      { name: '域名服务', emoji: '🌐' },
      { name: '邮箱', emoji: '📧' },
      { name: '网盘', emoji: '☁️' },
      { name: '友情链接', emoji: '🔗' },
    ]
    
    // 从markdown中提取资源条目
    // 格式类似: **威软订阅** \n\n 暂无描述\n\n 49](https://www.weiruan.org/go/8)
    const resourcePattern = /\*\*([^*]+)\*\*\s*\\?\n?\\?\n?\s*([^\n\\]*?)\\?\n?\\?\n?\s*(\d+)\]\((https:\/\/www\.weiruan\.org\/go\/\d+)\)/g
    
    let match
    let currentCategory = '其他资源'
    
    // 先查找分类标题
    const lines = markdown.split('\n')
    for (const line of lines) {
      // 检查是否是分类标题
      for (const cat of categoryPatterns) {
        if (line.includes(cat.name)) {
          currentCategory = cat.name
          break
        }
      }
    }
    
    // 提取所有资源
    while ((match = resourcePattern.exec(markdown)) !== null) {
      const [, name, description, clicks, url] = match
      
      if (name && url) {
        const cleanName = name.trim()
        const cleanDesc = description.trim() === '暂无描述' ? '' : description.trim()
        
        // 为资源创建标题，包含来源分类
        const title = `[资源推荐] ${cleanName}`
        const summary = cleanDesc || `威软导航推荐资源 - 热度: ${clicks}`
        
        articles.push({
          title: title,
          summary: summary,
          content: `**${cleanName}**\n\n${cleanDesc || '威软导航推荐资源'}\n\n热度: ${clicks}\n\n来源: weiruan.org`,
          source_url: url,
          source_name: 'WeiRuanKeJi',
          category: category,
          image_url: null,
          published_at: new Date().toISOString(),
        })
      }
    }
    
    // 如果正则没有匹配到，尝试另一种方式提取
    if (articles.length === 0) {
      console.log('Trying alternative extraction method...')
      
      // 从links中提取weiruan.org的跳转链接
      const weiruanLinks = links.filter((link: string) => 
        link.includes('weiruan.org/go/')
      )
      
      console.log(`Found ${weiruanLinks.length} weiruan.org redirect links`)
      
      // 从markdown提取名称
      const namePattern = /\*\*([^*]+)\*\*/g
      const names: string[] = []
      let nameMatch
      while ((nameMatch = namePattern.exec(markdown)) !== null) {
        const name = nameMatch[1].trim()
        if (name && name.length < 50 && !name.includes('\\')) {
          names.push(name)
        }
      }
      
      console.log(`Extracted ${names.length} resource names`)
      
      // 匹配名称和链接
      for (let i = 0; i < Math.min(names.length, weiruanLinks.length); i++) {
        articles.push({
          title: `[资源推荐] ${names[i]}`,
          summary: `威软导航推荐资源`,
          content: `**${names[i]}**\n\n威软导航推荐资源\n\n来源: weiruan.org`,
          source_url: weiruanLinks[i],
          source_name: 'WeiRuanKeJi',
          category: category,
          image_url: null,
          published_at: new Date().toISOString(),
        })
      }
    }
    
    // 去重
    const uniqueArticles = articles.filter((article, index, self) =>
      index === self.findIndex(a => a.title === article.title)
    )
    
    console.log(`Found ${uniqueArticles.length} WeiRuanKeJi resources`)
    return uniqueArticles
  } catch (error) {
    console.error('Error crawling weiruan.org:', error)
    return []
  }
}

// 通用深度抓取函数 - 增强稳定性
async function crawlSiteDeep(
  firecrawlApiKey: string,
  siteUrl: string,
  sourceName: string,
  category: string
): Promise<NewsArticle[]> {
  console.log(`Deep crawling ${siteUrl} for ALL content...`)
  
  try {
    // 首先使用 map API 获取网站所有URL
    console.log(`Step 1: Mapping ${siteUrl} to discover all URLs...`)
    const mapResponse = await fetchWithRetry(
      'https://api.firecrawl.dev/v1/map',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: siteUrl,
          limit: 2000, // 减少限制以提高稳定性
          includeSubdomains: false,
        }),
      },
      2,
      20000
    )
    
    let urlsToScrape: string[] = []
    
    if (mapResponse) {
      try {
        const mapData = await mapResponse.json()
        urlsToScrape = mapData.data?.links || mapData.links || []
        console.log(`Found ${urlsToScrape.length} URLs from ${siteUrl}`)
      } catch (e) {
        console.error('Failed to parse map response:', e)
      }
    }
    
    // 过滤出文章URL，排除登录页、管理页等无实际内容的页面
    const newsUrls = urlsToScrape.filter(url => {
      const isArticle = url.includes('/20') || 
                       url.includes('/news/') ||
                       url.includes('/article/') ||
                       url.includes('/post/') ||
                       url.includes('/blog/') ||
                       url.match(/\/\d{4}\/\d{2}\//)
      const isNotAsset = !url.match(/\.(jpg|png|gif|css|js|pdf)$/i)
      // 排除非内容页面
      const isNotExcluded = !isExcludedUrl(url)
      return isArticle && isNotAsset && isNotExcluded
    })
    
    console.log(`Filtered to ${newsUrls.length} potential article URLs`)
    
    // Step 2: 使用 crawl API 深度抓取 - 减少配置以提高稳定性
    console.log(`Step 2: Starting crawl job for ${siteUrl}...`)
    const crawlStartResponse = await fetchWithRetry(
      'https://api.firecrawl.dev/v1/crawl',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: siteUrl,
          limit: 100, // 减少限制以提高稳定性
          maxDepth: 3, // 减少深度
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
      },
      2,
      30000
    )

    if (!crawlStartResponse) {
      console.error(`Failed to start crawl for ${siteUrl}`)
      return scrapeNewsFromUrl(firecrawlApiKey, siteUrl, sourceName, category)
    }

    let crawlStartData
    try {
      crawlStartData = await crawlStartResponse.json()
      console.log('Crawl response:', JSON.stringify(crawlStartData).substring(0, 300))
    } catch (e) {
      console.error('Failed to parse crawl start response:', e)
      return scrapeNewsFromUrl(firecrawlApiKey, siteUrl, sourceName, category)
    }

    const crawlId = crawlStartData.id
    if (!crawlId) {
      console.error('Crawl did not return an id')
      return scrapeNewsFromUrl(firecrawlApiKey, siteUrl, sourceName, category)
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    // 轮询最多 ~30 秒
    let crawlResult: any = null
    for (let attempt = 0; attempt < 10; attempt++) {
      await sleep(3000)

      const statusResp = await fetchWithRetry(
        `https://api.firecrawl.dev/v1/crawl/${crawlId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
        },
        1,
        10000
      )

      if (!statusResp) {
        console.error(`Failed to check crawl status`)
        continue
      }

      try {
        const statusData = await statusResp.json()
        const status = statusData.status || statusData.data?.status
        console.log(`Crawl status (attempt ${attempt + 1}/10): ${status}`)

        if (status === 'completed') {
          crawlResult = statusData
          break
        }

        if (status === 'failed' || status === 'cancelled') {
          console.error('Crawl failed:', JSON.stringify(statusData).substring(0, 300))
          break
        }
      } catch (e) {
        console.error('Failed to parse status response:', e)
      }
    }

    if (!crawlResult) {
      console.log('Crawl did not complete in time, falling back to scrape')
      return scrapeNewsFromUrl(firecrawlApiKey, siteUrl, sourceName, category)
    }

    const articles: NewsArticle[] = []

    // 处理爬取结果
    const pages = Array.isArray(crawlResult.data)
      ? crawlResult.data
      : Array.isArray(crawlResult.data?.data)
        ? crawlResult.data.data
        : []

    console.log(`Crawled ${pages.length} pages from ${siteUrl}`)
    
    for (const page of pages) {
      const markdown = page.markdown || page.data?.markdown || ''
      const metadata = page.metadata || page.data?.metadata || {}
      const sourceUrl = metadata.sourceURL || metadata.sourceUrl || page.url || siteUrl
      
      // 检查URL和标题是否应该被排除
      if (isExcludedUrl(sourceUrl)) {
        console.log(`Skipping excluded URL: ${sourceUrl}`)
        continue
      }
      
      if (metadata.title && metadata.title.length > 10 && metadata.title.length < 300 && !isExcludedTitle(metadata.title)) {
        articles.push({
          title: metadata.title,
          summary: metadata.description || null,
          content: markdown.substring(0, 1000) || null,
          source_url: sourceUrl,
          source_name: sourceName,
          category: category,
          image_url: metadata.ogImage || null,
          published_at: new Date().toISOString(),
        })
      }
      
      // 从 markdown 中提取更多标题
      const titleMatches = markdown.match(/^#{1,3}\s+(.+)$/gm) || []
      for (const match of titleMatches.slice(0, 3)) {
        const title = match.replace(/^#+\s+/, '').trim()
        if (title.length >= 10 && title.length <= 300 && !isExcludedTitle(title)) {
          articles.push({
            title: title,
            summary: null,
            content: null,
            source_url: sourceUrl,
            source_name: sourceName,
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
    
    console.log(`Found ${uniqueArticles.length} unique articles from ${siteUrl}`)
    return uniqueArticles
  } catch (error) {
    console.error(`Error crawling ${siteUrl}:`, error)
    // 失败时尝试简单抓取
    return scrapeNewsFromUrl(firecrawlApiKey, siteUrl, sourceName, category)
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
    const response = await fetchWithRetry(
      'https://api.firecrawl.dev/v1/scrape',
      {
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
      },
      2,
      15000
    )

    if (!response) {
      console.error(`Failed to scrape ${url} after retries`)
      return []
    }

    let data
    try {
      data = await response.json()
    } catch (e) {
      console.error(`Failed to parse response from ${url}:`, e)
      return []
    }
    
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
      
      // 检查标题是否应该被排除
      if (isExcludedTitle(title)) {
        console.log(`Skipping excluded title: ${title}`)
        continue
      }
      
      // 尝试从链接中找到对应的文章链接
      const matchedLink = links.find((link: string) => {
        const titleWords = title.toLowerCase().split(' ').filter((w: string) => w.length > 3)
        return titleWords.some((word: string) => link.toLowerCase().includes(word))
      })
      
      const articleUrl = matchedLink || url
      
      // 检查URL是否应该被排除
      if (isExcludedUrl(articleUrl)) {
        console.log(`Skipping excluded URL: ${articleUrl}`)
        continue
      }
      
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
    const errors: string[] = []

    // 特殊处理 cnmdnews.com - 深度抓取
    const cnmdSource = sourcesToScrape.find(s => s.name === 'CNMD News')
    if (cnmdSource) {
      console.log('Deep crawling cnmdnews.com...')
      try {
        const cnmdArticles = await crawlCnmdNews(firecrawlApiKey, cnmdSource.category)
        allArticles.push(...cnmdArticles)
      } catch (e) {
        console.error('CNMD crawl failed:', e)
        errors.push('CNMD News')
      }
      sourcesToScrape = sourcesToScrape.filter(s => s.name !== 'CNMD News')
    }

    // 特殊处理 weiruan.org - 抓取导航资源
    const weiruanSource = sourcesToScrape.find(s => s.name === 'WeiRuanKeJi')
    if (weiruanSource) {
      console.log('Fetching WeiRuanKeJi resources from weiruan.org...')
      try {
        const weiruanArticles = await crawlWeiruanResources(firecrawlApiKey, weiruanSource.category)
        allArticles.push(...weiruanArticles)
      } catch (e) {
        console.error('WeiRuanKeJi fetch failed:', e)
        errors.push('WeiRuanKeJi')
      }
      sourcesToScrape = sourcesToScrape.filter(s => s.name !== 'WeiRuanKeJi')
    }

    // 并行爬取其他新闻源（限制并发数）- 减少批次大小以提高稳定性
    const batchSize = 2
    for (let i = 0; i < sourcesToScrape.length; i += batchSize) {
      const batch = sourcesToScrape.slice(i, i + batchSize)
      const results = await Promise.allSettled(
        batch.map(source => 
          scrapeNewsFromUrl(firecrawlApiKey, source.url, source.name, source.category)
        )
      )
      
      for (let j = 0; j < results.length; j++) {
        const result = results[j]
        if (result.status === 'fulfilled') {
          allArticles.push(...result.value)
        } else {
          console.error(`Failed to scrape ${batch[j].name}:`, result.reason)
          errors.push(batch[j].name)
        }
      }
    }

    console.log(`Total articles scraped: ${allArticles.length}`)
    if (errors.length > 0) {
      console.log(`Sources with errors: ${errors.join(', ')}`)
    }

    // 插入新闻到数据库（批量upsert以提高效率）
    let insertedCount = 0
    const batchInsertSize = 50
    
    for (let i = 0; i < allArticles.length; i += batchInsertSize) {
      const batch = allArticles.slice(i, i + batchInsertSize)
      
      const { error, count } = await supabase
        .from('news_articles')
        .upsert(batch, { 
          onConflict: 'source_url',
          ignoreDuplicates: true 
        })
      
      if (!error) {
        insertedCount += batch.length
      } else {
        console.error('Batch insert error:', error.message)
      }
    }

    console.log(`Inserted ${insertedCount} articles (including updates)`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        scraped: allArticles.length,
        inserted: insertedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in fetch-news function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        partial: true // 表示部分成功
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})