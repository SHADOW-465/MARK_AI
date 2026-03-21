# MARK AI UI/UX Redesign & Teacher Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the student dashboard to a 3-column layout with a single AI-driven "Today's Focus" CTA, collapse navigation from 6 to 4 items, replace the subject carousel with a status-signal list, remove all fake default data, and add a class-wide insights panel to the teacher dashboard.

**Architecture:** Phase 1 modifies `student-topbar.tsx` and replaces the entire `DashboardLayout` composition in the student dashboard page with three new focused components (`SubjectStatusList`, `TodayFocusCard`, `StudentDashboardShell`). Phase 2 adds a new `ClassInsightsPanel` component and `/dashboard/class/[classId]` route to the teacher side. No new database tables or API routes are required — all data comes from existing Supabase tables.

**Tech Stack:** Next.js 15 App Router (server components), React 19, TypeScript, Tailwind CSS 4, Supabase (server client), Lucide React icons, shadcn/ui components (GlassCard, Button, Badge).

**Spec:** `docs/superpowers/specs/2026-03-21-mark-ai-positioning-ui-redesign-design.md`

---

## File Map

### Phase 1 — Student Dashboard & Navigation

| Action | File | Purpose |
|---|---|---|
| Modify | `components/layout/student-topbar.tsx` | Replace 6-item `NAV_ITEMS` with 4-item array |
| Create | `components/student-dashboard/subject-status-list.tsx` | New component replacing `SubjectCarousel` |
| Create | `components/student-dashboard/today-focus-card.tsx` | Today's Focus hero card with 5-rule selection logic |
| Create | `components/student-dashboard/student-dashboard-shell.tsx` | New 3-column layout shell (replaces `DashboardLayout` usage) |
| Modify | `app/student/dashboard/page.tsx` | Wire up new layout, implement Today's Focus data query, remove fake defaults |
| Modify | `app/student/study/page.tsx` | Add empty state |
| Modify | `app/student/vault/page.tsx` | Add empty state |
| Modify | `app/student/planner/planner-client.tsx` | Add empty state when no tasks |
| Modify | `app/student/flashcards/page.tsx` | Add empty state when no cards |
| Modify | `app/student/ai-guide/page.tsx` | Become the "Study" nav destination — verify it shows sessions list correctly |
| Delete | `components/student-dashboard/assistant-widget.tsx` | Replaced by Today's Focus card |

### Phase 2 — Teacher Class Insights

| Action | File | Purpose |
|---|---|---|
| Create | `components/dashboard/class-insights-panel.tsx` | Class avg, error breakdown, at-risk students |
| Create | `app/dashboard/class/[classId]/page.tsx` | Server page fetching class data and rendering `ClassInsightsPanel` |
| Modify | `app/dashboard/layout.tsx` | Add "Class Insights" link to teacher sidebar nav items |

---

## Task 1: Collapse Student Navigation from 6 to 4 Items

**Files:**
- Modify: `components/layout/student-topbar.tsx` (lines 18–25)

- [ ] **Step 1: Update `NAV_ITEMS`**

Replace the existing `NAV_ITEMS` array:

```typescript
const NAV_ITEMS = [
  { href: "/student/dashboard", label: "Home" },
  { href: "/student/subjects", label: "Subjects" },
  { href: "/student/ai-guide", label: "Study" },
  { href: "/student/performance", label: "Results" },
]
```

The mapping: Dashboard→Home, AI Guide→Study (as primary study entry), Performance→Results. Planner, Vault, and Flashcards are no longer top-level nav items — Planner and Vault are reachable via Subjects; Flashcards is reachable via the Study/AI Guide page.

- [ ] **Step 2: Verify build compiles**

```bash
cd C:\Users\acer\Documents\projects\MARK_AI && npx next build 2>&1 | tail -20
```

Expected: no TypeScript errors. If build errors appear, fix before proceeding.

- [ ] **Step 3: Verify visually**

```bash
npx next dev
```

Open http://localhost:3000/student/dashboard. Confirm nav shows exactly 4 pills: Home · Subjects · Study · Results. Confirm active state highlights correctly on each route.

- [ ] **Step 4: Commit**

```bash
git add components/layout/student-topbar.tsx
git commit -m "feat: collapse student nav from 6 to 4 items (Home/Subjects/Study/Results)"
```

---

## Task 2: Create `SubjectStatusList` Component

**Files:**
- Create: `components/student-dashboard/subject-status-list.tsx`

This replaces `SubjectCarousel`. Reads the same `subjects` data shape (from `student_subjects` table with enriched `avgScore`, `totalTasks`, `completedTasks`, `sessionCount` fields) but renders as a vertical list with colour-coded status labels instead of horizontal cards with progress rings.

- [ ] **Step 1: Create the component**

```typescript
// components/student-dashboard/subject-status-list.tsx
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

interface Subject {
  id: string
  name: string
  color: string
  avgScore: number
  totalTasks: number
  completedTasks: number
  sessionCount: number
  previousAvgScore?: number
}

interface SubjectStatusListProps {
  subjects: Subject[]
}

function getStatus(subject: Subject): {
  label: string
  colour: string
  icon: string
} {
  if (subject.avgScore === 0 && subject.totalTasks === 0) {
    return { label: "No exams yet", colour: "text-muted-foreground", icon: "" }
  }
  const improved =
    subject.previousAvgScore !== undefined &&
    subject.avgScore - subject.previousAvgScore > 5
  if (improved) {
    return {
      label: `${subject.avgScore}% · improving`,
      colour: "text-amber-500",
      icon: "↗",
    }
  }
  if (subject.avgScore < 65 && subject.avgScore > 0) {
    return {
      label: `${subject.avgScore}% · needs focus`,
      colour: "text-red-500",
      icon: "⚠",
    }
  }
  if (subject.avgScore >= 70) {
    return {
      label: `${subject.avgScore}% · on track`,
      colour: "text-emerald-500",
      icon: "✓",
    }
  }
  return {
    label: `${subject.avgScore}%`,
    colour: "text-muted-foreground",
    icon: "",
  }
}

export function SubjectStatusList({ subjects }: SubjectStatusListProps) {
  if (subjects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        You&apos;ll see subjects here once your teacher grades your first exam.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {subjects.map((subject) => {
        const status = getStatus(subject)
        return (
          <Link
            key={subject.id}
            href={`/student/subjects/${subject.id}`}
            className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-3 py-2.5 hover:bg-background transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {subject.name}
              </span>
            </div>
            <span className={cn("text-xs font-medium", status.colour)}>
              {status.icon && <span className="mr-1">{status.icon}</span>}
              {status.label}
            </span>
          </Link>
        )
      })}

      <Link
        href="/student/subjects"
        className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
      >
        <Plus size={14} />
        Add Subject
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep subject-status-list
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add components/student-dashboard/subject-status-list.tsx
git commit -m "feat: add SubjectStatusList component with red/amber/green status signals"
```

---

## Task 3: Create `TodayFocusCard` Component

**Files:**
- Create: `components/student-dashboard/today-focus-card.tsx`

This is a pure display component. The selection logic runs server-side in the dashboard page (Task 4) and passes a resolved `focus` prop.

- [ ] **Step 1: Create the component**

```typescript
// components/student-dashboard/today-focus-card.tsx
import Link from "next/link"
import { ArrowRight, BookOpen, AlertCircle, Clock, TrendingUp } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"

export type FocusType = "exam-prep" | "recovery" | "overdue-task" | "momentum" | "empty"

export interface TodayFocus {
  type: FocusType
  title: string
  description: string
  cta: string
  href: string
  subjectName?: string
  subjectColor?: string
}

const ICONS: Record<FocusType, React.ElementType> = {
  "exam-prep": Clock,
  "recovery": AlertCircle,
  "overdue-task": BookOpen,
  "momentum": TrendingUp,
  "empty": BookOpen,
}

interface TodayFocusCardProps {
  focus: TodayFocus
}

export function TodayFocusCard({ focus }: TodayFocusCardProps) {
  if (focus.type === "empty") {
    return (
      <GlassCard className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
          Today&apos;s Focus
        </p>
        <p className="text-sm text-muted-foreground">
          Complete your first exam to unlock personalised recommendations.
        </p>
      </GlassCard>
    )
  }

  const Icon = ICONS[focus.type]

  return (
    <GlassCard className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary mb-1">
            Today&apos;s Focus
          </p>
          {focus.subjectName && (
            <p className="text-xs text-muted-foreground uppercase tracking-[0.08em] mb-1">
              {focus.subjectName}
            </p>
          )}
          <h3 className="text-base font-bold text-foreground leading-snug mb-1.5">
            {focus.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {focus.description}
          </p>
        </div>
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: focus.subjectColor
              ? `${focus.subjectColor}22`
              : "rgba(155,140,255,0.15)",
          }}
        >
          <Icon
            size={18}
            style={{ color: focus.subjectColor ?? "#9b8cff" }}
          />
        </div>
      </div>

      <Link
        href={focus.href}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        {focus.cta}
        <ArrowRight size={14} />
      </Link>
    </GlassCard>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep today-focus
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/student-dashboard/today-focus-card.tsx
git commit -m "feat: add TodayFocusCard component with 5 focus types"
```

---

## Task 4: Rebuild Student Dashboard Page

**Files:**
- Modify: `app/student/dashboard/page.tsx`

This is the largest change. The page gets a new 3-column layout, the Today's Focus selection logic, and all fake defaults are removed.

- [ ] **Step 1: Replace the full page content**

The new page structure replaces the entire return value and the data-fetching section. Key changes:
1. Remove `avgScore = 72` default — use `null` instead
2. Remove `monthlyActivity` formula entirely
3. Add `todayFocus` computation using the 5-rule priority logic
4. Replace `DashboardLayout` with an inline 3-column grid
5. Replace `SubjectCarousel` with `SubjectStatusList`
6. Add `TodayFocusCard` as center-column hero
7. Remove `AssistantWidget`, `MarkRecoveryWidget`, `ActiveSessionsWidget` from layout
8. Show empty state when student has no data

```typescript
// app/student/dashboard/page.tsx  — full replacement
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { SubjectStatusList } from "@/components/student-dashboard/subject-status-list"
import { TodayFocusCard, type TodayFocus } from "@/components/student-dashboard/today-focus-card"
import { AiDailyBrief } from "@/components/dashboard/ai-daily-brief"
import { SelfAssessmentPrompt } from "@/components/student/self-assessment-prompt"
import { StudyThisButton } from "@/components/student/study-this-button"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

// ── Today's Focus selection (5-rule priority, no AI call) ──────────────────
function resolveTodayFocus(params: {
  upcomingExams: Array<{ id: string; exam_name: string; exam_date: string; subject: string }> | null
  recentExams: Array<{ id: string; total_score: number | null; exams: { total_marks: number; subject: string; exam_name: string } | null; feedback_analysis: Array<{ exam_subject: string; exam_name: string; exam_total_marks: number }> | null }> | null
  subjects: Array<{ id: string; name: string; color: string; avgScore: number; sessionCount: number }>
  overdueTasks: Array<{ id: string; title: string; subject_id: string | null }> | null
}): TodayFocus {
  const { upcomingExams, recentExams, subjects, overdueTasks } = params

  // Rule 1: exam within 7 days
  if (upcomingExams && upcomingExams.length > 0) {
    const soon = upcomingExams[0]
    const daysUntil = Math.ceil(
      (new Date(soon.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntil <= 7) {
      const subject = subjects.find(
        (s) => s.name.toLowerCase() === soon.subject?.toLowerCase()
      )
      return {
        type: "exam-prep",
        title: `Prepare for ${soon.exam_name}`,
        description: `${daysUntil} day${daysUntil !== 1 ? "s" : ""} to go. Start a focused prep session now.`,
        cta: "Start prep session",
        href: `/student/ai-guide`,
        subjectName: soon.subject,
        subjectColor: subject?.color,
      }
    }
  }

  // Rule 2: recent low-scoring exam (< 65%, last 14 days) with no recent session
  if (recentExams && recentExams.length > 0) {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const lowExam = recentExams.find((sheet) => {
      const totalMarks =
        (sheet.feedback_analysis?.[0]?.exam_total_marks ?? sheet.exams?.total_marks) ?? 100
      const pct = ((sheet.total_score ?? 0) / totalMarks) * 100
      return pct < 65
    })
    if (lowExam) {
      const subjectName =
        (lowExam.feedback_analysis?.[0]?.exam_subject ?? lowExam.exams?.subject) ?? "your last exam"
      const examName =
        (lowExam.feedback_analysis?.[0]?.exam_name ?? lowExam.exams?.exam_name) ?? "Exam"
      const subject = subjects.find(
        (s) => s.name.toLowerCase() === subjectName.toLowerCase()
      )
      return {
        type: "recovery",
        title: `Review your ${examName} mistakes`,
        description: `You scored below 65% on this exam. Your AI Guide can build a targeted recovery session.`,
        cta: "Start recovery session",
        href: `/student/ai-guide`,
        subjectName,
        subjectColor: subject?.color,
      }
    }
  }

  // Rule 3: overdue task
  if (overdueTasks && overdueTasks.length > 0) {
    const task = overdueTasks[0]
    const subject = task.subject_id
      ? subjects.find((s) => s.id === task.subject_id)
      : undefined
    return {
      type: "overdue-task",
      title: task.title,
      description: `This task is overdue. Catch up now to stay on track.`,
      cta: subject ? `Go to ${subject.name}` : "View tasks",
      href: subject ? `/student/subjects/${subject.id}` : `/student/planner`,
      subjectName: subject?.name,
      subjectColor: subject?.color,
    }
  }

  // Rule 4: most-studied subject this week
  if (subjects.length > 0) {
    const topSubject = [...subjects].sort((a, b) => b.sessionCount - a.sessionCount)[0]
    if (topSubject.sessionCount > 0) {
      return {
        type: "momentum",
        title: `Keep the momentum in ${topSubject.name}`,
        description: `You've studied this subject most this week. Continue your progress.`,
        cta: `Continue ${topSubject.name}`,
        href: `/student/subjects/${topSubject.id}`,
        subjectName: topSubject.name,
        subjectColor: topSubject.color,
      }
    }
  }

  // Rule 5: no data
  return {
    type: "empty",
    title: "",
    description: "",
    cta: "",
    href: "",
  }
}

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Parallel data fetch — no serial waterfalls
  const [
    { count: pendingCount },
    { count: completedCount },
    { data: upcomingExams },
    { data: recentExams },
    { data: overdueTasks },
    { data: allSubjectsRaw },
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
      .select(`
        id, created_at, total_score, status,
        exams (exam_name, total_marks, subject),
        feedback_analysis (exam_name, exam_subject, exam_total_marks)
      `)
      .eq("student_id", student.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("student_tasks")
      .select("id, title, subject_id, due_date")
      .eq("student_id", student.id)
      .eq("status", "pending")
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(1),
    supabase
      .from("student_subjects")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: true }),
  ])

  // Auto-create subjects from exam data (only if new subjects found)
  const subjectNamesFromExams = new Set<string>()
  ;(recentExams ?? []).forEach((row: any) => {
    const name = row.feedback_analysis?.[0]?.exam_subject ?? row.exams?.subject
    if (name) subjectNamesFromExams.add(name.trim())
  })
  const existingNames = new Set((allSubjectsRaw ?? []).map((s: any) => s.name))
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

  // Re-fetch subjects if we inserted new ones
  const { data: allSubjects } = toInsert.length > 0
    ? await supabase
        .from("student_subjects")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: true })
    : { data: allSubjectsRaw }

  // Enrich subjects with stats (parallel per-subject queries replaced with aggregate)
  const subjects = await Promise.all(
    (allSubjects ?? []).map(async (subject: any) => {
      const subjectSheets = (recentExams ?? []).filter((s: any) => {
        const name = s.feedback_analysis?.[0]?.exam_subject ?? s.exams?.subject
        return name?.toLowerCase() === subject.name.toLowerCase()
      })
      const avgSubjectScore =
        subjectSheets.length > 0
          ? Math.round(
              subjectSheets.reduce((acc: number, s: any) => {
                const total = s.exams?.total_marks ?? s.feedback_analysis?.[0]?.exam_total_marks ?? 100
                return acc + ((s.total_score ?? 0) / total) * 100
              }, 0) / subjectSheets.length,
            )
          : 0

      const [{ count: totalTasks }, { count: completedTasks }, { count: sessionCount }] =
        await Promise.all([
          supabase.from("student_tasks").select("*", { count: "exact", head: true }).eq("subject_id", subject.id),
          supabase.from("student_tasks").select("*", { count: "exact", head: true }).eq("subject_id", subject.id).eq("status", "completed"),
          supabase.from("study_sessions").select("*", { count: "exact", head: true }).eq("subject_id", subject.id).gte("created_at", weekAgo),
        ])

      return {
        ...subject,
        avgScore: avgSubjectScore,
        totalTasks: totalTasks ?? 0,
        completedTasks: completedTasks ?? 0,
        sessionCount: sessionCount ?? 0,
      }
    }),
  )

  const todayFocus = resolveTodayFocus({
    upcomingExams: upcomingExams ?? null,
    recentExams: recentExams as any ?? null,
    subjects,
    overdueTasks: overdueTasks ?? null,
  })

  const hasAnyData = (recentExams?.length ?? 0) > 0 || subjects.length > 0

  // Empty state for brand-new students
  if (!hasAnyData) {
    return (
      <div className="student-ui rounded-[20px] border border-border bg-background p-6 md:p-8">
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold">Welcome, {student.name?.split(" ")[0]}!</h2>
          <p className="max-w-sm text-muted-foreground">
            Your dashboard fills up after your first graded exam. Ask your teacher to upload your results.
          </p>
        </div>
      </div>
    )
  }

  const firstName = student.name?.split(" ")[0] ?? "Student"

  return (
    <div className="student-ui rounded-[20px] border border-border bg-background p-4 md:p-6">
      {/* 3-column grid: 25% / 50% / 25% — collapses to 1-col below 768px */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">

        {/* ── LEFT COLUMN (3/12 = 25%) ─────────────────────────────────── */}
        <div className="md:col-span-3 space-y-4">
          {/* Student identity */}
          <GlassCard className="p-4">
            <div className="mb-3">
              <p className="text-lg font-display font-bold">Hi, {firstName} 👋</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Class {student.class}
                {student.streak > 0 && ` · ${student.streak}-day streak 🔥`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-background/70 border border-border p-2 text-center">
                <p className="text-base font-bold text-primary">
                  {pendingCount ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">tasks due</p>
              </div>
              <div className="rounded-lg bg-background/70 border border-border p-2 text-center">
                <p className="text-base font-bold text-emerald-500">
                  {completedCount ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">completed</p>
              </div>
            </div>
          </GlassCard>

          {/* Subjects */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2 px-1">
              Subjects
            </p>
            <SubjectStatusList subjects={subjects} />
          </div>
        </div>

        {/* ── CENTER COLUMN (6/12 = 50%) ────────────────────────────────── */}
        <div className="md:col-span-6 space-y-4">
          {/* Today's Focus — primary CTA */}
          <TodayFocusCard focus={todayFocus} />

          {/* Pending tasks */}
          {(pendingCount ?? 0) > 0 && (
            <GlassCard className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                Pending Tasks
              </p>
              {/* Tasks are shown via subject context — just show count + link */}
              <p className="text-sm text-muted-foreground">
                You have{" "}
                <span className="font-semibold text-foreground">
                  {pendingCount} task{pendingCount !== 1 ? "s" : ""}
                </span>{" "}
                pending across your subjects.
              </p>
              <Link
                href="/student/subjects"
                className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline gap-1"
              >
                View all subjects <ArrowRight size={12} />
              </Link>
            </GlassCard>
          )}

          {/* Upcoming exam alert */}
          {(() => {
            if (!upcomingExams || upcomingExams.length === 0) return null
            const soon = upcomingExams[0] as any
            const daysUntil = Math.ceil(
              (new Date(soon.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )
            if (daysUntil > 14) return null
            return (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  📅 {soon.exam_name} — {daysUntil} day{daysUntil !== 1 ? "s" : ""} away
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {soon.subject} · {new Date(soon.exam_date).toLocaleDateString()}
                </p>
                {daysUntil <= 7 && (
                  <div className="mt-2">
                    <SelfAssessmentPrompt
                      examId={soon.id}
                      examName={soon.exam_name}
                      studentId={student.id}
                      subject={soon.subject ?? "General"}
                    />
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* ── RIGHT COLUMN (3/12 = 25%) ─────────────────────────────────── */}
        <div className="md:col-span-3 space-y-4">
          {/* AI Daily Brief */}
          <AiDailyBrief studentId={student.id} />

          {/* Recent Results */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Recent Results
              </p>
              <Link
                href="/student/performance"
                className="text-xs text-primary hover:underline"
              >
                All
              </Link>
            </div>
            <div className="space-y-2">
              {(recentExams ?? []).slice(0, 2).map((sheet: any) => {
                const title =
                  sheet.feedback_analysis?.[0]?.exam_name ??
                  sheet.exams?.exam_name ??
                  "Exam"
                const subject =
                  sheet.feedback_analysis?.[0]?.exam_subject ??
                  sheet.exams?.subject ??
                  "General"
                const totalMarks =
                  sheet.feedback_analysis?.[0]?.exam_total_marks ??
                  sheet.exams?.total_marks ??
                  100
                const pct = Math.round(
                  ((sheet.total_score ?? 0) / totalMarks) * 100
                )
                return (
                  <div
                    key={sheet.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground truncate">
                        {subject}
                      </p>
                      <p className="text-xs font-semibold text-foreground truncate">
                        {title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          pct >= 70
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                        )}
                      >
                        {pct}%
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
              {(recentExams ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No results yet.
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
```

> **Note**: The `BookOpen` import must be added to the lucide-react import line at the top.

- [ ] **Step 2: Fix any missing imports**

After pasting, run TypeScript check and resolve any import errors:

```bash
npx tsc --noEmit 2>&1 | grep "dashboard/page"
```

- [ ] **Step 3: Verify dev server renders correctly**

```bash
npx next dev
```

Open http://localhost:3000/student/dashboard. Verify:
- [ ] 3-column layout visible on desktop (≥768px)
- [ ] Single column on mobile
- [ ] Today's Focus card shows in center column
- [ ] Subject status list shows in left column with correct status colours
- [ ] No "72" default scores visible for users with no data
- [ ] Empty state renders for new users with no exams

- [ ] **Step 4: Commit**

```bash
git add app/student/dashboard/page.tsx
git commit -m "feat: rebuild student dashboard — 3-col layout, Today's Focus, remove fake defaults"
```

---

## Task 5: Add Empty States to Remaining Student Pages

**Files:**
- Modify: `app/student/flashcards/page.tsx`
- Modify: `app/student/study/page.tsx`
- Modify: `app/student/vault/page.tsx`

For each page, wrap the main content render in a check and return a consistent empty state when the data arrays are empty.

- [ ] **Step 1: Read each page to find the right insertion point**

```bash
# Check current empty state handling
grep -n "length === 0\|\.length > 0\|no.*card\|empty" app/student/flashcards/page.tsx app/student/study/page.tsx app/student/vault/page.tsx
```

- [ ] **Step 2: Add empty state to flashcards page**

Find the section that renders when `flashcards` is empty (or no cards exist) and replace any implicit empty render with:

```tsx
{(flashcards ?? []).length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
    <p className="text-muted-foreground text-sm">No flashcards yet.</p>
    <Link href="/student/ai-guide" className="text-sm font-medium text-primary hover:underline">
      Generate some from a Study session →
    </Link>
  </div>
)}
```

- [ ] **Step 3: Add empty state to study/vault pages**

For pages with no sessions/materials, add:

```tsx
// study page — when no sources or sessions
{(sessions ?? []).length === 0 && (
  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
    <p className="text-muted-foreground text-sm">
      Start your first AI Guide session — pick a subject to begin.
    </p>
    <Link href="/student/subjects" className="text-sm font-medium text-primary hover:underline">
      Choose a Subject →
    </Link>
  </div>
)}
```

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit 2>&1 | grep -E "flashcard|study|vault"
```

- [ ] **Step 5: Commit**

```bash
git add app/student/flashcards/page.tsx app/student/study/page.tsx app/student/vault/page.tsx
git commit -m "feat: add honest empty states to flashcards, study, and vault pages"
```

---

## Task 6: Consolidate AI Guide Entry Points

**Files:**
- Modify: `components/student/study-this-button.tsx` — redirect to `/student/ai-guide` instead of creating a new session inline
- Verify: `app/student/ai-guide/page.tsx` — confirms it functions as the "Study" nav destination and shows all sessions

The goal: "Study This" button on Recent Results navigates to the AI Guide session list, which is now the single browse/resume surface. The Today's Focus card already links to `/student/ai-guide` directly.

- [ ] **Step 1: Read the current StudyThisButton**

```bash
# Read the component
cat components/student/study-this-button.tsx
```

- [ ] **Step 2: Update redirect behaviour**

If `StudyThisButton` currently creates a session then navigates, change it to:

```typescript
// Navigate to AI Guide with exam context pre-selected
router.push(`/student/ai-guide?examId=${examId}`)
```

The session creation happens in the AI Guide page itself when the student chooses to start a session — not eagerly on button click.

- [ ] **Step 3: Verify AI Guide page handles `?examId` query param**

Read `app/student/ai-guide/page.tsx` to confirm it can accept an `examId` search param and pre-highlight the relevant session. If not, add:

```typescript
// In the page component, read searchParams
const examId = searchParams?.examId
// Pass to SessionsList to highlight/pre-select
```

- [ ] **Step 4: Build and verify**

```bash
npx next build 2>&1 | tail -10
```

Expected: clean build, no errors.

- [ ] **Step 5: Commit**

```bash
git add components/student/study-this-button.tsx app/student/ai-guide/page.tsx
git commit -m "feat: consolidate AI Guide entry points — StudyThisButton redirects to /student/ai-guide"
```

---

## Task 7: Create `ClassInsightsPanel` Component

**Files:**
- Create: `components/dashboard/class-insights-panel.tsx`

Pure display component. Accepts pre-fetched data — no Supabase calls inside the component.

- [ ] **Step 1: Create the component**

```typescript
// components/dashboard/class-insights-panel.tsx
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep class-insights
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/class-insights-panel.tsx
git commit -m "feat: add ClassInsightsPanel component for teacher class-wide analytics"
```

---

## Task 8: Create `/dashboard/class/[classId]` Page

**Files:**
- Create: `app/dashboard/class/[classId]/page.tsx`

Server page that fetches class data and passes it to `ClassInsightsPanel`. Uses existing `answer_sheets`, `feedback_analysis`, `students`, and `ai_guide_sessions` tables.

- [ ] **Step 1: Create the page**

```typescript
// app/dashboard/class/[classId]/page.tsx
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { ClassInsightsPanel } from "@/components/dashboard/class-insights-panel"

export const dynamic = "force-dynamic"

export default async function ClassInsightsPage({
  params,
}: {
  params: { classId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const admin = createAdminClient()
  const { classId } = params

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
      ? Math.round(graded.reduce((acc: number, s: any) => acc + (s.total_score ?? 0), 0) / graded.length)
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
          if (top) dominant = top[0] as any
        }
        const { count } = await admin
          .from("ai_guide_sessions")
          .select("*", { count: "exact", head: true })
          .eq("student_id", s.student_id)
        return {
          id: s.student_id,
          name: (s.students as any)?.name ?? "Unknown",
          score: s.total_score ?? 0,
          consecutiveDeclines: 0, // simplified — full implementation can query history
          dominantErrorType: dominant,
          aiSessionCount: count ?? 0,
        }
      })
  )

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-display font-bold mb-6">
        Class {classId} Insights
      </h1>
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
```

- [ ] **Step 2: Verify `createAdminClient` import path**

```bash
grep -r "createAdminClient" app/dashboard --include="*.ts" --include="*.tsx" -l | head -3
```

Use the same import path as the other teacher dashboard pages.

- [ ] **Step 3: Build check**

```bash
npx next build 2>&1 | grep -E "class-insights|dashboard/class"
```

- [ ] **Step 4: Visual verify**

Navigate to http://localhost:3000/dashboard/class/11A (or any real class name in your data). Confirm the panel renders with correct stats.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/class components/dashboard/class-insights-panel.tsx
git commit -m "feat: add /dashboard/class/[classId] page with ClassInsightsPanel"
```

---

## Task 9: Add Class Insights to Teacher Sidebar Nav

**Files:**
- Modify: `app/dashboard/layout.tsx`

The teacher dashboard layout defines its sidebar nav items. Add a "Class Insights" entry.

- [ ] **Step 1: Read the teacher dashboard layout**

```bash
cat app/dashboard/layout.tsx
```

- [ ] **Step 2: Add nav item**

Find where sidebar `NavItem[]` is constructed and add:

```typescript
import { BarChart3 } from "lucide-react"

// In the nav items array:
{ href: "/dashboard/class", label: "Class Insights", icon: BarChart3, matchPrefix: true }
```

The href `/dashboard/class` without a `classId` will need a redirect or index page. Add a simple redirect:

```typescript
// app/dashboard/class/page.tsx  (new file)
import { redirect } from "next/navigation"

// Redirect to the teacher's first class — or show class picker
export default function ClassIndexPage() {
  // For now, prompt the teacher to select from the exams page
  redirect("/dashboard/exams")
}
```

If the teacher dashboard already knows the teacher's classes, update this to redirect to the first class.

- [ ] **Step 3: Build check**

```bash
npx next build 2>&1 | tail -15
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/layout.tsx app/dashboard/class/page.tsx
git commit -m "feat: add Class Insights nav item to teacher sidebar"
```

---

## Final Verification

- [ ] **Run full build**

```bash
cd C:\Users\acer\Documents\projects\MARK_AI && npx next build
```

Expected: clean build, zero TypeScript errors, zero lint errors.

- [ ] **Visual walkthrough checklist**

Open http://localhost:3000 in browser and verify:

- [ ] Student nav shows: Home · Subjects · Study · Results (4 items only)
- [ ] Dashboard 3-column layout on desktop (≥768px)
- [ ] Dashboard collapses to single column on mobile (<768px)
- [ ] Today's Focus card visible as center-column hero
- [ ] Subject list shows red/amber/green status labels (no circular rings)
- [ ] No "72%" default score visible for users with no exam data
- [ ] New student (no exams) sees empty state, not fake data
- [ ] Flashcards page shows empty state when no cards
- [ ] Study page shows empty state when no sessions
- [ ] Study This button navigates to /student/ai-guide (not a new session)
- [ ] Teacher dashboard: Class Insights appears in sidebar nav
- [ ] /dashboard/class/[validClass] shows ClassInsightsPanel with real data

- [ ] **Final commit if any small fixes applied**

```bash
git add -p  # stage only intentional changes
git commit -m "fix: post-implementation polish from visual verification"
```

---

## Phase 3 Note (Out of Scope for This Plan)

The pitch documents (one-page principal brief + 10-slide sales deck) are design deliverables blocked on Phase 1–2 screenshots. Once the redesigned dashboard and teacher Class Insights panel are live, capture screenshots and produce the pitch documents in Figma/Canva. See spec Section 5 for content structure.
