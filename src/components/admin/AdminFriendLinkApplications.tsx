import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchApplications,
  approveApplication,
  rejectApplication,
  deleteApplication,
  FriendLinkApplication,
} from '@/lib/api/friendLinkApplications'
import {
  Check,
  X,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'

export function AdminFriendLinkApplications() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<FriendLinkApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadApplications = async () => {
    setLoading(true)
    const data = await fetchApplications()
    setApplications(data)
    setLoading(false)
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const handleApprove = async (id: string) => {
    if (!user) return
    setProcessingId(id)
    try {
      await approveApplication(id, user.id)
      toast.success('已通过申请并添加友链')
      loadApplications()
    } catch (error) {
      console.error('Error approving:', error)
      toast.error('操作失败')
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectDialog = (id: string) => {
    setSelectedId(id)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const handleReject = async () => {
    if (!user || !selectedId) return
    setProcessingId(selectedId)
    try {
      await rejectApplication(selectedId, user.id, rejectReason)
      toast.success('已拒绝申请')
      setRejectDialogOpen(false)
      loadApplications()
    } catch (error) {
      console.error('Error rejecting:', error)
      toast.error('操作失败')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此申请记录？')) return
    setProcessingId(id)
    try {
      await deleteApplication(id)
      toast.success('已删除')
      loadApplications()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('删除失败')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            待审核
          </Badge>
        )
      case 'approved':
        return (
          <Badge className="gap-1 bg-green-500/20 text-green-600 hover:bg-green-500/30">
            <CheckCircle className="h-3 w-3" />
            已通过
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            已拒绝
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const pendingApplications = applications.filter((a) => a.status === 'pending')
  const processedApplications = applications.filter((a) => a.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Pending Applications */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          待审核 ({pendingApplications.length})
        </h3>
        {pendingApplications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            暂无待审核的申请
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>网站信息</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {app.logo_url && (
                            <img
                              src={app.logo_url}
                              alt=""
                              className="h-6 w-6 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          <span className="font-medium">{app.name}</span>
                        </div>
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {app.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {app.description && (
                          <p className="text-sm text-muted-foreground">
                            {app.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{app.contact_email}</div>
                        {app.contact_name && (
                          <div className="text-muted-foreground">
                            {app.contact_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(app.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove(app.id)}
                          disabled={processingId === app.id}
                        >
                          {processingId === app.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openRejectDialog(app.id)}
                          disabled={processingId === app.id}
                        >
                          <X className="h-4 w-4" />
                          拒绝
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

      {/* Processed Applications */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          已处理 ({processedApplications.length})
        </h3>
        {processedApplications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            暂无已处理的申请
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>网站信息</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>审核时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="font-medium">{app.name}</span>
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {app.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {app.status === 'rejected' && app.reject_reason && (
                          <p className="text-sm text-destructive">
                            拒绝原因：{app.reject_reason}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {app.reviewed_at ? formatDate(app.reviewed_at) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(app.id)}
                        disabled={processingId === app.id}
                      >
                        {processingId === app.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝申请</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">拒绝原因（可选）</label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processingId !== null}
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
