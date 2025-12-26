import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Globe } from 'lucide-react'
import { fetchFriendLinks, FriendLink } from '@/lib/api/friendLinks'
import { FriendLinkApplicationForm } from './FriendLinkApplicationForm'

export function FriendLinks() {
  const [links, setLinks] = useState<FriendLink[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLinks = async () => {
      const data = await fetchFriendLinks()
      setLinks(data.filter(l => l.is_active))
      setIsLoading(false)
    }
    loadLinks()
  }, [])

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">友情链接</h2>
          <div className="flex justify-center">
            <div className="animate-pulse text-muted-foreground">加载中...</div>
          </div>
        </div>
      </section>
    )
  }

  if (links.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground">
            友情链接
          </h2>
          <FriendLinkApplicationForm />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto"
        >
          {links.map((link, index) => (
            <motion.a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="group flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg hover:border-primary/40 hover:shadow-md transition-all duration-300"
            >
              {link.logo_url ? (
                <img
                  src={link.logo_url}
                  alt={link.name}
                  className="w-6 h-6 rounded object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <Globe className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {link.name}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
