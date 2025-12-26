'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ImageWithFallback } from './figma/ImageWithFallback'

export function Services() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const services = [
    {
      id: 'campaigns',
      title: "Campaign & Ad Content",
      description: "Multi-platform video campaigns ready for every channel—YouTube, TikTok, Instagram, and beyond.",
      icon: "📺",
      gradient: "from-primary to-accent-cyan",
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop&auto=format'
    },
    {
      id: 'brand-films',
      title: "Brand Films & Stories", 
      description: "Cinematic brand videos that capture your essence and connect with audiences on an emotional level.",
      icon: "🎬",
      gradient: "from-accent-violet to-primary",
      image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=300&fit=crop&auto=format'
    },
    {
      id: 'trailers',
      title: "Trailers & Promos",
      description: "High-impact teasers that hook viewers instantly—perfect for launches, events, and announcements.",
      icon: "🎥",
      gradient: "from-accent-cyan to-accent-emerald",
      image: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=300&fit=crop&auto=format'
    },
    {
      id: 'short-films',
      title: "Short-Form Films",
      description: "Festival-ready mini-movies up to 5 minutes—ideal for investors, events, and premium content.",
      icon: "🏆",
      gradient: "from-accent-emerald to-primary",
      image: 'https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=400&h=300&fit=crop&auto=format'
    },
    {
      id: 'animation',
      title: "Animation & Motion",
      description: "Stylized animated content that explains complex ideas without needing live actors.",
      icon: "✨",
      gradient: "from-primary to-accent-violet",
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop&auto=format'
    },
    {
      id: 'social',
      title: "Social Content",
      description: "Thumb-stopping vertical videos delivered in batches to keep your feed consistently engaging.",
      icon: "📱",
      gradient: "from-accent-violet to-accent-cyan",
      image: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=400&h=300&fit=crop&auto=format'
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <section id="services" className="relative py-24 bg-gradient-subtle overflow-hidden">
      
      {/* Modern Tech Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-accent-cyan/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-10 w-48 h-48 bg-accent-violet/5 rounded-full blur-xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.015]" 
             style={{
               backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
               backgroundSize: '60px 60px'
             }} />
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Our Capabilities
            </span>
            <div className="w-2 h-2 bg-accent-cyan rounded-full" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 text-foreground tracking-tight"
          >
            What We <span className="bg-gradient-to-r from-primary to-accent-cyan bg-clip-text text-transparent">Create</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
          >
            Cutting-edge content crafted with AI precision
          </motion.p>
        </div>

        {/* Services Grid - Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              onMouseEnter={() => setHoveredCard(service.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="group relative"
            >
              <div className={`relative bg-card rounded-2xl overflow-hidden border border-border/50 transition-all duration-500 ${
                hoveredCard === service.id 
                  ? 'shadow-lg shadow-primary/10 border-primary/30 -translate-y-2' 
                  : 'shadow-sm hover:shadow-md'
              }`}>
                
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={service.image}
                    alt={service.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      hoveredCard === service.id ? 'scale-110' : 'scale-100'
                    }`}
                  />
                  
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient} opacity-0 transition-opacity duration-500 ${
                    hoveredCard === service.id ? 'opacity-30' : ''
                  }`} />
                  
                  {/* Icon badge */}
                  <div className={`absolute top-4 right-4 w-12 h-12 bg-card/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl shadow-lg transition-transform duration-300 ${
                    hoveredCard === service.id ? 'scale-110 rotate-3' : ''
                  }`}>
                    {service.icon}
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <h3 className="font-display font-bold text-xl text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                    {service.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {service.description}
                  </p>
                  
                  {/* Learn more link */}
                  <div className={`mt-4 flex items-center gap-2 text-primary font-medium text-sm transition-all duration-300 ${
                    hoveredCard === service.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}>
                    <span>Learn more</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                
                {/* Bottom gradient line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${service.gradient} transition-opacity duration-300 ${
                  hoveredCard === service.id ? 'opacity-100' : 'opacity-0'
                }`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-8 bg-card/50 backdrop-blur-sm rounded-3xl border border-border/50">
            <div className="text-center sm:text-left">
              <h3 className="font-display font-bold text-xl text-foreground mb-1">
                Have a unique project in mind?
              </h3>
              <p className="text-muted-foreground">
                We love tackling creative challenges
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const contactSection = document.getElementById('contact')
                contactSection?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              Let's Talk
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
