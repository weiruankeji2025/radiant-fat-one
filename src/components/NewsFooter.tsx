import weiruanLogo from '@/assets/weiruan-news-logo.jpg'
import { VisitorStats } from './VisitorStats'

export function NewsFooter() {
  return (
    <footer className="border-t border-border bg-card mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={weiruanLogo} alt="WeiRuan Logo" className="w-8 h-8 object-contain" />
            <span className="font-semibold text-foreground">WeiRuan News</span>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            自动聚合全球主流媒体新闻 · 政治 · 军事 · 科技 · 经济
          </p>
          
          <VisitorStats />
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50 flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} WeiRuan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}