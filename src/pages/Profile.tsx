import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Mail, Save, Loader2, History, Heart } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NewsCard } from '@/components/NewsCard'
import { NewsArticle } from '@/lib/api/news'
import weiruanLogo from '@/assets/weiruan-news-logo.jpg'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Profile() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [viewedArticles, setViewedArticles] = useState<NewsArticle[]>([])
  const [favoriteArticles, setFavoriteArticles] = useState<NewsArticle[]>([])
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        navigate('/auth')
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/auth')
      } else {
        setUser(session.user)
        loadProfile(session.user.id)
        loadHistory(session.user.id)
        loadFavorites(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (data) {
      setDisplayName(data.display_name || '')
    }
    setIsLoading(false)
  }

  const loadHistory = async (userId: string) => {
    const { data } = await supabase
      .from('news_views')
      .select('article_id, viewed_at, news_articles(*)')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(50)
    
    if (data) {
      const articles = data
        .map(item => item.news_articles)
        .filter(Boolean) as unknown as NewsArticle[]
      setViewedArticles(articles)
    }
  }

  const loadFavorites = async (userId: string) => {
    const { data } = await supabase
      .from('news_favorites')
      .select('article_id, created_at, news_articles(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (data) {
      const articles = data
        .map(item => item.news_articles)
        .filter(Boolean) as unknown as NewsArticle[]
      setFavoriteArticles(articles)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        display_name: displayName,
      }, { onConflict: 'user_id' })

    if (error) {
      toast({ title: '保存失败', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: '保存成功' })
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <img src={weiruanLogo} alt="WeiRuan Logo" className="w-8 h-8 object-contain rounded-lg" />
              <h1 className="text-lg font-bold text-foreground">用户中心</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              个人资料
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              浏览历史
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="w-4 h-4" />
              我的收藏
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="text-xl font-semibold mb-6">个人资料</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">邮箱地址不可修改</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">显示名称</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="输入您的昵称"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full gap-2">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  保存修改
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-semibold mb-4">浏览历史</h2>
              {viewedArticles.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暂无浏览记录</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {viewedArticles.map((article, index) => (
                    <NewsCard key={article.id} article={article} index={index} />
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xl font-semibold mb-4">我的收藏</h2>
              {favoriteArticles.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">暂无收藏</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {favoriteArticles.map((article, index) => (
                    <NewsCard key={article.id} article={article} index={index} />
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
