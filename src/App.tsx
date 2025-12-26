import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { NewsHeader } from '@/components/NewsHeader'
import { NewsCategoryTabs } from '@/components/NewsCategoryTabs'
import { NewsGrid } from '@/components/NewsGrid'
import { NewsFooter } from '@/components/NewsFooter'
import { fetchNews, refreshNews, NewsCategory, NewsArticle } from '@/lib/api/news'
import { supabase } from '@/integrations/supabase/client'

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [activeCategory, setActiveCategory] = useState<NewsCategory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const { toast } = useToast()

  const loadNews = useCallback(async () => {
    setIsLoading(true)
    const data = await fetchNews(activeCategory ?? undefined)
    setArticles(data)
    setIsLoading(false)
    if (data.length > 0) {
      setLastUpdated(new Date())
    }
  }, [activeCategory])

  // 初始加载
  useEffect(() => {
    loadNews()
  }, [loadNews])

  // 实时订阅新闻更新
  useEffect(() => {
    const channel = supabase
      .channel('news-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_articles',
        },
        (payload) => {
          console.log('New article:', payload.new)
          setArticles(prev => {
            const newArticle = payload.new as NewsArticle
            // 如果当前有分类筛选，检查新文章是否匹配
            if (activeCategory && newArticle.category !== activeCategory) {
              return prev
            }
            // 添加到顶部
            return [newArticle, ...prev]
          })
          setLastUpdated(new Date())
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeCategory])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    const result = await refreshNews(activeCategory ?? undefined)
    
    toast({
      title: result.success ? '刷新成功' : '刷新失败',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    })
    
    if (result.success) {
      await loadNews()
    }
    setIsRefreshing(false)
  }

  const handleCategoryChange = (category: NewsCategory | null) => {
    setActiveCategory(category)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NewsHeader 
        onRefresh={handleRefresh} 
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />
      
      <NewsCategoryTabs 
        activeCategory={activeCategory} 
        onCategoryChange={handleCategoryChange} 
      />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <NewsGrid articles={articles} isLoading={isLoading} />
      </main>
      
      <NewsFooter />
      <Toaster />
    </div>
  )
}