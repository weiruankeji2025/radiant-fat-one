import { motion } from 'framer-motion'
import { ExternalLink, Clock } from 'lucide-react'
import { NewsArticle, categoryLabels, categoryColors } from '@/lib/api/news'
import { Badge } from '@/components/ui/badge'

interface NewsCardProps {
  article: NewsArticle
  index: number
}

export function NewsCard({ article, index }: NewsCardProps) {
  const formattedDate = article.published_at 
    ? new Date(article.published_at).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300"
    >
      <a
        href={article.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge 
            variant="outline" 
            className={`text-xs ${categoryColors[article.category]}`}
          >
            {categoryLabels[article.category]}
          </Badge>
          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {article.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{article.source_name}</span>
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formattedDate}
            </span>
          )}
        </div>
      </a>

      {/* Hover accent */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary via-accent-cyan to-accent-violet opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.article>
  )
}