import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  fetchFriendLinks,
  createFriendLink,
  updateFriendLink,
  deleteFriendLink,
  FriendLink,
} from '@/lib/api/friendLinks'

interface FormData {
  name: string
  url: string
  description: string
  logo_url: string
  sort_order: number
  is_active: boolean
}

const defaultFormData: FormData = {
  name: '',
  url: '',
  description: '',
  logo_url: '',
  sort_order: 0,
  is_active: true,
}

export function AdminFriendLinks() {
  const [links, setLinks] = useState<FriendLink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLink, setEditingLink] = useState<FriendLink | null>(null)
  const [formData, setFormData] = useState<FormData>(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)

  const loadLinks = async () => {
    setIsLoading(true)
    const data = await fetchFriendLinks()
    setLinks(data)
    setIsLoading(false)
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const handleOpenDialog = (link?: FriendLink) => {
    if (link) {
      setEditingLink(link)
      setFormData({
        name: link.name,
        url: link.url,
        description: link.description || '',
        logo_url: link.logo_url || '',
        sort_order: link.sort_order,
        is_active: link.is_active,
      })
    } else {
      setEditingLink(null)
      setFormData(defaultFormData)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingLink(null)
    setFormData(defaultFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error('名称和链接不能为空')
      return
    }

    // Basic URL validation
    try {
      new URL(formData.url)
    } catch {
      toast.error('请输入有效的URL')
      return
    }

    setIsSaving(true)
    try {
      if (editingLink) {
        await updateFriendLink(editingLink.id, {
          name: formData.name.trim(),
          url: formData.url.trim(),
          description: formData.description.trim() || null,
          logo_url: formData.logo_url.trim() || null,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        })
        toast.success('友链已更新')
      } else {
        await createFriendLink({
          name: formData.name.trim(),
          url: formData.url.trim(),
          description: formData.description.trim() || null,
          logo_url: formData.logo_url.trim() || null,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        })
        toast.success('友链已添加')
      }
      handleCloseDialog()
      loadLinks()
    } catch (error) {
      toast.error(editingLink ? '更新失败' : '添加失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个友链吗？')) return

    try {
      await deleteFriendLink(id)
      toast.success('友链已删除')
      loadLinks()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleToggleActive = async (link: FriendLink) => {
    try {
      await updateFriendLink(link.id, { is_active: !link.is_active })
      toast.success(link.is_active ? '已隐藏' : '已显示')
      loadLinks()
    } catch (error) {
      toast.error('操作失败')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">友情链接管理</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              添加友链
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingLink ? '编辑友链' : '添加友链'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="网站名称"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">链接 *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="网站描述（可选）"
                  maxLength={200}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png（可选）"
                  maxLength={500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">排序</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">数字越小越靠前</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">启用</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  取消
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : links.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无友链，点击上方按钮添加
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">排序</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>链接</TableHead>
                <TableHead className="w-20">状态</TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <span className="text-muted-foreground">{link.sort_order}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {link.logo_url && (
                        <img
                          src={link.logo_url}
                          alt=""
                          className="w-5 h-5 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <span className="font-medium">{link.name}</span>
                    </div>
                    {link.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {link.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {link.url.length > 40 ? link.url.substring(0, 40) + '...' : link.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={link.is_active}
                      onCheckedChange={() => handleToggleActive(link)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(link)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(link.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
