"use client"

import { motion } from "framer-motion"
import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  onClick?: () => void
}

export const GlassCard = ({ children, className = "", hoverEffect = false, onClick }: GlassCardProps) => (
  <motion.div
    whileHover={hoverEffect ? { y: -2, boxShadow: "0 12px 32px rgba(99, 102, 241, 0.08)" } : {}}
    whileTap={hoverEffect ? { scale: 0.99 } : {}}
    onClick={onClick}
    className={cn(
      "rounded-xl bg-card border border-border shadow-sm transition-all duration-200 relative overflow-hidden",
      hoverEffect ? "cursor-pointer hover:border-primary/20" : "",
      className
    )}
  >
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
)
