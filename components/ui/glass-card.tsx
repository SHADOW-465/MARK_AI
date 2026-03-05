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
 * Thin wrapper around the simplified Card component.
 * Accepts legacy variant/shimmer/gradientColor props but ignores them,
 * so existing call sites don't break.
 */
export const GlassCard = ({
  className,
  variant,       // ignored – kept for backwards compat
  shimmer,       // ignored
  gradientColor, // ignored
  ...props
}: GlassCardProps) => {
  return (
    <Card className={className} {...props} />
  )
}
