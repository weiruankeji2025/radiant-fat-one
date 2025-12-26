import { supabase } from '@/integrations/supabase/client'

export type NewsCategory = 'politics' | 'military' | 'technology' | 'economy' | 'world' | 'china_us' | 'russia_ukraine' | 'korea' | 'southeast_asia' | 'other'

export interface NewsArticle {
  id: string
  title: string
  summary: string | null
  content: string | null
  source_url: string
  source_name: string
  category: NewsCategory
  image_url: string | null
  published_at: string | null
  fetched_at: string
  created_at: string
}

export async function fetchNews(category?: NewsCategory, limit = 50): Promise<NewsArticle[]> {
  let query = supabase
    .from('news_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching news:', error)
    return []
  }

  return data as NewsArticle[]
}

export async function refreshNews(category?: NewsCategory): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-news', {
      body: category ? { category } : {},
    })

    if (error) {
      console.error('Error refreshing news:', error)
      return { success: false, message: error.message }
    }

    return { 
      success: true, 
      message: `已抓取 ${data.scraped} 条新闻，新增 ${data.inserted} 条` 
    }
  } catch (error) {
    console.error('Error calling refresh:', error)
    return { success: false, message: '刷新失败' }
  }
}

export async function translateArticle(
  title: string, 
  summary: string | null, 
  targetLang: string
): Promise<{ translatedTitle: string; translatedSummary: string | null }> {
  const { data, error } = await supabase.functions.invoke('translate-news', {
    body: { title, summary, targetLang },
  })

  if (error) {
    console.error('Translation error:', error)
    throw new Error('Translation failed')
  }

  return data
}

export const categoryLabels: Record<NewsCategory, string> = {
  politics: '政治',
  military: '军事',
  technology: '科技',
  economy: '经济',
  world: '国际',
  china_us: '中美',
  russia_ukraine: '俄乌',
  korea: '朝韩',
  southeast_asia: '东南亚',
  other: '其他',
}

export const categoryColors: Record<NewsCategory, string> = {
  politics: 'bg-red-500/10 text-red-500 border-red-500/20',
  military: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  technology: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  economy: 'bg-green-500/10 text-green-500 border-green-500/20',
  world: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  china_us: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  russia_ukraine: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  korea: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  southeast_asia: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}

export const supportedLanguages = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
]