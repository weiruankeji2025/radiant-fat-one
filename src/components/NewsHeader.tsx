import { motion } from 'framer-motion'
import { RefreshCw, Globe, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserMenu } from '@/components/UserMenu'
import weiruanLogo from '@/assets/weiruan-news-logo.jpg'
import { useState } from 'react'

interface NewsHeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
  lastUpdated: Date | null
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function NewsHeader({ onRefresh, isRefreshing, lastUpdated, searchQuery, onSearchChange }: NewsHeaderProps) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 flex-shrink-0"
          >
            <img src={weiruanLogo} alt="WeiRuan Logo" className="w-10 h-10 object-contain rounded-lg" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground">WeiRuan News</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" />
                全球新闻聚合
              </p>
            </div>
          </motion.div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索新闻标题或内容..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-10 bg-muted/50"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => onSearchChange('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground hidden lg:block mr-2">
                最后更新: {lastUpdated.toLocaleTimeString('zh-CN')}
              </span>
            )}
            
            {/* Search Toggle - Mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isRefreshing ? '抓取中...' : '刷新新闻'}</span>
            </Button>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索新闻标题或内容..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-10 bg-muted/50"
                autoFocus
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => onSearchChange('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  )
}