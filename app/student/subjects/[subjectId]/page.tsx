import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SubjectTasksPanel } from "@/components/subjects/subject-tasks-panel"
import { SubjectHistoryPanel } from "@/components/subjects/subject-history-panel"
import { SubjectAiGuidePanel } from "@/components/subjects/subject-ai-guide-panel"
import { StudyProgressChart } from "@/components/student-dashboard/study-progress-chart"
import { GlassCard } from "@/components/ui/glass-card"

export const dynamic = "force-dynamic"

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const admin = createAdminClient()

  const { data: student } = await admin
    .from("students")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!student) redirect("/student/dashboard")

  const { data: subject } = await admin
    .from("student_subjects")
    .select("*")
    .eq("id", subjectId)
    .eq("student_id", student.id)
    .maybeSingle()
  if (!subject) notFound()

  const [
    { data: tasks },
    { data: sessions },
    { data: guideSessions },
    { data: allSheets },
  ] = await Promise.all([
    admin
      .from("student_tasks")
      .select("*")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false }),
    admin
      .from("study_sessions")
      .select("*")
      .eq("subject_id", subjectId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("ai_guide_sessions")
      .select("id, title, session_type, last_active_at")
      .eq("student_id", student.id)
      .eq("subject_id", subjectId)
      .order("last_active_at", { ascending: false })
      .limit(5),
    admin
      .from("answer_sheets")
      .select(
        "id, total_score, created_at, exams(exam_name, total_marks, subject), feedback_analysis(exam_name, exam_subject, exam_total_marks)",
      )
      .eq("student_id", student.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ])

  const examHistory = (allSheets || []).filter((s: any) => {
    const name = s.feedback_analysis?.[0]?.exam_subject || s.exams?.subject
    return name?.toLowerCase() === subject.name.toLowerCase()
  })

  const totalTasks = tasks?.length || 0
  const completedTasks = tasks?.filter((t: any) => t.status === "completed").length || 0
  const avgScore =
    examHistory.length > 0
      ? Math.round(
          examHistory.reduce((acc: number, s: any) => {
            const total = s.feedback_analysis?.[0]?.exam_total_marks || s.exams?.total_marks || 100
            return acc + ((s.total_score || 0) / total) * 100
          }, 0) / examHistory.length,
        )
      : 0

  const totalStudyMins = (sessions || []).reduce(
    (acc: number, s: any) => acc + (s.duration_minutes || 0),
    0,
  )

  // Chart data: last 4 exams as trend
  const chartData =
    examHistory.length > 0
      ? examHistory
          .slice(0, 4)
          .reverse()
          .map((s: any, i: number) => ({
            label: `Exam ${i + 1}`,
            value: Math.round(
              ((s.total_score || 0) /
                (s.feedback_analysis?.[0]?.exam_total_marks || s.exams?.total_marks || 100)) *
                100,
            ),
          }))
      : [
          { label: "Tasks", value: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0 },
          { label: "Sessions", value: Math.min(100, (sessions?.length || 0) * 10) },
        ]

  const radius = 44
  const circumference = 2 * Math.PI * radius
  const progressOffset = circumference - (avgScore / 100) * circumference

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/student/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white text-base font-bold"
            style={{ backgroundColor: subject.color }}
          >
            {subject.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{subject.name}</h1>
            <p className="text-sm text-muted-foreground">Subject overview</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <GlassCard className="p-4 text-center">
          <div className="mx-auto mb-2 flex items-center justify-center">
            <svg width="60" height="60" className="-rotate-90">
              <circle cx="30" cy="30" r={20} fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
              <circle
                cx="30"
                cy="30"
                r={20}
                fill="none"
                stroke={subject.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={avgScore === 0 ? 2 * Math.PI * 20 : 2 * Math.PI * 20 - (avgScore / 100) * 2 * Math.PI * 20}
                className="transition-all duration-500"
              />
            </svg>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgScore > 0 ? `${avgScore}%` : "—"}</p>
          <p className="text-xs text-muted-foreground">Avg Score</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{examHistory.length}</p>
          <p className="text-xs text-muted-foreground">Exams Graded</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{completedTasks}/{totalTasks}</p>
          <p className="text-xs text-muted-foreground">Tasks Done</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {totalStudyMins >= 60 ? `${Math.round(totalStudyMins / 60)}h` : `${totalStudyMins}m`}
          </p>
          <p className="text-xs text-muted-foreground">Study Time</p>
        </GlassCard>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Tasks + Sessions */}
        <div className="lg:col-span-3">
          <SubjectTasksPanel
            subjectId={subjectId}
            initialTasks={(tasks || []) as any}
            initialSessions={(sessions || []) as any}
          />
        </div>

        {/* Centre: Progress chart + Exam history */}
        <div className="space-y-4 lg:col-span-6">
          {chartData.length > 0 && (
            <GlassCard className="p-5">
              <h3 className="mb-4 font-semibold text-foreground">Performance Trend</h3>
              <StudyProgressChart data={chartData} />
            </GlassCard>
          )}
          <SubjectHistoryPanel exams={examHistory as any} studentId={student.id} />
        </div>

        {/* Right: AI Guide */}
        <div className="lg:col-span-3">
          <SubjectAiGuidePanel
            subjectId={subjectId}
            studentId={student.id}
            subjectName={subject.name}
            guideSessions={(guideSessions || []) as any}
          />
        </div>
      </div>
    </div>
  )
}
