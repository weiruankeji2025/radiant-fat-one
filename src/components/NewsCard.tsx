import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Clock, Loader2, Heart } from 'lucide-react'
import { NewsArticle, categoryLabels, categoryColors, translateArticle } from '@/lib/api/news'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import newsPlaceholder from '@/assets/news-placeholder.jpg'

interface NewsCardProps {
  article: NewsArticle
  index: number
}

export function NewsCard({ article, index }: NewsCardProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null)
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const formattedDate = article.published_at 
    ? new Date(article.published_at).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  // Check auth state and favorite status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id)
        checkFavoriteStatus(session.user.id)
      }
    })
  }, [article.id])

  const checkFavoriteStatus = async (uid: string) => {
    const { data } = await supabase
      .from('news_favorites')
      .select('id')
      .eq('user_id', uid)
      .eq('article_id', article.id)
      .maybeSingle()
    
    setIsFavorite(!!data)
  }

  // Auto-translate to Simplified Chinese on mount using free MyMemory API
  useEffect(() => {
    const autoTranslate = async () => {
      setIsTranslating(true)
      try {
        const result = await translateArticle(article.title, article.summary, 'zh-CN')
        setTranslatedTitle(result.translatedTitle)
        setTranslatedSummary(result.translatedSummary)
      } catch (error) {
        console.error('Auto-translate failed:', error)
      } finally {
        setIsTranslating(false)
      }
    }
    autoTranslate()
  }, [article.id, article.title, article.summary])

  const handleArticleClick = async () => {
    if (!userId) return
    
    // Record view
    await supabase
      .from('news_views')
      .upsert({
        user_id: userId,
        article_id: article.id,
        viewed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,article_id' })
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!userId) return

    if (isFavorite) {
      await supabase
        .from('news_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('article_id', article.id)
      setIsFavorite(false)
    } else {
      await supabase
        .from('news_favorites')
        .insert({
          user_id: userId,
          article_id: article.id,
        })
      setIsFavorite(true)
    }
  }

  const displayTitle = translatedTitle || article.title
  const displaySummary = translatedSummary !== undefined ? translatedSummary : article.summary

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300"
    >
      {/* Article Image */}
      <a
        href={article.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        onClick={handleArticleClick}
      >
        <div className="relative w-full h-40 overflow-hidden bg-muted">
          <img
            src={article.image_url || newsPlaceholder}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = newsPlaceholder
            }}
          />
        </div>
      </a>

      <div className="block p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge 
            variant="outline" 
            className={`text-xs ${categoryColors[article.category]}`}
          >
            {categoryLabels[article.category]}
          </Badge>
          <div className="flex items-center gap-1">
            {isTranslating && (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            )}
            {userId && (
              <button
                onClick={handleFavoriteClick}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <Heart 
                  className={`w-4 h-4 transition-colors ${
                    isFavorite 
                      ? 'fill-red-500 text-red-500' 
                      : 'text-muted-foreground hover:text-red-500'
                  }`} 
                />
              </button>
            )}
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleArticleClick}
            >
              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </a>
          </div>
        </div>

        {/* Title */}
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleArticleClick}
        >
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {displayTitle}
          </h3>
        </a>

        {/* Summary */}
        {displaySummary && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {displaySummary}
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
      </div>

      {/* Hover accent */}
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary via-accent-cyan to-accent-violet opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.article>
  )
}
