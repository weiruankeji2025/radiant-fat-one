import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { submitFriendLinkApplication } from '@/lib/api/friendLinkApplications'
import { Send, LinkIcon } from 'lucide-react'

const applicationSchema = z.object({
  name: z.string().min(1, '请输入网站名称').max(50, '名称不能超过50个字符'),
  url: z.string().url('请输入有效的网址'),
  description: z.string().max(200, '描述不能超过200个字符').optional(),
  logo_url: z.string().url('请输入有效的图片网址').optional().or(z.literal('')),
  contact_email: z.string().email('请输入有效的邮箱地址'),
  contact_name: z.string().max(50, '联系人名称不能超过50个字符').optional(),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

export function FriendLinkApplicationForm() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: '',
      url: '',
      description: '',
      logo_url: '',
      contact_email: '',
      contact_name: '',
    },
  })

  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true)
    try {
      await submitFriendLinkApplication({
        name: data.name,
        url: data.url,
        description: data.description || null,
        logo_url: data.logo_url || null,
        contact_email: data.contact_email,
        contact_name: data.contact_name || null,
      })
      toast.success('友链申请已提交，请等待审核')
      form.reset()
      setOpen(false)
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('提交失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Send className="h-4 w-4" />
          申请友链
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            申请友情链接
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站名称 *</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：我的博客" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站地址 *</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>网站描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="简单介绍一下您的网站..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo 地址</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系邮箱 *</FormLabel>
                  <FormControl>
                    <Input placeholder="your@email.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>联系人</FormLabel>
                  <FormControl>
                    <Input placeholder="您的称呼" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '提交中...' : '提交申请'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
