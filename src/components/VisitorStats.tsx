import { useVisitorStats } from '@/hooks/useVisitorStats'
import { Users, Eye } from 'lucide-react'

export function VisitorStats() {
  const { totalVisitors, onlineCount } = useVisitorStats()

  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span>访客: {totalVisitors.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Users className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <span>在线: {onlineCount}</span>
      </div>
    </div>
  )
}
