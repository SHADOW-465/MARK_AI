import { ProgressBar } from "@/components/student-dashboard/progress-bar"

interface StudentProfileCardProps {
  name: string
  monthlyActivity: number
  scoreA: number
  scoreB: number
  scoreC: number
}

export function StudentProfileCard({ name, monthlyActivity, scoreA, scoreB, scoreC }: StudentProfileCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
          {name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h3 className="text-xl font-semibold text-foreground">{name}</h3>
        </div>
      </div>

      <div>
        <p className="text-4xl font-semibold text-foreground">{monthlyActivity}%</p>
        <p className="text-sm text-muted-foreground">Total month activity</p>
      </div>

      <div className="space-y-2">
        <ProgressBar value={scoreA} />
        <ProgressBar value={scoreB} />
        <ProgressBar value={scoreC} />
      </div>
    </div>
  )
}
