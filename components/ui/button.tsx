import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-card)] hover:brightness-110",
        destructive: "bg-destructive text-destructive-foreground hover:brightness-105",
        outline: "border border-border bg-transparent text-foreground hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-card",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glow: "border border-primary/40 bg-primary/20 text-primary hover:bg-primary/30",
        gradient: "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:brightness-105",
        soft: "border border-primary/25 bg-primary/10 text-primary hover:bg-primary/20",
        neu: "border border-border bg-card text-foreground neu-flat hover:neu-pressed",
        liquid: "border border-primary/25 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[var(--shadow-card)] hover:brightness-110",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
