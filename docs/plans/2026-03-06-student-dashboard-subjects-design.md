# MARK AI — Student Dashboard Subjects Refactor Design

**Date**: 2026-03-06
**Status**: Approved
**Approach**: Subjects as first-class entities — auto-derived from exams + manually addable

---

## 1. Executive Summary

Transform the student dashboard from a static, exam-result-centric view into a fully functional, subject-organized study companion. Subjects become the core organizing unit of the student experience. Everything — tasks, study sessions, exam history, AI Guide — is anchored to a subject.

Design inspiration: EasyLearn bento-grid layout (clean cards, progress rings, clear visual hierarchy).

---

## 2. Dashboard Layout

Bento grid, same structure as the EasyLearn inspiration:

```
┌─────────────────────────────────────────────────────────────┐
│  GLOBAL TOPBAR (fixed — already built)                       │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  LEFT PANEL  │  YOUR SUBJECTS  (subject cards with rings)  │
│  (25%)       │  ─────────────────────────────────────────  │
│              │  STUDY PROCESS  │  AI DAILY BRIEF           │
│  Profile     │  (tasks+sessions│  + ACTIVE SESSIONS        │
│  Welcome     │   this week)    │  + UPCOMING EXAMS         │
│  Activity %  │                 │                           │
│  Stats       │                                              │
│  (in prog /  │                                              │
│   upcoming / │                                              │
│   completed) │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

**Changes from current dashboard:**
- Static course carousel → real subject cards with progress rings
- Static study process chart → real task completion % per subject per week
- Recent Results section → moved to subject detail page (belongs there)
- Left panel (profile, stats) → unchanged

---

## 3. Subject Cards

### Dashboard card (minimal)

Each card shows:
- Circular progress ring (= average exam score % for this subject)
- Subject name
- Task count + session count this week

```
┌─────────────────┐
│    ╭──────╮     │
│   ╱  72%  ╲    │
│  │  Physics │   │
│   ╲        ╱   │
│    ╰──────╯     │
│  3 tasks · 2 sessions │
└─────────────────┘
```

Cards scroll horizontally. A **"+ Add Subject"** card at the end lets students add subjects not yet in their exam data.

Clicking any subject card navigates to `/student/subjects/[subjectId]`.

### Subject auto-creation

On every dashboard load, a server-side job checks `answer_sheets` for this student, extracts unique subject names, and creates `student_subjects` rows for any not yet present (marked `auto_created: true`).

---

## 4. Subject Detail Page — `/student/subjects/[subjectId]`

Three-column layout:

```
┌──────────────┬───────────────────────┬──────────────────┐
│ TASKS (30%)  │ AI GUIDE (40%)        │ HISTORY (30%)    │
│              │                       │                  │
│ + Add task   │ [NotebookLM-style     │ Exam results     │
│ □ Task 1     │  chat interface]      │ for this subject │
│ ✓ Task 2     │                       │                  │
│              │ Sources panel:        │ Study sessions   │
│ SESSIONS     │ student uploads +     │ logged           │
│ + Log session│ exam answer sheets    │                  │
│ Mon 45min    │ auto-imported         │ Total time       │
│ Tue 30min    │                       │ this week        │
└──────────────┴───────────────────────┴──────────────────┘
```

**Tasks column:**
- Add/complete/delete tasks specific to this subject
- Tasks link to `student_tasks` with a `subject_id` foreign key
- Completion % feeds the Study Process chart on the dashboard

**AI Guide column:**
- NotebookLM-style: sources panel + streaming chat
- Sources = student uploads filtered by subject + teacher answer sheets for this subject auto-imported
- Web search via Gemini grounding when sources insufficient
- Reuses existing `ai_guide_sessions` + `student_sources` infrastructure, filtered by subject

**History column:**
- All graded `answer_sheets` for this subject, sorted newest first
- Each exam shows: name, score, date, link to full result
- Study sessions logged: date, duration, notes
- Total time studied this week

---

## 5. Study Process Widget (dashboard)

Replaces static bar chart with real data:

```
Study Process          [Week ▾]
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│87%  │ │66%  │ │40%  │ │56%  │
│█████│ │█████│ │█████│ │█████│
└─────┘ └─────┘ └─────┘ └─────┘
Chemistry Physics  Maths  English
```

- Bars = task completion % per subject for the selected period
- Toggle: Week / Month
- Clicking a bar navigates to that subject's detail page

---

## 6. AI Guide — NotebookLM Integration

The existing AI Guide (`/student/ai-guide`) becomes a **global session list** across all subjects.

The subject detail page is the **primary entry point** for AI Guide usage:
- Creates/resumes `ai_guide_sessions` pre-filtered to this subject
- Sources pre-loaded = student uploads tagged with `subject_id` + auto-imported answer sheets
- Web search = Gemini grounding (when sources don't have the answer)
- Generated outputs (summaries, flashcards, practice questions) saved per session

---

## 7. Database Schema

### New table: `student_subjects`

```sql
create table student_subjects (
  id           uuid primary key default gen_random_uuid(),
  student_id   text not null references students(id) on delete cascade,
  name         text not null,
  color        text default '#9b8cff',
  auto_created boolean default false,
  created_at   timestamptz default now(),
  unique(student_id, name)
);
```

### New table: `study_sessions`

```sql
create table study_sessions (
  id               uuid primary key default gen_random_uuid(),
  student_id       text not null references students(id) on delete cascade,
  subject_id       uuid not null references student_subjects(id) on delete cascade,
  duration_minutes int not null,
  notes            text,
  created_at       timestamptz default now()
);
```

### Modified table: `student_tasks`

```sql
alter table student_tasks
  add column subject_id uuid references student_subjects(id) on delete set null;
```

### Modified table: `student_sources`

```sql
alter table student_sources
  add column subject_id uuid references student_subjects(id) on delete set null;
```

### Modified table: `ai_guide_sessions`

Already has `session_type` and `error_focus`. Add:
```sql
alter table ai_guide_sessions
  add column subject_id uuid references student_subjects(id) on delete set null;
```

---

## 8. New API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/student/subjects` | GET | List all subjects for student (auto-create from exams) |
| `/api/student/subjects` | POST | Manually create a subject |
| `/api/student/subjects/[id]` | GET | Subject detail: tasks, sessions, exam history, sources |
| `/api/student/subjects/[id]` | PATCH | Update subject (rename, color) |
| `/api/student/subjects/[id]` | DELETE | Delete subject |
| `/api/student/study-sessions` | POST | Log a study session |
| `/api/student/study-sessions` | GET | List sessions (filterable by subject, week/month) |

Existing routes modified:
- `/api/student/tasks/[taskId]` — tasks already exist, `subject_id` added
- `/api/ai-guide/sessions` POST — accept `subject_id`

---

## 9. Implementation Priority

### Phase 1 — Foundation
1. Create `student_subjects` table in Supabase
2. Create `study_sessions` table in Supabase
3. Add `subject_id` to `student_tasks`, `student_sources`, `ai_guide_sessions`
4. `/api/student/subjects` GET + POST (with auto-creation from exam data)

### Phase 2 — Dashboard
5. Subject cards component with progress ring
6. Replace static `CourseCarousel` with real `SubjectCarousel`
7. Update Study Process chart to use real task completion data
8. "+" Add Subject card + modal

### Phase 3 — Subject Detail Page
9. `/student/subjects/[subjectId]` page (3-column layout)
10. Tasks column (add/complete/delete, filtered by subject)
11. Study sessions column (log session, list this week)
12. History column (exam results + sessions for subject)
13. AI Guide column (reuse existing session-view, pre-filtered to subject)

---

## 10. Out of Scope

- Gamification (XP, streaks, level) — separate feature
- Today's Missions AI generation — separate feature
- Web search in AI Guide — separate feature (requires Gemini grounding config)
- Mobile responsive layout — follow-up pass
