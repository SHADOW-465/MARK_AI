"use client"

import * as React from 'react'
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from '@/lib/utils'

export interface CardProps extends React.ComponentProps<'div'> {
  hoverEffect?: boolean
}

function Card({
  className,
  children,
  hoverEffect = false,
  onClick,
  ...props
}: CardProps) {

  const isInteractive = hoverEffect || typeof onClick !== 'undefined';

  const cardClasses = cn(
    "relative overflow-hidden transition-all duration-300 group",
    "rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-md text-card-foreground",
    (hoverEffect || onClick) && "cursor-pointer hover:shadow-lg hover:border-primary/30 hover:bg-card-hover/80",
    className
  );

  const content = (
    <div className="relative z-10 w-full flex flex-col h-full">
      {children}
    </div>
  );

  if (isInteractive) {
    return (
      <div className="@container w-full" data-slot="card-wrapper" onClick={onClick}>
        <motion.div
          whileHover={hoverEffect ? { y: -4, scale: 1.01 } : undefined}
          whileTap={hoverEffect ? { scale: 0.98 } : undefined}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          data-slot="card"
          className={cardClasses}
        >
          {content}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="@container w-full" data-slot="card-wrapper" onClick={onClick}>
      <div data-slot="card" className={cardClasses} {...props}>
        {content}
      </div>
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
      className={cn('leading-none font-semibold text-lg text-foreground tracking-tight', className)}
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
