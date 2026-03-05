import { cn } from "@/lib/utils"

interface StudyProgressChartProps {
  data: { label: string; value: number }[]
}

const barHeight = (value: number) => {
  if (value >= 85) return "h-32"
  if (value >= 70) return "h-28"
  if (value >= 55) return "h-24"
  if (value >= 40) return "h-20"
  if (value >= 25) return "h-16"
  return "h-12"
}

export function StudyProgressChart({ data }: StudyProgressChartProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-foreground">Study process</h3>
        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">Week</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {data.map((item) => (
          <div key={item.label} className="text-center">
            <div className="mb-2 flex h-36 items-end justify-center rounded-xl bg-background">
              <div className={cn("w-10 rounded-lg bg-primary/85", barHeight(item.value))} />
            </div>
            <p className="text-xs font-semibold text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.value}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}
