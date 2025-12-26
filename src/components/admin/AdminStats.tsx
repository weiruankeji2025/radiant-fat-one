import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Eye, 
  FileText, 
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

interface Stats {
  totalVisitors: number
  onlineCount: number
  totalPageViews: number
  todayPageViews: number
  deviceDistribution: { name: string; value: number }[]
  browserDistribution: { name: string; value: number }[]
  countryDistribution: { name: string; value: number }[]
  dailyTrend: { date: string; views: number; visitors: number }[]
  hourlyTrend: { hour: string; views: number }[]
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats>({
    totalVisitors: 0,
    onlineCount: 0,
    totalPageViews: 0,
    todayPageViews: 0,
    deviceDistribution: [],
    browserDistribution: [],
    countryDistribution: [],
    dailyTrend: [],
    hourlyTrend: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)

    // Total visitors
    const { count: totalVisitors } = await supabase
      .from('visitor_stats')
      .select('*', { count: 'exact', head: true })

    // Online count
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { count: onlineCount } = await supabase
      .from('visitor_stats')
      .select('*', { count: 'exact', head: true })
      .eq('session_active', true)
      .gte('last_active_at', fiveMinutesAgo)

    // Total page views
    const { count: totalPageViews } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })

    // Today page views
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { count: todayPageViews } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', todayStart.toISOString())

    // Device distribution
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

    // Browser distribution
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

    // Country distribution
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
    const countryDistribution = Object.entries(countryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    // 7-day trend
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: trendData } = await supabase
      .from('page_views')
      .select('viewed_at, visitor_id')
      .gte('viewed_at', sevenDaysAgo.toISOString())

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

    // Hourly trend for today
    const { data: todayData } = await supabase
      .from('page_views')
      .select('viewed_at')
      .gte('viewed_at', todayStart.toISOString())

    const hourlyStats: Record<string, number> = {}
    for (let i = 0; i < 24; i++) {
      hourlyStats[`${i}:00`] = 0
    }

    todayData?.forEach(row => {
      const hour = new Date(row.viewed_at).getHours()
      hourlyStats[`${hour}:00`]++
    })

    const hourlyTrend = Object.entries(hourlyStats).map(([hour, views]) => ({
      hour,
      views
    }))

    setStats({
      totalVisitors: totalVisitors || 0,
      onlineCount: onlineCount || 0,
      totalPageViews: totalPageViews || 0,
      todayPageViews: todayPageViews || 0,
      deviceDistribution,
      browserDistribution,
      countryDistribution,
      dailyTrend,
      hourlyTrend
    })
    setLoading(false)
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case '手机': return <Smartphone className="h-4 w-4" />
      case '平板': return <Tablet className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总访客数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisitors.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">当前在线</CardTitle>
            <div className="relative">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.onlineCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPageViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">今日浏览</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.todayPageViews.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">7天访问趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    name="浏览量"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="visitors" 
                    name="访客数"
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">今日时段分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.hourlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="views" name="浏览量" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">设备分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {stats.deviceDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.deviceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.deviceDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Browser Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">浏览器分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {stats.browserDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.browserDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.browserDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Country Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              地区分布 TOP 10
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {stats.countryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.countryDistribution} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={55} />
                    <Tooltip />
                    <Bar dataKey="value" name="访客数" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
