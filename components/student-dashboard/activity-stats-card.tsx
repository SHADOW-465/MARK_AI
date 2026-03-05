import { CalendarClock, CheckCircle2, Loader } from "lucide-react"

interface ActivityStatsCardProps {
  inProgress: number
  upcoming: number
  completed: number
}

export function ActivityStatsCard({ inProgress, upcoming, completed }: ActivityStatsCardProps) {
  const items = [
    { label: "In Progress", value: inProgress, icon: Loader },
    { label: "Upcoming", value: upcoming, icon: CalendarClock },
    { label: "Completed", value: completed, icon: CheckCircle2 },
  ]

  return (
    <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl bg-background p-3 text-center">
          <item.icon size={16} className="mx-auto mb-2 text-primary" />
          <p className="text-2xl font-semibold text-foreground">{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
