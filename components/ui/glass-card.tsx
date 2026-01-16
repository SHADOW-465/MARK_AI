"use client"

import { motion } from "framer-motion"
import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  onClick?: () => void
  variant?: 'default' | 'gradient' | 'neo'
  shimmer?: boolean
  gradientColor?: 'primary' | 'teal' | 'purple'
}

export const GlassCard = ({ 
  children, 
  className = "", 
  hoverEffect = false, 
  onClick,
  variant = 'default',
  shimmer = false,
  gradientColor = 'primary'
}: GlassCardProps) => {
  
  const getGradientBorder = () => {
    switch(gradientColor) {
      case 'teal': return 'from-teal-500/20 to-emerald-500/20';
      case 'purple': return 'from-purple-500/20 to-pink-500/20';
      default: return 'from-indigo-500/20 to-blue-500/20';
    }
  }

  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, scale: 1.01 } : {}}
      whileTap={hoverEffect ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.4, 0.55, 1.4] }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 group",
        // Base styles based on variant
        variant === 'default' && "bg-white/70 dark:bg-slate-900/60 border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20",
        variant === 'neo' && "bg-white dark:bg-slate-900 border border-border shadow-xl",
        variant === 'gradient' && `bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-900/80 dark:to-slate-900/40 border-t border-l border-white/30 dark:border-white/10 shadow-lg`,
        
        // Hover states
        hoverEffect && "cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 hover:border-indigo-500/30",
        className
      )}
    >
      {/* Gradient Border Overlay for 'gradient' variant */}
      {variant === 'gradient' && (
        <div className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
          "bg-gradient-to-br p-[1px]", 
          getGradientBorder()
        )} style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }} />
      )}

      {/* Shimmer Effect */}
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent z-10 pointer-events-none" />
      )}

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>

      {/* Inner Glow for Depth */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] pointer-events-none" />
    </motion.div>
  )
}
