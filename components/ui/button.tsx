import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // Premium / Soft UI Variants
        glow: "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(99,102,241,0.7)] hover:scale-[1.02] border border-primary/50",
        
        gradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] text-white shadow-lg shadow-indigo-500/30 hover:bg-[position:right_center] transition-all duration-500 hover:shadow-indigo-500/50 hover:-translate-y-0.5",
        
        soft: "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10",
        
        // Neumorphic Button
        neu: "bg-secondary dark:bg-slate-800 text-foreground neu-flat hover:neu-pressed active:scale-[0.98] border border-white/20 dark:border-white/5",
        
        // Liquid Gem Button
        liquid: "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_20px_rgba(99,102,241,0.3)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_12px_24px_rgba(99,102,241,0.4)] hover:-translate-y-1 active:translate-y-0 border border-white/20",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-14 rounded-full px-10 text-base font-semibold",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
