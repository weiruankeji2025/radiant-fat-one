import { motion } from 'framer-motion'
import { Newspaper, Shield, Cpu, TrendingUp, Globe2, LayoutGrid, Flag, Flame, Users, MapPin } from 'lucide-react'
import { NewsCategory, categoryLabels } from '@/lib/api/news'

interface NewsCategoryTabsProps {
  activeCategory: NewsCategory | null
  onCategoryChange: (category: NewsCategory | null) => void
}

const categories: { key: NewsCategory | null; icon: React.ReactNode }[] = [
  { key: null, icon: <LayoutGrid className="w-4 h-4" /> },
  { key: 'politics', icon: <Newspaper className="w-4 h-4" /> },
  { key: 'military', icon: <Shield className="w-4 h-4" /> },
  { key: 'technology', icon: <Cpu className="w-4 h-4" /> },
  { key: 'economy', icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'world', icon: <Globe2 className="w-4 h-4" /> },
  { key: 'china_us', icon: <Flag className="w-4 h-4" /> },
  { key: 'russia_ukraine', icon: <Flame className="w-4 h-4" /> },
  { key: 'korea', icon: <Users className="w-4 h-4" /> },
  { key: 'southeast_asia', icon: <MapPin className="w-4 h-4" /> },
]

export function NewsCategoryTabs({ activeCategory, onCategoryChange }: NewsCategoryTabsProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {categories.map(({ key, icon }) => (
            <motion.button
              key={key ?? 'all'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCategoryChange(key)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${activeCategory === key 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                }
              `}
            >
              {icon}
              {key ? categoryLabels[key] : '全部'}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}