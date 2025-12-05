"use client"

import { motion } from "framer-motion"
import type React from "react"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  onClick?: () => void
}

export const GlassCard = ({ children, className = "", hoverEffect = false, onClick }: GlassCardProps) => (
  <motion.div
    whileHover={hoverEffect ? { y: -4, boxShadow: "0 20px 40px -10px rgba(0, 243, 255, 0.15)" } : {}}
    whileTap={hoverEffect ? { scale: 0.99 } : {}}
    onClick={onClick}
    className={`glass-panel rounded-2xl transition-all duration-500 relative z-10 h-full ${hoverEffect ? "cursor-pointer" : ""} ${className}`}
  >
    <div className="card-border-beam"></div>
    <div className="card-border-static"></div>
    <div className="relative z-20 h-full">{children}</div>
  </motion.div>
)
