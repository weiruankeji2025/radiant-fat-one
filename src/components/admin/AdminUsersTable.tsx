import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, RefreshCw, Shield, User } from 'lucide-react'

interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  email?: string
  role?: 'admin' | 'moderator' | 'user' | null
}

export function AdminUsersTable() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    
    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      toast.error('获取用户列表失败')
      setLoading(false)
      return
    }

    // Get roles for each user
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')

    const rolesMap: Record<string, string> = {}
    roles?.forEach(r => {
      rolesMap[r.user_id] = r.role
    })

    const usersWithRoles = profiles?.map(p => ({
      ...p,
      role: rolesMap[p.user_id] as 'admin' | 'moderator' | 'user' | undefined
    })) || []

    setUsers(usersWithRoles)
    setLoading(false)
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId)

    if (newRole === 'none') {
      // Remove role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      if (error) {
        toast.error('更新角色失败: ' + error.message)
      } else {
        toast.success('角色已移除')
        setUsers(users.map(u => 
          u.user_id === userId ? { ...u, role: undefined } : u
        ))
      }
    } else {
      // Upsert role
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole as 'admin' | 'moderator' | 'user'
        }, {
          onConflict: 'user_id,role'
        })

      if (error) {
        toast.error('更新角色失败: ' + error.message)
      } else {
        toast.success('角色已更新')
        setUsers(users.map(u => 
          u.user_id === userId ? { ...u, role: newRole as 'admin' | 'moderator' | 'user' } : u
        ))
      }
    }

    setUpdating(null)
  }

  const filteredUsers = users.filter(user =>
    (user.display_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
    user.user_id.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadge = (role: string | undefined) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="h-3 w-3" /> 管理员</Badge>
      case 'moderator':
        return <Badge variant="secondary" className="flex items-center gap-1"><User className="h-3 w-3" /> 版主</Badge>
      case 'user':
        return <Badge variant="outline">用户</Badge>
      default:
        return <Badge variant="outline" className="text-muted-foreground">普通用户</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">用户管理</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户ID</TableHead>
                <TableHead>显示名称</TableHead>
                <TableHead>当前角色</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>设置角色</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无用户
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {user.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.display_name || '未设置'}
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role || 'none'}
                        onValueChange={(value) => handleRoleChange(user.user_id, value)}
                        disabled={updating === user.user_id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">普通用户</SelectItem>
                          <SelectItem value="user">用户</SelectItem>
                          <SelectItem value="moderator">版主</SelectItem>
                          <SelectItem value="admin">管理员</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          共 {filteredUsers.length} 个用户
        </p>
      </CardContent>
    </Card>
  )
}
