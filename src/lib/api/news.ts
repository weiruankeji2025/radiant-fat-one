import { supabase } from '@/integrations/supabase/client'

export type NewsCategory = 'politics' | 'military' | 'technology' | 'economy' | 'world' | 'other'

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

export const categoryLabels: Record<NewsCategory, string> = {
  politics: '政治',
  military: '军事',
  technology: '科技',
  economy: '经济',
  world: '国际',
  other: '其他',
}

export const categoryColors: Record<NewsCategory, string> = {
  politics: 'bg-red-500/10 text-red-500 border-red-500/20',
  military: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  technology: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  economy: 'bg-green-500/10 text-green-500 border-green-500/20',
  world: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
}