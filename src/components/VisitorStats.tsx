import { useVisitorStats } from '@/hooks/useVisitorStats'
import { Users, Eye, Globe, MapPin, FileText, TrendingUp } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function VisitorStats() {
  const { 
    totalVisitors, 
    onlineCount, 
    totalPageViews, 
    todayPageViews,
    topCountries,
    topCities 
  } = useVisitorStats()

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-muted-foreground">
        {/* 总访客 */}
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>访客: {totalVisitors.toLocaleString()}</span>
        </div>

        {/* 在线人数 */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span>在线: {onlineCount}</span>
        </div>

        {/* 总浏览量 */}
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>浏览: {totalPageViews.toLocaleString()}</span>
        </div>

        {/* 今日浏览 */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span>今日: {todayPageViews.toLocaleString()}</span>
        </div>

        {/* 地区分布 */}
        {topCountries.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <Globe className="h-4 w-4" />
                <span>
                  {topCountries[0]?.country || '未知'} 
                  {topCountries.length > 1 && ` +${topCountries.length - 1}`}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p className="font-semibold mb-2">访客地区分布</p>
                {topCountries.map((c, i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <span>{c.country}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* 城市分布 */}
        {topCities.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <MapPin className="h-4 w-4" />
                <span>
                  {topCities[0]?.city || '未知'}
                  {topCities.length > 1 && ` +${topCities.length - 1}`}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p className="font-semibold mb-2">热门城市</p>
                {topCities.map((c, i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <span>{c.city}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
