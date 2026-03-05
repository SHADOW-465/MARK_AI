"use client"

import type React from "react"
import { Card } from "@/components/ui/card"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: boolean
  onClick?: () => void
  variant?: 'liquid' | 'neu' | 'glass'
  shimmer?: boolean
  gradientColor?: 'primary' | 'teal' | 'purple'
}

/**
 * @deprecated Use `Card` component with `variant="liquid" | "neu" | "glass"` instead.
 */
export const GlassCard = ({
  className,
  variant = 'liquid',
  ...props
}: GlassCardProps) => {
  return (
    <Card variant={variant} className={className} {...props} />
  )
}
