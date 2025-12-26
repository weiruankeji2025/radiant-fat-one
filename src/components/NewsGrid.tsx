import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Newspaper } from 'lucide-react'
import { NewsArticle } from '@/lib/api/news'
import { NewsCard } from './NewsCard'

interface NewsGridProps {
  articles: NewsArticle[]
  isLoading: boolean
}

export function NewsGrid({ articles, isLoading }: NewsGridProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">加载新闻中...</p>
      </div>
    )
  }

  if (articles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <Newspaper className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">暂无新闻</h3>
        <p className="text-muted-foreground max-w-sm">
          点击"刷新新闻"按钮开始抓取全球最新资讯
        </p>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {articles.map((article, index) => (
          <NewsCard key={article.id} article={article} index={index} />
        ))}
      </AnimatePresence>
    </div>
  )
}