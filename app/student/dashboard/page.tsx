import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { DashboardLayout } from "@/components/student-dashboard/dashboard-layout"
import { StudentProfileCard } from "@/components/student-dashboard/student-profile-card"
import { CourseCarousel } from "@/components/student-dashboard/course-carousel"
import { StudyProgressChart } from "@/components/student-dashboard/study-progress-chart"
import { ActivityStatsCard } from "@/components/student-dashboard/activity-stats-card"
import { AssistantWidget } from "@/components/student-dashboard/assistant-widget"
import { AiDailyBrief } from "@/components/dashboard/ai-daily-brief"
import { ActiveSessionsWidget } from "@/components/dashboard/active-sessions-widget"
import { MarkRecoveryWidget } from "@/components/dashboard/mark-recovery-widget"
import { SelfAssessmentPrompt } from "@/components/student/self-assessment-prompt"
import { StudyThisButton } from "@/components/student/study-this-button"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-8 text-center text-muted-foreground">Please log in to view your dashboard.</div>
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, name, class, xp, streak, level")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!student) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
        <h1 className="text-3xl font-display font-bold">Account Link Required</h1>
        <p className="mx-auto max-w-sm text-lg text-muted-foreground">We couldn't find your student profile. Ask your teacher to add you.</p>
        <Button asChild variant="default" className="px-6 py-3">
          <Link href="/auth/sign-up">
            Try Linking Again
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </Button>
      </div>
    )
  }

  const { count: pendingCount } = await supabase
    .from("student_tasks")
    .select("*", { count: "exact", head: true })
    .eq("student_id", student.id)
    .eq("status", "pending")

  const { count: completedCount } = await supabase
    .from("student_tasks")
    .select("*", { count: "exact", head: true })
    .eq("student_id", student.id)
    .eq("status", "completed")

  const { data: upcomingExams } = await supabase
    .from("exams")
    .select("id, exam_name, exam_date, subject")
    .eq("class", student.class)
    .gte("exam_date", new Date().toISOString().split("T")[0])
    .order("exam_date", { ascending: true })
    .limit(3)

  const { data: recentExams } = await supabase
    .from("answer_sheets")
    .select(
      `
      id, created_at, total_score, status,
      exams (exam_name, total_marks, subject),
      feedback_analysis (exam_name, exam_subject, exam_total_marks)
    `,
    )
    .eq("student_id", student.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(6)

  const { data: recentSessions } = await supabase
    .from("ai_guide_sessions")
    .select("id, title, last_active_at")
    .eq("student_id", student.id)
    .order("last_active_at", { ascending: false })
    .limit(5)

  let recoveryStats = { concept: 0, calculation: 0, keyword: 0 }
  if (recentExams && recentExams.length > 0) {
    const { data: feedback } = await supabase
      .from("feedback_analysis")
      .select("root_cause_analysis")
      .eq("answer_sheet_id", recentExams[0].id)
      .single()

    if (feedback?.root_cause_analysis) {
      const root = feedback.root_cause_analysis as Record<string, unknown>
      recoveryStats = {
        concept: Number(root.concept || 0),
        calculation: Number(root.calculation || 0),
        keyword: Number(root.keyword || 0),
      }
    }
  }

  const avgScore =
    recentExams && recentExams.length > 0
      ? Math.round(
          recentExams.reduce((acc, sheet: any) => {
            const total = sheet.exams?.total_marks || sheet.feedback_analysis?.[0]?.exam_total_marks || 100
            return acc + ((sheet.total_score || 0) / total) * 100
          }, 0) / recentExams.length,
        )
      : 72

  const monthlyActivity = Math.min(100, Math.max(35, Math.round(avgScore * 0.6 + (student.streak || 0) * 2)))

  const courses = (recentExams || []).slice(0, 3).map((exam: any, index) => {
    const totalMarks = exam.exams?.total_marks || exam.feedback_analysis?.[0]?.exam_total_marks || 100
    const completion = Math.round(((exam.total_score || 0) / totalMarks) * 100)
    return {
      id: exam.id,
      title: exam.exams?.subject || exam.feedback_analysis?.[0]?.exam_subject || `Course ${index + 1}`,
      level: completion >= 70 ? "Advanced" : "Beginner",
      completion,
      instructor: "Faculty Mentor",
      stats: `${Math.max(1, index + 3)}/${Math.max(6, index + 8)} classes`,
      href: `/student/performance/${exam.id}`,
    }
  })

  const fallbackCourses = [
    { id: "f1", title: "Design Thinking", level: "Advanced", completion: 46, instructor: "Tomas Luis", stats: "4/12 classes", href: "/student/study" },
    { id: "f2", title: "Leadership", level: "Beginner", completion: 72, instructor: "Nelly Roven", stats: "8/14 classes", href: "/student/study" },
    { id: "f3", title: "IT English", level: "Advanced", completion: 56, instructor: "Stefan Colman", stats: "6/10 classes", href: "/student/study" },
  ]

  const chartData = [
    { label: "Engage", value: Math.min(100, 40 + (student.streak || 0) * 4) },
    { label: "Grow", value: avgScore },
    { label: "Skills", value: Math.max(25, 100 - recoveryStats.concept * 5) },
    {
      label: "Rate",
      value: Math.min(
        100,
        Math.round(((completedCount || 0) / Math.max(1, (completedCount || 0) + (pendingCount || 0))) * 100),
      ),
    },
  ]

  const extras = (
    <div className="space-y-6">
      <AiDailyBrief studentId={student.id} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Recent Results</h3>
              <Link href="/student/performance" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {(recentExams || []).slice(0, 3).map((sheet: any) => {
                const title = sheet.feedback_analysis?.[0]?.exam_name || sheet.exams?.exam_name || "Exam"
                const subject = sheet.feedback_analysis?.[0]?.exam_subject || sheet.exams?.subject || "General"
                const totalMarks = sheet.feedback_analysis?.[0]?.exam_total_marks || sheet.exams?.total_marks || 100
                const percentage = Math.round(((sheet.total_score || 0) / totalMarks) * 100)

                return (
                  <div key={sheet.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{subject}</p>
                      <p className="text-base font-semibold text-foreground">{title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", percentage >= 70 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {percentage}%
                      </span>
                      <StudyThisButton examId={sheet.id} examName={title} studentId={student.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <ActiveSessionsWidget sessions={recentSessions || []} />
          <MarkRecoveryWidget stats={recoveryStats} studentId={student.id} />

          <GlassCard className="p-4">
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Upcoming Exams</h4>
            <div className="space-y-2">
              {(upcomingExams || []).length > 0 ? (
                (upcomingExams || []).map((exam: any) => (
                  <div key={exam.id} className="rounded-lg border border-border bg-background px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{exam.exam_name}</p>
                    <p className="text-xs text-muted-foreground">{exam.subject} • {new Date(exam.exam_date).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming exams.</p>
              )}
            </div>
          </GlassCard>

          {(() => {
            if (!upcomingExams || upcomingExams.length === 0) return null
            const soon = upcomingExams[0] as any
            const daysUntil = Math.ceil((new Date(soon.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            if (daysUntil > 7) return null

            return (
              <SelfAssessmentPrompt
                examId={soon.id}
                examName={soon.exam_name}
                studentId={student.id}
                subject={soon.subject || "General"}
              />
            )
          })()}
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout
      profile={
        <div className="space-y-4">
          <StudentProfileCard
            name={student.name?.split(" ")[0] || "Student"}
            monthlyActivity={monthlyActivity}
            scoreA={Math.max(35, avgScore)}
            scoreB={Math.max(20, 100 - recoveryStats.calculation * 5)}
            scoreC={Math.max(20, 100 - recoveryStats.keyword * 6)}
          />
          <ActivityStatsCard inProgress={pendingCount || 0} upcoming={upcomingExams?.length || 0} completed={completedCount || 0} />
        </div>
      }
      courses={<CourseCarousel courses={courses.length > 0 ? courses : fallbackCourses} />}
      progress={<StudyProgressChart data={chartData} />}
      assistant={<AssistantWidget />}
      extras={extras}
    />
  )
}
