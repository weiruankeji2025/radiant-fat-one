import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Loader2, 
  Trash2, 
  Users, 
  Newspaper, 
  BarChart3,
  Shield,
  RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminStats } from '@/components/admin/AdminStats'
import { AdminNewsTable } from '@/components/admin/AdminNewsTable'
import { AdminUsersTable } from '@/components/admin/AdminUsersTable'

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, isAdmin, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth')
    }
  }, [user, isLoading, navigate])

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      toast.error('您没有管理员权限')
      navigate('/')
    }
  }, [isAdmin, isLoading, user, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

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
          <Badge variant="secondary">管理员</Badge>
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
        </Tabs>
      </div>
    </div>
  )
}
