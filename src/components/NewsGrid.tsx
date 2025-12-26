import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react'
import { NewsArticle } from '@/lib/api/news'
import { NewsCard } from './NewsCard'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'

interface NewsGridProps {
  articles: NewsArticle[]
  isLoading: boolean
}

export function NewsGrid({ articles, isLoading }: NewsGridProps) {
  const isMobile = useIsMobile()
  const [currentPage, setCurrentPage] = useState(1)
  
  const itemsPerPage = isMobile ? 5 : articles.length
  const totalPages = Math.ceil(articles.length / itemsPerPage)
  
  const paginatedArticles = isMobile 
    ? articles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : articles

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {paginatedArticles.map((article, index) => (
            <NewsCard key={article.id} article={article} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile Pagination */}
      {isMobile && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 pt-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          
          <div className="flex items-center gap-1 px-3">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="gap-1"
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  )
}