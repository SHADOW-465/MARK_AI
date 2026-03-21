import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

interface StudentAtRisk {
  id: string
  name: string
  score: number
  consecutiveDeclines: number
  dominantErrorType: "concept" | "calculation" | "keyword" | null
  aiSessionCount: number
}

interface ClassInsightsPanelProps {
  className: string
  examName: string
  gradedCount: number
  pendingCount: number
  classAvg: number
  prevClassAvg: number | null
  errorBreakdown: {
    concept: number
    calculation: number
    keyword: number
  }
  atRiskStudents: StudentAtRisk[]
}

function ErrorBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground capitalize">{label} errors</span>
        <span className="font-semibold text-foreground">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/70 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function ClassInsightsPanel({
  className,
  examName,
  gradedCount,
  pendingCount,
  classAvg,
  prevClassAvg,
  errorBreakdown,
  atRiskStudents,
}: ClassInsightsPanelProps) {
  const delta = prevClassAvg !== null ? classAvg - prevClassAvg : null
  const total = errorBreakdown.concept + errorBreakdown.calculation + errorBreakdown.keyword

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <GlassCard className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
          {className} — {examName}
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-foreground">{gradedCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">graded</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">pending review</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {classAvg}%
              {delta !== null && (
                <span
                  className={cn(
                    "ml-1.5 text-sm font-semibold",
                    delta >= 0 ? "text-emerald-500" : "text-red-500"
                  )}
                >
                  {delta >= 0 ? "↑" : "↓"}{Math.abs(delta)}%
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">class avg</p>
          </div>
        </div>
      </GlassCard>

      {/* Error breakdown */}
      <GlassCard className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-4">
          Error Breakdown (class-wide)
        </p>
        <div className="space-y-3">
          <ErrorBar label="concept" pct={pct(errorBreakdown.concept)} />
          <ErrorBar label="calculation" pct={pct(errorBreakdown.calculation)} />
          <ErrorBar label="keyword" pct={pct(errorBreakdown.keyword)} />
        </div>
      </GlassCard>

      {/* At-risk students */}
      {atRiskStudents.length > 0 && (
        <GlassCard className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
            At-Risk Students (score &lt; 50%)
          </p>
          <div className="space-y-2">
            {atRiskStudents.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.dominantErrorType && (
                      <span className="capitalize">{s.dominantErrorType} errors dominant · </span>
                    )}
                    AI Guide: {s.aiSessionCount} session{s.aiSessionCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-sm font-bold text-red-500">{s.score}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
