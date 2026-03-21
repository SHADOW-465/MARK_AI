import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { SubjectStatusList } from "@/components/student-dashboard/subject-status-list"
import type { Subject } from "@/components/student-dashboard/subject-status-list"
import { TodayFocusCard, type TodayFocus } from "@/components/student-dashboard/today-focus-card"
import { AiDailyBrief } from "@/components/dashboard/ai-daily-brief"
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
    return (
      <div className="p-8 text-center text-muted-foreground">
        Please log in to view your dashboard.
      </div>
    )
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
        <p className="mx-auto max-w-sm text-lg text-muted-foreground">
          We couldn&apos;t find your student profile. Ask your teacher to add you.
        </p>
        <Button asChild variant="default" className="px-6 py-3">
          <Link href="/auth/sign-up">
            Try Linking Again
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </Button>
      </div>
    )
  }

  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  // Run all top-level queries in parallel
  const [
    { count: pendingCount },
    { count: completedCount },
    { data: upcomingExams },
    { data: recentExams },
    { data: overdueTasks },
    { data: recentAiSessions },
  ] = await Promise.all([
    supabase
      .from("student_tasks")
      .select("*", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("status", "pending"),
    supabase
      .from("student_tasks")
      .select("*", { count: "exact", head: true })
      .eq("student_id", student.id)
      .eq("status", "completed"),
    supabase
      .from("exams")
      .select("id, exam_name, exam_date, subject")
      .eq("class", student.class)
      .gte("exam_date", today)
      .order("exam_date", { ascending: true })
      .limit(3),
    supabase
      .from("answer_sheets")
      .select(
        `id, created_at, total_score, status,
        exams (exam_name, total_marks, subject),
        feedback_analysis (exam_name, exam_subject, exam_total_marks)`,
      )
      .eq("student_id", student.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("student_tasks")
      .select("id, title, due_date, subject_id")
      .eq("student_id", student.id)
      .eq("status", "pending")
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(1),
    supabase
      .from("ai_guide_sessions")
      .select("id, last_active_at")
      .eq("student_id", student.id)
      .gte("last_active_at", sevenDaysAgo)
      .limit(1),
  ])

  // Auto-create subjects from exam data that don't exist yet
  const subjectNamesFromExams = new Set<string>()
  ;(recentExams || []).forEach((row: any) => {
    const name = row.feedback_analysis?.[0]?.exam_subject || row.exams?.subject
    if (name) subjectNamesFromExams.add(name.trim())
  })

  const { data: existingSubjects } = await supabase
    .from("student_subjects")
    .select("name, color")
    .eq("student_id", student.id)

  const existingNames = new Set((existingSubjects || []).map((s: any) => s.name))
  const COLORS = ["#9b8cff", "#FE6B4B", "#22c55e", "#f59e0b", "#38bdf8", "#e879f9", "#fb7185", "#34d399"]

  const toInsert = [...subjectNamesFromExams]
    .filter((name) => !existingNames.has(name))
    .map((name, i) => ({
      student_id: student.id,
      name,
      color: COLORS[(existingNames.size + i) % COLORS.length],
      auto_created: true,
    }))

  if (toInsert.length > 0) {
    await supabase.from("student_subjects").insert(toInsert)
  }

  const { data: allSubjects } = await supabase
    .from("student_subjects")
    .select("*")
    .eq("student_id", student.id)
    .order("created_at", { ascending: true })

  const weekAgo = sevenDaysAgo

  // Fetch per-subject stats in parallel
  const subjects: Subject[] = await Promise.all(
    (allSubjects || []).map(async (subject: any) => {
      const subjectSheets = (recentExams || []).filter((s: any) => {
        const name = s.feedback_analysis?.[0]?.exam_subject || s.exams?.subject
        return name?.toLowerCase() === subject.name.toLowerCase()
      })

      const avgSubjectScore =
        subjectSheets.length > 0
          ? Math.round(
              subjectSheets.reduce((acc: number, s: any) => {
                const total = s.exams?.total_marks || s.feedback_analysis?.[0]?.exam_total_marks || 100
                return acc + ((s.total_score || 0) / total) * 100
              }, 0) / subjectSheets.length,
            )
          : 0

      const [
        { count: totalTasks },
        { count: completedTasks },
        { count: sessionCount },
      ] = await Promise.all([
        supabase
          .from("student_tasks")
          .select("*", { count: "exact", head: true })
          .eq("subject_id", subject.id),
        supabase
          .from("student_tasks")
          .select("*", { count: "exact", head: true })
          .eq("subject_id", subject.id)
          .eq("status", "completed"),
        supabase
          .from("study_sessions")
          .select("*", { count: "exact", head: true })
          .eq("subject_id", subject.id)
          .gte("created_at", weekAgo),
      ])

      return {
        ...subject,
        avgScore: avgSubjectScore,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        sessionCount: sessionCount || 0,
      } satisfies Subject
    }),
  )

  // ── Today's Focus: 5-rule priority logic ────────────────────────────────────

  let todayFocus: TodayFocus = { type: "empty", title: "", description: "", cta: "", href: "" }

  // Priority 1: Upcoming exam within 7 days
  if (upcomingExams && upcomingExams.length > 0) {
    const soonExam = upcomingExams.find((exam: any) => {
      const daysUntil = Math.ceil(
        (new Date(exam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
      return daysUntil <= 7
    }) as any | undefined

    if (soonExam) {
      const daysUntil = Math.ceil(
        (new Date(soonExam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
      todayFocus = {
        type: "exam-prep",
        title: `Prepare for ${soonExam.exam_name}`,
        description: `${daysUntil} day${daysUntil === 1 ? "" : "s"} to go. Start a focused prep session now.`,
        cta: "Start prep session",
        href: "/student/ai-guide",
      }
    }
  }

  // Priority 2: Recent low-scoring exam (score < 65%, graded in last 14 days)
  //             with no AI Guide session in last 7 days
  if (todayFocus.type === "empty" && recentExams && recentExams.length > 0) {
    const hasRecentSession = recentAiSessions && recentAiSessions.length > 0

    if (!hasRecentSession) {
      const lowScoreSheet = (recentExams as any[]).find((sheet) => {
        const sheetDate = new Date(sheet.created_at)
        const isRecent = sheetDate >= new Date(fourteenDaysAgo)
        const totalMarks =
          sheet.feedback_analysis?.[0]?.exam_total_marks || sheet.exams?.total_marks || 100
        const percentage = ((sheet.total_score || 0) / totalMarks) * 100
        return isRecent && percentage < 65
      })

      if (lowScoreSheet) {
        const examName =
          lowScoreSheet.feedback_analysis?.[0]?.exam_name ||
          lowScoreSheet.exams?.exam_name ||
          "Exam"
        todayFocus = {
          type: "recovery",
          title: `Review your ${examName} mistakes`,
          description:
            "You scored below 65% on this exam. Your AI Guide can build a targeted recovery session.",
          cta: "Start recovery session",
          href: "/student/ai-guide",
        }
      }
    }
  }

  // Priority 3: Overdue task (due_date < today, status = pending)
  if (todayFocus.type === "empty" && overdueTasks && overdueTasks.length > 0) {
    const overdueTask = overdueTasks[0] as any
    const taskSubject = subjects.find((s) => s.id === overdueTask.subject_id)

    todayFocus = {
      type: "overdue-task",
      title: overdueTask.title,
      description: "This task is overdue. Catch up now to stay on track.",
      cta: taskSubject ? `Go to ${taskSubject.name}` : "View tasks",
      href: taskSubject
        ? `/student/subjects/${taskSubject.id}`
        : "/student/planner",
      subjectName: taskSubject?.name,
      subjectColor: taskSubject?.color,
    }
  }

  // Priority 4: Most-studied subject this week (highest sessionCount)
  if (todayFocus.type === "empty" && subjects.length > 0) {
    const mostStudied = subjects.reduce((best, s) =>
      s.sessionCount > best.sessionCount ? s : best,
    )

    if (mostStudied.sessionCount > 0) {
      todayFocus = {
        type: "momentum",
        title: `Keep the momentum in ${mostStudied.name}`,
        description: "You've studied this subject most this week. Continue your progress.",
        cta: `Continue ${mostStudied.name}`,
        href: `/student/subjects/${mostStudied.id}`,
        subjectName: mostStudied.name,
        subjectColor: mostStudied.color,
      }
    }
  }

  // Priority 5: empty — remains as-is if none of the above matched

  // ── Empty state check ────────────────────────────────────────────────────────
  const firstName = student.name?.split(" ")[0] || "Student"
  const isNewStudent = (!recentExams || recentExams.length === 0) && subjects.length === 0

  if (isNewStudent) {
    return (
      <div className="student-ui rounded-[20px] border border-border bg-background p-6 md:p-8">
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold">Welcome, {firstName}!</h2>
          <p className="max-w-sm text-muted-foreground">
            Your dashboard fills up after your first graded exam. Ask your teacher to upload your
            results.
          </p>
        </div>
      </div>
    )
  }

  // ── Upcoming exam within 14 days for center-col alert ───────────────────────
  const examWithin14Days =
    upcomingExams && upcomingExams.length > 0
      ? (upcomingExams as any[]).find((exam) => {
          const daysUntil = Math.ceil(
            (new Date(exam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          )
          return daysUntil <= 14
        })
      : null

  // SelfAssessmentPrompt: show for next exam within 7 days
  const soonExamForAssessment =
    upcomingExams && upcomingExams.length > 0
      ? (() => {
          const exam = upcomingExams[0] as any
          const daysUntil = Math.ceil(
            (new Date(exam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          )
          return daysUntil <= 7 ? exam : null
        })()
      : null

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* ── LEFT COLUMN (25%) ── */}
      <div className="col-span-12 md:col-span-3 space-y-4">
        {/* Student Identity Card */}
        <GlassCard className="p-4">
          <div className="space-y-1 mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Student
            </p>
            <h2 className="text-lg font-display font-bold text-foreground leading-tight">
              {student.name}
            </h2>
            {student.class && (
              <p className="text-sm text-muted-foreground">{student.class}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-background/60 border border-border px-2 py-2">
              <p className="text-base font-bold text-foreground">{student.streak ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Streak</p>
            </div>
            <div className="rounded-xl bg-background/60 border border-border px-2 py-2">
              <p className="text-base font-bold text-foreground">{pendingCount ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Due</p>
            </div>
            <div className="rounded-xl bg-background/60 border border-border px-2 py-2">
              <p className="text-base font-bold text-foreground">{completedCount ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Done</p>
            </div>
          </div>
        </GlassCard>

        {/* Subjects */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2 px-1">
            Subjects
          </p>
          <SubjectStatusList subjects={subjects} />
        </div>
      </div>

      {/* ── CENTER COLUMN (50%) ── */}
      <div className="col-span-12 md:col-span-6 space-y-4">
        {/* Today's Focus hero */}
        <TodayFocusCard focus={todayFocus} />

        {/* Pending tasks summary */}
        {(pendingCount ?? 0) > 0 && (
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-0.5">
                  Pending Tasks
                </p>
                <p className="text-sm text-foreground">
                  You have{" "}
                  <span className="font-bold text-primary">{pendingCount}</span>{" "}
                  pending task{(pendingCount ?? 0) !== 1 ? "s" : ""} to complete.
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/student/planner">
                  View tasks
                  <ArrowRight size={14} className="ml-1.5" />
                </Link>
              </Button>
            </div>
          </GlassCard>
        )}

        {/* Upcoming exam alert (within 14 days) */}
        {examWithin14Days && (
          <GlassCard className="p-4 border-amber-200/40 bg-amber-50/5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-500 mb-1">
              Upcoming Exam
            </p>
            <p className="text-sm font-semibold text-foreground">
              {(examWithin14Days as any).exam_name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(examWithin14Days as any).subject} &middot;{" "}
              {new Date((examWithin14Days as any).exam_date).toLocaleDateString()}
            </p>
          </GlassCard>
        )}

        {/* Self-assessment prompt for exam within 7 days */}
        {soonExamForAssessment && (
          <SelfAssessmentPrompt
            examId={(soonExamForAssessment as any).id}
            examName={(soonExamForAssessment as any).exam_name}
            studentId={student.id}
            subject={(soonExamForAssessment as any).subject || "General"}
          />
        )}
      </div>

      {/* ── RIGHT COLUMN (25%) ── */}
      <div className="col-span-12 md:col-span-3 space-y-4">
        {/* AI Daily Brief */}
        <AiDailyBrief studentId={student.id} />

        {/* Recent Results (last 2) */}
        {recentExams && recentExams.length > 0 && (
          <GlassCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Recent Results</h3>
              <Link
                href="/student/performance"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {(recentExams as any[]).slice(0, 2).map((sheet) => {
                const title =
                  sheet.feedback_analysis?.[0]?.exam_name ||
                  sheet.exams?.exam_name ||
                  "Exam"
                const subject =
                  sheet.feedback_analysis?.[0]?.exam_subject ||
                  sheet.exams?.subject ||
                  "General"
                const totalMarks =
                  sheet.feedback_analysis?.[0]?.exam_total_marks ||
                  sheet.exams?.total_marks ||
                  100
                const percentage = Math.round(
                  ((sheet.total_score || 0) / totalMarks) * 100,
                )

                return (
                  <div
                    key={sheet.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background p-3"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground truncate">
                        {subject}
                      </p>
                      <p className="text-sm font-semibold text-foreground truncate">{title}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          percentage >= 70
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {percentage}%
                      </span>
                      <StudyThisButton
                        examId={sheet.id}
                        examName={title}
                        studentId={student.id}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
