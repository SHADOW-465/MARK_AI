import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { ClassInsightsPanel } from "@/components/dashboard/class-insights-panel"

export const dynamic = "force-dynamic"

export default async function ClassInsightsPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const admin = createAdminClient()
  const { classId } = await params

  // Fetch latest exam for this class (most recent graded exam)
  const { data: latestExam } = await admin
    .from("exams")
    .select("id, exam_name, subject, class")
    .eq("class", classId)
    .order("exam_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestExam) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No exams found for class {classId}.
      </div>
    )
  }

  // Fetch answer sheets for the latest exam
  const { data: sheets } = await admin
    .from("answer_sheets")
    .select(`
      id, total_score, status, student_id,
      students (id, name),
      feedback_analysis (root_cause_analysis)
    `)
    .eq("exam_id", latestExam.id)

  const graded = (sheets ?? []).filter((s: any) => s.status === "approved")
  const pending = (sheets ?? []).filter((s: any) => s.status !== "approved")

  // Compute class average
  const classAvg =
    graded.length > 0
      ? Math.round(
          graded.reduce((acc: number, s: any) => acc + (s.total_score ?? 0), 0) / graded.length,
        )
      : 0

  // Aggregate error breakdown
  const errorBreakdown = { concept: 0, calculation: 0, keyword: 0 }
  graded.forEach((s: any) => {
    const rca = s.feedback_analysis?.[0]?.root_cause_analysis as Record<string, number> | null
    if (rca) {
      errorBreakdown.concept += rca.concept ?? 0
      errorBreakdown.calculation += rca.calculation ?? 0
      errorBreakdown.keyword += rca.keyword ?? 0
    }
  })

  // At-risk students (score < 50%)
  const atRiskStudents = await Promise.all(
    graded
      .filter((s: any) => s.total_score !== null && s.total_score < 50)
      .map(async (s: any) => {
        const rca = s.feedback_analysis?.[0]?.root_cause_analysis as Record<string, number> | null
        let dominant: "concept" | "calculation" | "keyword" | null = null
        if (rca) {
          const entries = Object.entries(rca) as [string, number][]
          const top = entries.sort((a, b) => b[1] - a[1])[0]
          if (top) dominant = top[0] as "concept" | "calculation" | "keyword"
        }
        const { count } = await admin
          .from("ai_guide_sessions")
          .select("*", { count: "exact", head: true })
          .eq("student_id", s.student_id)
        return {
          id: s.student_id,
          name: (s.students as any)?.name ?? "Unknown",
          score: s.total_score ?? 0,
          consecutiveDeclines: 0,
          dominantErrorType: dominant,
          aiSessionCount: count ?? 0,
        }
      }),
  )

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-display font-bold mb-6">Class {classId} Insights</h1>
      <ClassInsightsPanel
        className={`Class ${classId}`}
        examName={latestExam.exam_name}
        gradedCount={graded.length}
        pendingCount={pending.length}
        classAvg={classAvg}
        prevClassAvg={null}
        errorBreakdown={errorBreakdown}
        atRiskStudents={atRiskStudents}
      />
    </div>
  )
}
