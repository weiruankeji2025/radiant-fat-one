import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface VisitorStats {
  totalVisitors: number
  onlineCount: number
  totalPageViews: number
  todayPageViews: number
  topCountries: { country: string; count: number }[]
  topCities: { city: string; count: number }[]
  deviceDistribution: { name: string; value: number }[]
  browserDistribution: { name: string; value: number }[]
  dailyTrend: { date: string; views: number; visitors: number }[]
}

// 检测设备类型
function getDeviceType(): string {
  const ua = navigator.userAgent
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    return /iPad|Tablet/.test(ua) ? '平板' : '手机'
  }
  return '电脑'
}

// 检测浏览器
function getBrowser(): string {
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edge')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  return '其他'
}

// 获取地理位置信息
async function getGeoInfo(): Promise<{ country?: string; city?: string; region?: string }> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    if (response.ok) {
      const data = await response.json()
      return {
        country: data.country_name,
        city: data.city,
        region: data.region
      }
    }
  } catch (e) {
    console.log('Failed to get geo info')
  }
  return {}
}

export function useVisitorStats() {
  const [stats, setStats] = useState<VisitorStats>({
    totalVisitors: 0,
    onlineCount: 0,
    totalPageViews: 0,
    todayPageViews: 0,
    topCountries: [],
    topCities: [],
    deviceDistribution: [],
    browserDistribution: [],
    dailyTrend: []
  })

  useEffect(() => {
    // 生成或获取访客ID
    let visitorId = localStorage.getItem('visitor_id')
    if (!visitorId) {
      visitorId = crypto.randomUUID()
      localStorage.setItem('visitor_id', visitorId)
    }

    // 记录访客和页面浏览
    const recordVisitor = async () => {
      const geoInfo = await getGeoInfo()
      const deviceType = getDeviceType()
      const browser = getBrowser()

      // 更新访客信息
      await supabase
        .from('visitor_stats')
        .upsert({
          visitor_id: visitorId,
          session_active: true,
          last_active_at: new Date().toISOString(),
          country: geoInfo.country,
          city: geoInfo.city,
          region: geoInfo.region,
          device_type: deviceType,
          browser: browser
        }, {
          onConflict: 'visitor_id'
        })

      // 记录页面浏览
      await supabase
        .from('page_views')
        .insert({
          visitor_id: visitorId,
          page_path: window.location.pathname,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent
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

      // 总页面浏览量
      const { count: totalPageViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })

      // 今日页面浏览量
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { count: todayPageViews } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })
        .gte('viewed_at', todayStart.toISOString())

      // 获取国家分布（前5）
      const { data: countryData } = await supabase
        .from('visitor_stats')
        .select('country')
        .not('country', 'is', null)

      const countryCounts: Record<string, number> = {}
      countryData?.forEach(row => {
        if (row.country) {
          countryCounts[row.country] = (countryCounts[row.country] || 0) + 1
        }
      })
      const topCountries = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // 获取城市分布（前5）
      const { data: cityData } = await supabase
        .from('visitor_stats')
        .select('city')
        .not('city', 'is', null)

      const cityCounts: Record<string, number> = {}
      cityData?.forEach(row => {
        if (row.city) {
          cityCounts[row.city] = (cityCounts[row.city] || 0) + 1
        }
      })
      const topCities = Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // 设备分布
      const { data: deviceData } = await supabase
        .from('visitor_stats')
        .select('device_type')
        .not('device_type', 'is', null)

      const deviceCounts: Record<string, number> = {}
      deviceData?.forEach(row => {
        if (row.device_type) {
          deviceCounts[row.device_type] = (deviceCounts[row.device_type] || 0) + 1
        }
      })
      const deviceDistribution = Object.entries(deviceCounts)
        .map(([name, value]) => ({ name, value }))

      // 浏览器分布
      const { data: browserData } = await supabase
        .from('visitor_stats')
        .select('browser')
        .not('browser', 'is', null)

      const browserCounts: Record<string, number> = {}
      browserData?.forEach(row => {
        if (row.browser) {
          browserCounts[row.browser] = (browserCounts[row.browser] || 0) + 1
        }
      })
      const browserDistribution = Object.entries(browserCounts)
        .map(([name, value]) => ({ name, value }))

      // 7天访问趋势
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const { data: trendData } = await supabase
        .from('page_views')
        .select('viewed_at, visitor_id')
        .gte('viewed_at', sevenDaysAgo.toISOString())
        .order('viewed_at', { ascending: true })

      // 按日期分组
      const dailyStats: Record<string, { views: number; visitors: Set<string> }> = {}
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
        dailyStats[dateStr] = { views: 0, visitors: new Set() }
      }

      trendData?.forEach(row => {
        const date = new Date(row.viewed_at)
        const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
        if (dailyStats[dateStr]) {
          dailyStats[dateStr].views++
          dailyStats[dateStr].visitors.add(row.visitor_id)
        }
      })

      const dailyTrend = Object.entries(dailyStats).map(([date, data]) => ({
        date,
        views: data.views,
        visitors: data.visitors.size
      }))

      setStats({
        totalVisitors: totalCount || 0,
        onlineCount: onlineCount || 0,
        totalPageViews: totalPageViews || 0,
        todayPageViews: todayPageViews || 0,
        topCountries,
        topCities,
        deviceDistribution,
        browserDistribution,
        dailyTrend
      })
    }

    // 初始化
    recordVisitor()
    fetchStats()

    // 定期更新活跃状态
    const activityInterval = setInterval(updateActivity, 60000)
    const statsInterval = setInterval(fetchStats, 30000)

    // 监听实时变化
    const channel = supabase
      .channel('visitor-stats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_stats' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_views' },
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
