import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface VisitorStats {
  totalVisitors: number
  onlineCount: number
}

export function useVisitorStats() {
  const [stats, setStats] = useState<VisitorStats>({ totalVisitors: 0, onlineCount: 0 })

  useEffect(() => {
    // 生成或获取访客ID
    let visitorId = localStorage.getItem('visitor_id')
    if (!visitorId) {
      visitorId = crypto.randomUUID()
      localStorage.setItem('visitor_id', visitorId)
    }

    // 记录访客
    const recordVisitor = async () => {
      await supabase
        .from('visitor_stats')
        .upsert({
          visitor_id: visitorId,
          session_active: true,
          last_active_at: new Date().toISOString(),
        }, {
          onConflict: 'visitor_id'
        })
    }

    // 更新活跃状态
    const updateActivity = async () => {
      await supabase
        .from('visitor_stats')
        .update({
          session_active: true,
          last_active_at: new Date().toISOString(),
        })
        .eq('visitor_id', visitorId)
    }

    // 获取统计数据
    const fetchStats = async () => {
      // 总访客数
      const { count: totalCount } = await supabase
        .from('visitor_stats')
        .select('*', { count: 'exact', head: true })

      // 在线人数（5分钟内活跃）
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { count: onlineCount } = await supabase
        .from('visitor_stats')
        .select('*', { count: 'exact', head: true })
        .eq('session_active', true)
        .gte('last_active_at', fiveMinutesAgo)

      setStats({
        totalVisitors: totalCount || 0,
        onlineCount: onlineCount || 0,
      })
    }

    // 初始化
    recordVisitor()
    fetchStats()

    // 定期更新活跃状态
    const activityInterval = setInterval(updateActivity, 60000) // 每分钟
    const statsInterval = setInterval(fetchStats, 30000) // 每30秒刷新统计

    // 监听实时变化
    const channel = supabase
      .channel('visitor-stats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_stats' },
        () => fetchStats()
      )
      .subscribe()

    // 页面关闭时标记离线
    const handleBeforeUnload = () => {
      navigator.sendBeacon && supabase
        .from('visitor_stats')
        .update({ session_active: false })
        .eq('visitor_id', visitorId)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(activityInterval)
      clearInterval(statsInterval)
      supabase.removeChannel(channel)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return stats
}
