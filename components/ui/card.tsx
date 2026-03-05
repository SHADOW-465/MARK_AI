"use client"

import * as React from 'react'
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from '@/lib/utils'

export interface CardProps extends React.ComponentProps<'div'> {
  hoverEffect?: boolean
  variant?: 'default' | 'liquid' | 'neu' | 'glass'
  shimmer?: boolean
  gradientColor?: 'primary' | 'teal' | 'purple'
}

function Card({
  className,
  children,
  hoverEffect = false,
  variant = 'default',
  shimmer = false,
  gradientColor = 'primary',
  onClick,
  ...props
}: CardProps) {

  const getGradientBorder = () => {
    switch (gradientColor) {
      case 'teal': return 'from-teal-500/30 to-emerald-500/30';
      case 'purple': return 'from-purple-500/30 to-pink-500/30';
      default: return 'from-indigo-500/30 to-blue-500/30';
    }
  }

  const isInteractive = hoverEffect || typeof onClick !== 'undefined';
  const MotionComponent = isInteractive || variant !== 'default' ? motion.div : 'div';

  const motionProps = isInteractive || variant !== 'default' ? {
    whileHover: hoverEffect ? { y: -4, scale: 1.01 } : undefined,
    whileTap: hoverEffect ? { scale: 0.98 } : undefined,
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as any,
  } : {};

  return (
    <div className="@container w-full" data-slot="card-wrapper" onClick={onClick}>
      <MotionComponent
        {...motionProps}
        data-slot="card"
        className={cn(
          "relative overflow-hidden transition-all duration-300 group",

          // Default variant (Standard Card)
          variant === 'default' && "rounded-xl border border-border bg-card text-card-foreground shadow-sm",

          // Glass Card Variants
          variant !== 'default' && "rounded-2xl @md:rounded-[2rem]",
          variant === 'liquid' && "liquid-glass shadow-lg bg-card/40 backdrop-blur-xl border border-border/50",
          variant === 'neu' && "bg-secondary neu-flat border-none text-secondary-foreground",
          variant === 'glass' && "bg-background/60 backdrop-blur-md border border-border/50 shadow-sm text-foreground",

          // Hover Interactions
          hoverEffect && variant === 'liquid' && "hover:shadow-xl hover:border-primary/30",
          hoverEffect && variant === 'neu' && "hover:shadow-lg hover:-translate-y-1 transition-transform",
          hoverEffect && variant === 'default' && "hover:shadow-md hover:-translate-y-1 transition-transform",

          (hoverEffect || onClick) && "cursor-pointer",
          className
        )}
        {...props}
      >
        {/* Default standard background effect */}
        {variant === 'default' && (
          <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] dark:from-white/5 to-transparent pointer-events-none" />
        )}

        {/* Gradient Border for Liquid Variant */}
        {variant === 'liquid' && (
          <div className={cn(
            "absolute inset-0 rounded-2xl @md:rounded-[2rem] opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
            "bg-gradient-to-br p-1",
            getGradientBorder()
          )} style={{ mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' } as any} />
        )}

        {/* Shimmer Effect */}
        {shimmer && (
          <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent z-20 pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative z-10 w-full">
          {children}
        </div>

        {/* Inner Glow / Highlight for Liquid Feel */}
        {variant === 'liquid' && (
          <div className="absolute inset-0 rounded-2xl @md:rounded-[2rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] pointer-events-none z-20 mix-blend-overlay" />
        )}
      </MotionComponent>
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold text-xl', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6 py-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 pb-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
