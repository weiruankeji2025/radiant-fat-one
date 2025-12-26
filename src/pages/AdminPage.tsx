import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Loader2, 
  Users, 
  Newspaper, 
  BarChart3,
  Shield,
  Lock,
  Link2
} from 'lucide-react'
import { AdminStats } from '@/components/admin/AdminStats'
import { AdminNewsTable } from '@/components/admin/AdminNewsTable'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'
import { AdminFriendLinks } from '@/components/admin/AdminFriendLinks'
import type { User } from '@supabase/supabase-js'

export default function AdminPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null) // null = still checking
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setUser(null)
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      setUser(session.user)

      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle()

      setIsAdmin(!!roleData)
      setIsLoading(false)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        setUser(null)
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">验证权限中...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">需要登录</h1>
          <p className="text-muted-foreground mb-6">
            请先登录后再访问管理后台
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" asChild>
              <Link to="/">返回首页</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">去登录</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">权限不足</h1>
          <p className="text-muted-foreground mb-6">
            您没有管理员权限，无法访问后台管理。如需权限请联系管理员。
          </p>
          <Button variant="outline" asChild>
            <Link to="/">返回首页</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Admin view
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">管理后台</h1>
            </div>
          </div>
          <Badge variant="secondary">管理员: {user.email}</Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              访客统计
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              新闻管理
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              友情链接
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <AdminStats />
          </TabsContent>

          <TabsContent value="news">
            <AdminNewsTable />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTable />
          </TabsContent>

          <TabsContent value="links">
            <AdminFriendLinks />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
