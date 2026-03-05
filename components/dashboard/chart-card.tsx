import { ReactNode } from "react"
import { GlassCard } from "@/components/ui/glass-card"

interface ChartCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function ChartCard({ title, description, action, children }: ChartCardProps) {
  return (
    <GlassCard className="flex h-full flex-col p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="min-h-[220px] flex-1">{children}</div>
    </GlassCard>
  )
}
