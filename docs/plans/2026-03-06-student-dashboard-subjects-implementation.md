# Student Dashboard Subjects Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the student dashboard into a subject-organized study companion with real subjects, task tracking, study sessions, and an integrated AI Guide per subject.

**Architecture:** Subjects are first-class entities in `student_subjects` table. Auto-created from exam data on dashboard load, manually addable. Tasks, sessions, sources, and AI Guide sessions are all linked to a `subject_id`. The dashboard shows subject cards with SVG progress rings. Clicking a subject opens a 3-column detail page (tasks+sessions | AI Guide | history).

**Tech Stack:** Next.js 15 App Router, Supabase JS client (server + admin), Tailwind CSS v4, shadcn/ui, lucide-react. No test infrastructure — verification is manual in browser.

> **Run all SQL in Supabase Dashboard → SQL Editor before starting Phase 2.**

---

## PHASE 1 — DATABASE SCHEMA

### Task 1: Create student_subjects and study_sessions tables

**Run in Supabase SQL Editor:**

```sql
-- student_subjects table
create table if not exists student_subjects (
  id           uuid primary key default gen_random_uuid(),
  student_id   text not null references students(id) on delete cascade,
  name         text not null,
  color        text not null default '#9b8cff',
  auto_created boolean not null default false,
  created_at   timestamptz not null default now(),
  unique(student_id, name)
);

-- study_sessions table
create table if not exists study_sessions (
  id               uuid primary key default gen_random_uuid(),
  student_id       text not null references students(id) on delete cascade,
  subject_id       uuid not null references student_subjects(id) on delete cascade,
  duration_minutes int not null check (duration_minutes > 0),
  notes            text,
  created_at       timestamptz not null default now()
);

-- Add subject_id to student_tasks
alter table student_tasks
  add column if not exists subject_id uuid references student_subjects(id) on delete set null;

-- Add subject_id to student_sources
alter table student_sources
  add column if not exists subject_id uuid references student_subjects(id) on delete set null;

-- Add subject_id to ai_guide_sessions
alter table ai_guide_sessions
  add column if not exists subject_id uuid references student_subjects(id) on delete set null;

-- Enable RLS
alter table student_subjects enable row level security;
alter table study_sessions enable row level security;

-- RLS policies for student_subjects
create policy "Students can read own subjects"
  on student_subjects for select
  using (student_id = (select id from students where user_id = auth.uid()));

create policy "Students can insert own subjects"
  on student_subjects for insert
  with check (student_id = (select id from students where user_id = auth.uid()));

create policy "Students can update own subjects"
  on student_subjects for update
  using (student_id = (select id from students where user_id = auth.uid()));

create policy "Students can delete own subjects"
  on student_subjects for delete
  using (student_id = (select id from students where user_id = auth.uid()));

-- RLS policies for study_sessions
create policy "Students can read own sessions"
  on study_sessions for select
  using (student_id = (select id from students where user_id = auth.uid()));

create policy "Students can insert own sessions"
  on study_sessions for insert
  with check (student_id = (select id from students where user_id = auth.uid()));

create policy "Students can delete own sessions"
  on study_sessions for delete
  using (student_id = (select id from students where user_id = auth.uid()));
```

**Verify:** Go to Supabase → Table Editor → confirm `student_subjects` and `study_sessions` tables exist with correct columns.

**Commit:**
```bash
git commit --allow-empty -m "chore: create student_subjects and study_sessions tables in Supabase"
```

---

## PHASE 2 — API ROUTES

### Task 2: GET + POST /api/student/subjects

**File:** Create `app/api/student/subjects/route.ts`

```ts
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Palette for auto-assigned subject colors
const COLORS = [
  "#9b8cff", "#FE6B4B", "#22c55e", "#f59e0b",
  "#38bdf8", "#e879f9", "#fb7185", "#34d399",
]

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const admin = createAdminClient()

  // Get student
  const { data: student } = await admin
    .from("students").select("id, class").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  // Auto-create subjects from graded exam data
  const { data: examSubjects } = await admin
    .from("answer_sheets")
    .select("exams(subject), feedback_analysis(exam_subject)")
    .eq("student_id", student.id)
    .eq("status", "approved")

  const subjectNamesFromExams = new Set<string>()
  ;(examSubjects || []).forEach((row: any) => {
    const name =
      row.feedback_analysis?.[0]?.exam_subject ||
      row.exams?.subject
    if (name) subjectNamesFromExams.add(name.trim())
  })

  // Get existing subjects
  const { data: existing } = await admin
    .from("student_subjects")
    .select("name")
    .eq("student_id", student.id)

  const existingNames = new Set((existing || []).map((s: any) => s.name))

  // Insert missing auto-subjects
  const toInsert = [...subjectNamesFromExams]
    .filter((name) => !existingNames.has(name))
    .map((name, i) => ({
      student_id: student.id,
      name,
      color: COLORS[(existingNames.size + i) % COLORS.length],
      auto_created: true,
    }))

  if (toInsert.length > 0) {
    await admin.from("student_subjects").insert(toInsert)
  }

  // Return all subjects with computed stats
  const { data: subjects } = await admin
    .from("student_subjects")
    .select("*")
    .eq("student_id", student.id)
    .order("created_at", { ascending: true })

  // For each subject, compute: avg exam score, task counts, session count this week
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const enriched = await Promise.all(
    (subjects || []).map(async (subject: any) => {
      // Avg exam score for this subject
      const { data: sheets } = await admin
        .from("answer_sheets")
        .select("total_score, exams(total_marks), feedback_analysis(exam_total_marks)")
        .eq("student_id", student.id)
        .eq("status", "approved")
        .or(
          `exams.subject.eq.${subject.name},feedback_analysis.exam_subject.eq.${subject.name}`
        )

      let avgScore = 0
      if (sheets && sheets.length > 0) {
        const scores = sheets.map((s: any) => {
          const total = s.exams?.total_marks || s.feedback_analysis?.[0]?.exam_total_marks || 100
          return ((s.total_score || 0) / total) * 100
        })
        avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      }

      // Task counts
      const { count: totalTasks } = await admin
        .from("student_tasks")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subject.id)

      const { count: completedTasks } = await admin
        .from("student_tasks")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subject.id)
        .eq("status", "completed")

      // Session count this week
      const { count: sessionCount } = await admin
        .from("study_sessions")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subject.id)
        .gte("created_at", weekAgo)

      return {
        ...subject,
        avgScore,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        sessionCount: sessionCount || 0,
      }
    })
  )

  return NextResponse.json({ subjects: enriched })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const admin = createAdminClient()
  const { data: student } = await admin
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { name, color } = await req.json()
  if (!name?.trim()) return new NextResponse("Name required", { status: 400 })

  const { data: subject, error } = await admin
    .from("student_subjects")
    .insert({ student_id: student.id, name: name.trim(), color: color || "#9b8cff", auto_created: false })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") return new NextResponse("Subject already exists", { status: 409 })
    return new NextResponse("Error", { status: 500 })
  }

  return NextResponse.json({ subject }, { status: 201 })
}
```

**Verify:** Run `npm run build` — no TypeScript errors.

**Commit:**
```bash
git add app/api/student/subjects/route.ts
git commit -m "feat: add GET+POST /api/student/subjects with auto-creation from exam data"
```

---

### Task 3: GET + DELETE /api/student/subjects/[id]

**File:** Create `app/api/student/subjects/[id]/route.ts`

```ts
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const admin = createAdminClient()
  const { data: student } = await admin
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  // Verify subject belongs to student
  const { data: subject } = await admin
    .from("student_subjects").select("*").eq("id", id).eq("student_id", student.id).maybeSingle()
  if (!subject) return new NextResponse("Not found", { status: 404 })

  // Tasks for this subject
  const { data: tasks } = await admin
    .from("student_tasks")
    .select("*")
    .eq("subject_id", id)
    .order("created_at", { ascending: false })

  // Study sessions for this subject
  const { data: sessions } = await admin
    .from("study_sessions")
    .select("*")
    .eq("subject_id", id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Exam history for this subject name
  const { data: exams } = await admin
    .from("answer_sheets")
    .select("id, total_score, created_at, status, exams(exam_name, total_marks, subject), feedback_analysis(exam_name, exam_subject, exam_total_marks)")
    .eq("student_id", student.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  // Filter exams matching this subject name
  const subjectExams = (exams || []).filter((s: any) => {
    const name = s.feedback_analysis?.[0]?.exam_subject || s.exams?.subject
    return name?.toLowerCase() === subject.name.toLowerCase()
  })

  // AI Guide sessions for this subject
  const { data: guideSessions } = await admin
    .from("ai_guide_sessions")
    .select("id, title, session_type, last_active_at")
    .eq("student_id", student.id)
    .eq("subject_id", id)
    .order("last_active_at", { ascending: false })
    .limit(5)

  return NextResponse.json({ subject, tasks, sessions, exams: subjectExams, guideSessions })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const admin = createAdminClient()
  const { data: student } = await admin
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { error } = await admin
    .from("student_subjects")
    .delete()
    .eq("id", id)
    .eq("student_id", student.id)

  if (error) return new NextResponse("Error", { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

**Commit:**
```bash
git add "app/api/student/subjects/[id]/route.ts"
git commit -m "feat: add GET+DELETE /api/student/subjects/[id]"
```

---

### Task 4: POST /api/student/study-sessions

**File:** Create `app/api/student/study-sessions/route.ts`

```ts
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const admin = createAdminClient()
  const { data: student } = await admin
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { subjectId, durationMinutes, notes } = await req.json()
  if (!subjectId || !durationMinutes) return new NextResponse("Missing fields", { status: 400 })

  const { data: session, error } = await admin
    .from("study_sessions")
    .insert({ student_id: student.id, subject_id: subjectId, duration_minutes: durationMinutes, notes })
    .select()
    .single()

  if (error) return new NextResponse("Error", { status: 500 })
  return NextResponse.json({ session }, { status: 201 })
}
```

**File:** Update `app/api/student/tasks/[taskId]/route.ts` — add POST for creating tasks:

```ts
// Add this above the existing PATCH handler:
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { title, subjectId } = await req.json()
  if (!title?.trim()) return new NextResponse("Title required", { status: 400 })

  const { data: student } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { data: task, error } = await supabase
    .from("student_tasks")
    .insert({ student_id: student.id, title: title.trim(), status: "pending", subject_id: subjectId || null })
    .select()
    .single()

  if (error) return new NextResponse("Error", { status: 500 })
  return NextResponse.json({ task }, { status: 201 })
}
```

Wait — the task creation POST should be at `/api/student/tasks` not `/api/student/tasks/[taskId]`. Create a new route:

**File:** Create `app/api/student/tasks/route.ts`

```ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { title, subjectId } = await req.json()
  if (!title?.trim()) return new NextResponse("Title required", { status: 400 })

  const { data: student } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { data: task, error } = await supabase
    .from("student_tasks")
    .insert({
      student_id: student.id,
      title: title.trim(),
      status: "pending",
      subject_id: subjectId || null,
    })
    .select()
    .single()

  if (error) return new NextResponse("Error", { status: 500 })
  return NextResponse.json({ task }, { status: 201 })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Unauthorized", { status: 401 })

  const { taskId } = await req.json()

  const { data: student } = await supabase
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) return new NextResponse("Not found", { status: 404 })

  const { error } = await supabase
    .from("student_tasks")
    .delete()
    .eq("id", taskId)
    .eq("student_id", student.id)

  if (error) return new NextResponse("Error", { status: 500 })
  return new NextResponse(null, { status: 204 })
}
```

**Commit:**
```bash
git add app/api/student/study-sessions/route.ts app/api/student/tasks/route.ts
git commit -m "feat: add study-sessions POST and tasks POST+DELETE routes"
```

---

## PHASE 3 — DASHBOARD COMPONENTS

### Task 5: SubjectCard component with SVG progress ring

**File:** Create `components/student-dashboard/subject-card.tsx`

```tsx
"use client"

import Link from "next/link"

interface SubjectCardProps {
  id: string
  name: string
  color: string
  avgScore: number        // 0-100, drives the ring
  totalTasks: number
  completedTasks: number
  sessionCount: number
}

export function SubjectCard({
  id, name, color, avgScore, totalTasks, completedTasks, sessionCount,
}: SubjectCardProps) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (avgScore / 100) * circumference

  return (
    <Link
      href={`/student/subjects/${id}`}
      className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)] transition-all min-w-[140px]"
    >
      {/* Progress Ring */}
      <div className="relative flex items-center justify-center">
        <svg width="88" height="88" className="-rotate-90">
          {/* Track */}
          <circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-border"
          />
          {/* Progress */}
          <circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={avgScore === 0 ? circumference : progress}
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute text-sm font-bold text-foreground">
          {avgScore > 0 ? `${avgScore}%` : "—"}
        </span>
      </div>

      {/* Subject name */}
      <p className="text-sm font-semibold text-foreground text-center line-clamp-2 leading-tight">
        {name}
      </p>

      {/* Stats */}
      <p className="text-xs text-muted-foreground text-center">
        {completedTasks}/{totalTasks} tasks · {sessionCount} sessions
      </p>
    </Link>
  )
}
```

**Commit:**
```bash
git add components/student-dashboard/subject-card.tsx
git commit -m "feat: add SubjectCard component with SVG progress ring"
```

---

### Task 6: SubjectCarousel component (replaces CourseCarousel)

**File:** Create `components/student-dashboard/subject-carousel.tsx`

```tsx
"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { SubjectCard } from "@/components/student-dashboard/subject-card"
import { useRouter } from "next/navigation"

interface Subject {
  id: string
  name: string
  color: string
  avgScore: number
  totalTasks: number
  completedTasks: number
  sessionCount: number
}

interface SubjectCarouselProps {
  subjects: Subject[]
}

export function SubjectCarousel({ subjects }: SubjectCarouselProps) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    await fetch("/api/student/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setLoading(false)
    setAdding(false)
    setNewName("")
    router.refresh()
  }

  return (
    <div className="rounded-2xl bg-primary p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-3xl font-semibold text-white">Your subjects</h3>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
        >
          <Plus size={13} /> Add subject
        </button>
      </div>

      {/* Add subject inline input */}
      {adding && (
        <div className="mb-4 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false) }}
            placeholder="Subject name..."
            className="flex-1 rounded-xl bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none border border-white/30 focus:border-white/60"
          />
          <button
            onClick={handleAdd}
            disabled={loading}
            className="rounded-xl bg-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/40 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Add"}
          </button>
          <button onClick={() => setAdding(false)} className="text-white/60 hover:text-white text-sm px-2">
            Cancel
          </button>
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="text-white/70 text-sm py-4 text-center">
          No subjects yet. Add one above or get your exams graded by your teacher.
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} {...subject} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Commit:**
```bash
git add components/student-dashboard/subject-carousel.tsx
git commit -m "feat: add SubjectCarousel with add-subject inline input"
```

---

### Task 7: Update dashboard page — replace static CourseCarousel with SubjectCarousel

**File:** Modify `app/student/dashboard/page.tsx`

**Step 1:** Remove these imports:
```tsx
import { CourseCarousel } from "@/components/student-dashboard/course-carousel"
```
Add:
```tsx
import { SubjectCarousel } from "@/components/student-dashboard/subject-carousel"
```

**Step 2:** Remove all the static course/fallback data computation (lines that build `courses`, `fallbackCourses` arrays).

**Step 3:** Add a subjects fetch after the existing data fetches:
```tsx
  const { data: subjectsData } = await supabase
    .from("student_subjects")
    .select("*")
    .eq("student_id", student.id)
    .order("created_at", { ascending: true })
```

Note: Auto-creation happens in the API route. The dashboard page triggers it by calling the API route on load OR we call the auto-creation logic inline. For simplicity, call the subjects API endpoint server-side using fetch:

```tsx
  // Auto-create subjects from exam data and get enriched list
  // We call our own API (simpler than duplicating the logic here)
  // Since this is a server component, we can call Supabase directly:

  // 1. Get all unique subject names from approved answer sheets
  const { data: examRows } = await supabase
    .from("answer_sheets")
    .select("exams(subject), feedback_analysis(exam_subject)")
    .eq("student_id", student.id)
    .eq("status", "approved")

  const subjectNamesFromExams = new Set<string>()
  ;(examRows || []).forEach((row: any) => {
    const name = row.feedback_analysis?.[0]?.exam_subject || row.exams?.subject
    if (name) subjectNamesFromExams.add(name.trim())
  })

  // 2. Get existing subjects
  const { data: existingSubjects } = await supabase
    .from("student_subjects")
    .select("name, color")
    .eq("student_id", student.id)

  const existingNames = new Set((existingSubjects || []).map((s: any) => s.name))
  const COLORS = ["#9b8cff","#FE6B4B","#22c55e","#f59e0b","#38bdf8","#e879f9","#fb7185","#34d399"]

  // 3. Insert missing
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

  // 4. Fetch all subjects with stats
  const { data: allSubjects } = await supabase
    .from("student_subjects")
    .select("*")
    .eq("student_id", student.id)
    .order("created_at", { ascending: true })

  // Compute avgScore per subject from exam data
  const subjects = await Promise.all(
    (allSubjects || []).map(async (subject: any) => {
      const matchingExams = (examRows || []).filter((row: any) => {
        const name = row.feedback_analysis?.[0]?.exam_subject || row.exams?.subject
        return name?.toLowerCase() === subject.name.toLowerCase()
      })

      // Get scores
      const { data: sheets } = await supabase
        .from("answer_sheets")
        .select("total_score, exams(total_marks), feedback_analysis(exam_total_marks)")
        .eq("student_id", student.id)
        .eq("status", "approved")

      const subjectSheets = (sheets || []).filter((s: any) => {
        const name = s.feedback_analysis?.[0]?.exam_subject || (s.exams as any)?.subject
        return name?.toLowerCase() === subject.name.toLowerCase()
      })

      const avgScore = subjectSheets.length > 0
        ? Math.round(
            subjectSheets.reduce((acc: number, s: any) => {
              const total = (s.exams as any)?.total_marks || s.feedback_analysis?.[0]?.exam_total_marks || 100
              return acc + ((s.total_score || 0) / total) * 100
            }, 0) / subjectSheets.length
          )
        : 0

      const { count: totalTasks } = await supabase
        .from("student_tasks").select("*", { count: "exact", head: true }).eq("subject_id", subject.id)
      const { count: completedTasks } = await supabase
        .from("student_tasks").select("*", { count: "exact", head: true }).eq("subject_id", subject.id).eq("status", "completed")
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { count: sessionCount } = await supabase
        .from("study_sessions").select("*", { count: "exact", head: true }).eq("subject_id", subject.id).gte("created_at", weekAgo)

      return { ...subject, avgScore, totalTasks: totalTasks || 0, completedTasks: completedTasks || 0, sessionCount: sessionCount || 0 }
    })
  )
```

**Step 4:** Replace the `courses` prop in `DashboardLayout`:
```tsx
// Remove:
courses={<CourseCarousel courses={courses.length > 0 ? courses : fallbackCourses} />}
// Replace with:
courses={<SubjectCarousel subjects={subjects} />}
```

**Step 5:** Update Study Process chart data to use real subject task completion:
```tsx
  // Replace static chartData with:
  const chartData = subjects.slice(0, 4).map((s: any) => ({
    label: s.name.length > 8 ? s.name.slice(0, 8) + "…" : s.name,
    value: s.totalTasks > 0 ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0,
  }))

  // Fallback if no subjects yet:
  const finalChartData = chartData.length > 0 ? chartData : [
    { label: "Tasks", value: Math.min(100, Math.round(((completedCount || 0) / Math.max(1, (completedCount || 0) + (pendingCount || 0))) * 100)) }
  ]
```

And pass `finalChartData` to `StudyProgressChart`.

**Verify:** Run `npm run dev`, open `/student/dashboard` — subjects section shows real cards with rings instead of static courses.

**Commit:**
```bash
git add app/student/dashboard/page.tsx
git commit -m "feat: replace static CourseCarousel with real SubjectCarousel on dashboard"
```

---

## PHASE 4 — SUBJECT DETAIL PAGE

### Task 8: Subject detail page layout

**File:** Create `app/student/subjects/[subjectId]/page.tsx`

```tsx
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { SubjectTasksPanel } from "@/components/subjects/subject-tasks-panel"
import { SubjectHistoryPanel } from "@/components/subjects/subject-history-panel"
import { SubjectAiGuidePanel } from "@/components/subjects/subject-ai-guide-panel"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const { subjectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const admin = createAdminClient()
  const { data: student } = await admin
    .from("students").select("id").eq("user_id", user.id).maybeSingle()
  if (!student) redirect("/")

  // Get subject
  const { data: subject } = await admin
    .from("student_subjects").select("*").eq("id", subjectId).eq("student_id", student.id).maybeSingle()
  if (!subject) notFound()

  // Tasks for this subject
  const { data: tasks } = await admin
    .from("student_tasks")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })

  // Study sessions
  const { data: sessions } = await admin
    .from("study_sessions")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })
    .limit(20)

  // Exam history for this subject
  const { data: allSheets } = await admin
    .from("answer_sheets")
    .select("id, total_score, created_at, exams(exam_name, total_marks, subject), feedback_analysis(exam_name, exam_subject, exam_total_marks)")
    .eq("student_id", student.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })

  const examHistory = (allSheets || []).filter((s: any) => {
    const name = s.feedback_analysis?.[0]?.exam_subject || s.exams?.subject
    return name?.toLowerCase() === subject.name.toLowerCase()
  })

  // AI Guide sessions for this subject
  const { data: guideSessions } = await admin
    .from("ai_guide_sessions")
    .select("id, title, session_type, last_active_at")
    .eq("student_id", student.id)
    .eq("subject_id", subjectId)
    .order("last_active_at", { ascending: false })
    .limit(5)

  // Sources for this subject
  const { data: sources } = await admin
    .from("student_sources")
    .select("id, title, type, created_at")
    .eq("student_id", student.id)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false })

  return (
    <div className="py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/student/dashboard" className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
          <h1 className="text-2xl font-display font-bold text-foreground">{subject.name}</h1>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
        {/* Tasks + Sessions */}
        <div className="lg:col-span-3 overflow-y-auto">
          <SubjectTasksPanel
            subjectId={subjectId}
            studentId={student.id}
            initialTasks={tasks || []}
            initialSessions={sessions || []}
          />
        </div>

        {/* AI Guide */}
        <div className="lg:col-span-6 overflow-y-auto">
          <SubjectAiGuidePanel
            subjectId={subjectId}
            studentId={student.id}
            subjectName={subject.name}
            guideSessions={guideSessions || []}
            sources={sources || []}
          />
        </div>

        {/* History */}
        <div className="lg:col-span-3 overflow-y-auto">
          <SubjectHistoryPanel
            examHistory={examHistory}
            sessions={sessions || []}
          />
        </div>
      </div>
    </div>
  )
}
```

**Commit:**
```bash
git add app/student/subjects/
git commit -m "feat: add subject detail page layout"
```

---

### Task 9: SubjectTasksPanel component

**File:** Create `components/subjects/subject-tasks-panel.tsx`

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Check, Trash2, Clock } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Task {
  id: string
  title: string
  status: string
  created_at: string
}

interface Session {
  id: string
  duration_minutes: number
  notes: string | null
  created_at: string
}

export function SubjectTasksPanel({
  subjectId,
  studentId,
  initialTasks,
  initialSessions,
}: {
  subjectId: string
  studentId: string
  initialTasks: Task[]
  initialSessions: Session[]
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [sessions, setSessions] = useState(initialSessions)
  const [newTask, setNewTask] = useState("")
  const [addingTask, setAddingTask] = useState(false)
  const [loggingSession, setLoggingSession] = useState(false)
  const [sessionDuration, setSessionDuration] = useState("")
  const [sessionNotes, setSessionNotes] = useState("")

  const handleAddTask = async () => {
    if (!newTask.trim()) return
    setAddingTask(true)
    const res = await fetch("/api/student/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask.trim(), subjectId }),
    })
    const { task } = await res.json()
    setTasks((prev) => [task, ...prev])
    setNewTask("")
    setAddingTask(false)
    router.refresh()
  }

  const handleToggleTask = async (taskId: string, current: string) => {
    const newStatus = current === "completed" ? "pending" : "completed"
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t))
    await fetch(`/api/student/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    router.refresh()
  }

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await fetch("/api/student/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    })
  }

  const handleLogSession = async () => {
    const mins = parseInt(sessionDuration)
    if (!mins || mins <= 0) return
    setLoggingSession(true)
    const res = await fetch("/api/student/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, durationMinutes: mins, notes: sessionNotes || null }),
    })
    const { session } = await res.json()
    setSessions((prev) => [session, ...prev])
    setSessionDuration("")
    setSessionNotes("")
    setLoggingSession(false)
    router.refresh()
  }

  const totalMinutesThisWeek = sessions
    .filter((s) => new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((acc, s) => acc + s.duration_minutes, 0)

  return (
    <div className="space-y-4 h-full">
      {/* Tasks */}
      <GlassCard className="p-4">
        <h3 className="text-base font-semibold text-foreground mb-3">Tasks</h3>

        {/* Add task input */}
        <div className="flex gap-2 mb-3">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="Add a task..."
            className="flex-1 rounded-lg bg-background border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
          />
          <button
            onClick={handleAddTask}
            disabled={addingTask || !newTask.trim()}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {addingTask ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No tasks yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 group p-2 rounded-lg hover:bg-secondary/50">
                <button
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    task.status === "completed"
                      ? "bg-primary border-primary"
                      : "border-border hover:border-primary"
                  )}
                >
                  {task.status === "completed" && <Check size={10} className="text-primary-foreground" />}
                </button>
                <span className={cn("flex-1 text-sm", task.status === "completed" && "line-through text-muted-foreground")}>
                  {task.title}
                </span>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Study Sessions */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Study Sessions</h3>
          {totalMinutesThisWeek > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={11} />
              {Math.round(totalMinutesThisWeek / 60)}h {totalMinutesThisWeek % 60}m this week
            </span>
          )}
        </div>

        {/* Log session */}
        <div className="space-y-2 mb-3">
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(e.target.value)}
              placeholder="Minutes"
              className="w-24 rounded-lg bg-background border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
            />
            <input
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="flex-1 rounded-lg bg-background border border-border px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
            />
          </div>
          <button
            onClick={handleLogSession}
            disabled={loggingSession || !sessionDuration}
            className="w-full py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/70 disabled:opacity-50 transition-colors"
          >
            {loggingSession ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Log Session"}
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No sessions logged yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {sessions.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/30">
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                </span>
                <span className="font-medium text-foreground">{s.duration_minutes}min</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
```

**Commit:**
```bash
git add components/subjects/subject-tasks-panel.tsx
git commit -m "feat: add SubjectTasksPanel with task CRUD and session logging"
```

---

### Task 10: SubjectHistoryPanel component

**File:** Create `components/subjects/subject-history-panel.tsx`

```tsx
import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Clock, FileText } from "lucide-react"

interface ExamRow {
  id: string
  total_score: number
  created_at: string
  exams: any
  feedback_analysis: any[]
}

interface Session {
  id: string
  duration_minutes: number
  created_at: string
}

export function SubjectHistoryPanel({
  examHistory,
  sessions,
}: {
  examHistory: ExamRow[]
  sessions: Session[]
}) {
  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0)
  const weekMinutes = sessions
    .filter((s) => new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((acc, s) => acc + s.duration_minutes, 0)

  return (
    <div className="space-y-4 h-full">
      {/* Time summary */}
      <GlassCard className="p-4">
        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock size={16} /> Study Time
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <p className="text-xl font-bold text-foreground">{Math.round(weekMinutes / 60)}h {weekMinutes % 60}m</p>
            <p className="text-xs text-muted-foreground">This week</p>
          </div>
          <div className="rounded-xl bg-secondary/50 p-3 text-center">
            <p className="text-xl font-bold text-foreground">{Math.round(totalMinutes / 60)}h</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </GlassCard>

      {/* Exam history */}
      <GlassCard className="p-4">
        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <FileText size={16} /> Exam History
        </h3>
        {examHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No graded exams yet.</p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {examHistory.map((sheet) => {
              const name = sheet.feedback_analysis?.[0]?.exam_name || sheet.exams?.exam_name || "Exam"
              const total = sheet.exams?.total_marks || sheet.feedback_analysis?.[0]?.exam_total_marks || 100
              const pct = Math.round(((sheet.total_score || 0) / total) * 100)
              return (
                <Link
                  key={sheet.id}
                  href={`/student/performance/${sheet.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sheet.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={cn(
                    "ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0",
                    pct >= 70 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                               : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  )}>
                    {pct}%
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
```

**Commit:**
```bash
git add components/subjects/subject-history-panel.tsx
git commit -m "feat: add SubjectHistoryPanel with exam history and study time summary"
```

---

### Task 11: SubjectAiGuidePanel component

**File:** Create `components/subjects/subject-ai-guide-panel.tsx`

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Brain, Plus, ArrowRight, Clock, Loader2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface GuideSession {
  id: string
  title: string
  session_type: string
  last_active_at: string
}

interface Source {
  id: string
  title: string
  type: string
  created_at: string
}

export function SubjectAiGuidePanel({
  subjectId,
  studentId,
  subjectName,
  guideSessions,
  sources,
}: {
  subjectId: string
  studentId: string
  subjectName: string
  guideSessions: GuideSession[]
  sources: Source[]
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const handleNewSession = async () => {
    setCreating(true)
    const res = await fetch("/api/ai-guide/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        sessionType: "free_study",
        title: `${subjectName} Study Session`,
        subjectId,
      }),
    })
    const { session } = await res.json()
    router.push(`/student/ai-guide/${session.id}`)
  }

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Brain size={18} className="text-primary" />
          AI Study Guide
        </h3>
        <button
          onClick={handleNewSession}
          disabled={creating}
          className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {creating
            ? <Loader2 size={12} className="animate-spin" />
            : <><Plus size={12} /> New session</>
          }
        </button>
      </div>

      {/* Existing sessions */}
      {guideSessions.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resume</p>
          {guideSessions.map((s) => (
            <Link key={s.id} href={`/student/ai-guide/${s.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-transparent hover:border-border hover:bg-secondary transition-all group">
                <Brain size={14} className="text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{s.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={9} />
                    {formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true })}
                  </p>
                </div>
                <ArrowRight size={13} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {guideSessions.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Brain size={28} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No sessions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start a new AI Guide session for {subjectName}. Upload your notes, ask questions, get summaries and practice problems.
            </p>
          </div>
          <button
            onClick={handleNewSession}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Start studying</>}
          </button>
        </div>
      )}

      {/* Sources summary */}
      {sources.length > 0 && (
        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {sources.length} source{sources.length > 1 ? "s" : ""} uploaded for {subjectName}
          </p>
        </div>
      )}
    </GlassCard>
  )
}
```

**Commit:**
```bash
git add components/subjects/subject-ai-guide-panel.tsx
git commit -m "feat: add SubjectAiGuidePanel with session list and new session creation"
```

---

### Task 12: Update AI Guide sessions API to accept subject_id

**File:** Modify `app/api/ai-guide/sessions/route.ts`

Read the file first. Find the POST handler. Add `subjectId` to the insert:

```ts
// In the POST body destructuring, add:
const { studentId, sessionType, errorFocus, title, subjectId } = await req.json()

// In the insert, add:
subject_id: subjectId || null,
```

**Commit:**
```bash
git add app/api/ai-guide/sessions/route.ts
git commit -m "feat: accept subject_id when creating AI Guide sessions"
```

---

## PHASE 5 — FINAL VERIFICATION

### Task 13: Build check and push

**Step 1:**
```bash
npm run build
```
Expected: Clean build, no TypeScript errors.

**Step 2: Manual browser checks**
- `/student/dashboard` → subject cards with progress rings visible, no static courses
- Study Process chart → bars show real task completion % per subject (or empty state if no tasks)
- Click a subject card → navigates to `/student/subjects/[id]`
- Subject detail page → 3 columns visible
- Add a task → appears in list, checkbox works
- Log a study session → appears in sessions list, time summary updates
- "New session" in AI Guide panel → creates session and navigates to `/student/ai-guide/[id]`
- Click exam in history → navigates to `/student/performance/[id]`

**Step 3:**
```bash
git push origin main
```
