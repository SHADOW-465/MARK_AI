"use client"

import { motion } from "framer-motion"
import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  onClick?: () => void
  variant?: 'liquid' | 'neu' | 'glass'
  shimmer?: boolean
  gradientColor?: 'primary' | 'teal' | 'purple'
}

export const GlassCard = ({ 
  children, 
  className = "", 
  hoverEffect = false, 
  onClick,
  variant = 'liquid',
  shimmer = false,
  gradientColor = 'primary'
}: GlassCardProps) => {
  
  const getGradientBorder = () => {
    switch(gradientColor) {
      case 'teal': return 'from-teal-500/30 to-emerald-500/30';
      case 'purple': return 'from-purple-500/30 to-pink-500/30';
      default: return 'from-indigo-500/30 to-blue-500/30';
    }
  }

  return (
    <div className="@container">
      <motion.div
        whileHover={hoverEffect ? { y: -6, scale: 1.01 } : {}}
        whileTap={hoverEffect ? { scale: 0.98 } : {}}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onClick={onClick}
        className={cn(
          "relative rounded-2xl @md:rounded-[2rem] overflow-hidden transition-all duration-300 group",
          
          // Variant Styles
          variant === 'liquid' && "liquid-glass shadow-lg shadow-indigo-500/5 dark:shadow-black/30",
          
          variant === 'neu' && "bg-secondary dark:bg-slate-800 neu-flat border-none",
          
          variant === 'glass' && "bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm",
          
          // Hover Interactions
          hoverEffect && variant === 'liquid' && "hover:shadow-xl hover:shadow-indigo-500/20 dark:hover:shadow-indigo-900/30 hover:border-white/80 dark:hover:border-white/20",
          
          hoverEffect && variant === 'neu' && "hover:shadow-lg hover:-translate-y-1 transition-transform",
          
          className
        )}
      >
        {/* Gradient Border for Liquid Variant */}
        {variant === 'liquid' && (
          <div className={cn(
            "absolute inset-0 rounded-2xl @md:rounded-[2rem] opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
            "bg-gradient-to-br p-[1px]", 
            getGradientBorder()
          )} style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }} />
        )}

        {/* Shimmer Effect */}
        {shimmer && (
          <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent z-20 pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10 h-full">
          {children}
        </div>

        {/* Inner Glow / Highlight for Liquid Feel */}
        {variant === 'liquid' && (
          <div className="absolute inset-0 rounded-2xl @md:rounded-[2rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] pointer-events-none z-20 mix-blend-overlay" />
        )}
      </motion.div>
    </div>
  )
}
