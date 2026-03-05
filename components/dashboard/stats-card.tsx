import { ArrowUpRight, LucideIcon } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: string
  trendUp?: boolean
  icon: LucideIcon
}

export function StatsCard({ title, value, subtitle, trend, trendUp = true, icon: Icon }: StatsCardProps) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-secondary/70 text-primary">
          <Icon size={18} />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <p className="text-muted-foreground">{subtitle}</p>
        {trend ? (
          <span className={cn("inline-flex items-center gap-1 font-semibold", trendUp ? "text-emerald-400" : "text-rose-400")}>
            {trend}
            <ArrowUpRight size={12} className={cn(!trendUp && "rotate-90")} />
          </span>
        ) : null}
      </div>
    </GlassCard>
  )
}
