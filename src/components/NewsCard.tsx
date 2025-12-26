import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Clock, Languages, Loader2 } from 'lucide-react'
import { NewsArticle, categoryLabels, categoryColors, translateArticle, supportedLanguages } from '@/lib/api/news'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface NewsCardProps {
  article: NewsArticle
  index: number
}

export function NewsCard({ article, index }: NewsCardProps) {
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null)
  const [translatedSummary, setTranslatedSummary] = useState<string | null>(null)
  const [currentLang, setCurrentLang] = useState<string | null>(null)
  const { toast } = useToast()

  const formattedDate = article.published_at 
    ? new Date(article.published_at).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const handleTranslate = async (langCode: string) => {
    if (langCode === currentLang) {
      // Reset to original
      setTranslatedTitle(null)
      setTranslatedSummary(null)
      setCurrentLang(null)
      return
    }

    setIsTranslating(true)
    try {
      const result = await translateArticle(article.title, article.summary, langCode)
      setTranslatedTitle(result.translatedTitle)
      setTranslatedSummary(result.translatedSummary)
      setCurrentLang(langCode)
    } catch (error) {
      toast({
        title: '翻译失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setIsTranslating(false)
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isTranslating}
                >
                  {isTranslating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Languages className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentLang && (
                  <DropdownMenuItem onClick={() => handleTranslate(currentLang)}>
                    显示原文
                  </DropdownMenuItem>
                )}
                {supportedLanguages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code} 
                    onClick={() => handleTranslate(lang.code)}
                    className={currentLang === lang.code ? 'bg-accent' : ''}
                  >
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
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
        >
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {displayTitle}
            {currentLang && (
              <Badge variant="secondary" className="ml-2 text-xs">
                已翻译
              </Badge>
            )}
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
