import { GlassCard } from "@/components/ui/glass-card"
import { StudyThisButton } from "@/components/student/study-this-button"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface ExamResult {
  id: string
  total_score: number | null
  created_at: string
  exams: { exam_name: string; total_marks: number; subject: string } | null
  feedback_analysis: { exam_name: string; exam_subject: string; exam_total_marks: number }[] | null
}

export function SubjectHistoryPanel({ exams, studentId }: { exams: ExamResult[]; studentId: string }) {
  if (exams.length === 0) {
    return (
      <GlassCard className="p-5">
        <h3 className="mb-3 font-semibold text-foreground">Exam History</h3>
        <p className="py-6 text-center text-sm text-muted-foreground">
          No graded exams for this subject yet.
        </p>
      </GlassCard>
    )
  }

  const results = exams.map((sheet) => {
    const title = sheet.feedback_analysis?.[0]?.exam_name || sheet.exams?.exam_name || "Exam"
    const totalMarks = sheet.feedback_analysis?.[0]?.exam_total_marks || sheet.exams?.total_marks || 100
    const percentage = Math.round(((sheet.total_score || 0) / totalMarks) * 100)
    return { id: sheet.id, title, percentage, date: sheet.created_at }
  })

  const avg = Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Exam History</h3>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Avg {avg}%
        </span>
      </div>

      {/* Trend line (simple bar chart) */}
      {results.length >= 2 && (
        <div className="mb-4 flex items-end gap-1 h-14">
          {results.slice(0, 8).reverse().map((r, i) => (
            <div key={r.id} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(8, (r.percentage / 100) * 48)}px`,
                  backgroundColor: r.percentage >= 70 ? "#22c55e" : r.percentage >= 50 ? "#f59e0b" : "#ef4444",
                  opacity: i === results.slice(0, 8).length - 1 ? 1 : 0.6,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {results.map((r, i) => {
          const prev = results[i + 1]
          const trend = prev ? r.percentage - prev.percentage : null

          return (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-foreground line-clamp-1">{r.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {trend !== null && (
                  <span className={cn("text-xs", trend > 0 ? "text-emerald-500" : trend < 0 ? "text-red-500" : "text-muted-foreground")}>
                    {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                  </span>
                )}
                <span className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  r.percentage >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : r.percentage >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {r.percentage}%
                </span>
                <StudyThisButton
                  examId={r.id}
                  examName={r.title}
                  studentId={studentId}
                />
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
