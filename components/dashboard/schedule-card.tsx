import { CalendarClock } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

interface ScheduleItem {
  id: string
  title: string
  subtitle: string
  dateLabel: string
  meta: string
  urgent?: boolean
}

interface ScheduleCardProps {
  title: string
  items: ScheduleItem[]
}

export function ScheduleCard({ title, items }: ScheduleCardProps) {
  return (
    <GlassCard className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <CalendarClock size={18} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border/70 bg-secondary/65 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold uppercase", item.urgent ? "bg-rose-500/15 text-rose-300" : "bg-primary/15 text-primary")}>
                  {item.meta}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.dateLabel}</p>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">No scheduled items.</p>
        )}
      </div>
    </GlassCard>
  )
}
