"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.ComponentProps<"div"> {
  hoverEffect?: boolean
}

function Card({ className, children, hoverEffect = false, onClick, ...props }: CardProps) {
  const isInteractive = hoverEffect || Boolean(onClick)

  const classes = cn(
    "relative w-full overflow-hidden rounded-[var(--radius-lg-token)] border border-border bg-card/90 text-card-foreground shadow-[var(--shadow-card)]",
    "transition-all duration-200",
    isInteractive && "cursor-pointer hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card",
    className,
  )

  return (
    <div data-slot="card" className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("grid gap-1 px-6 pt-6", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("text-lg font-semibold leading-none", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-sm text-muted-foreground", className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-action" className={cn("ml-auto", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6 py-5", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-6 pb-6", className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
