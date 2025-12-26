import { motion } from 'framer-motion'
import { RefreshCw, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import weiruanLogo from '@/assets/weiruan-news-logo.jpg'

interface NewsHeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
  lastUpdated: Date | null
}

export function NewsHeader({ onRefresh, isRefreshing, lastUpdated }: NewsHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src={weiruanLogo} alt="WeiRuan Logo" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-foreground">WeiRuan News</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                全球新闻聚合
              </p>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                最后更新: {lastUpdated.toLocaleTimeString('zh-CN')}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? '抓取中...' : '刷新新闻'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}