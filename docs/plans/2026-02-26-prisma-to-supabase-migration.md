# Prisma → Supabase Client Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove Prisma entirely and replace every `prisma.*` call with the Supabase JS client, leaving a single unified data layer.

**Architecture:** API routes and server components currently use a mix of `prisma` (writes) and `supabase` (reads). After migration everything goes through `@supabase/supabase-js`. Server-side API routes use a service-role admin client (bypasses RLS). Server Components keep using the existing cookie-based `createClient()`. The `lib/prisma.ts` file and all Prisma packages are deleted at the end.

**Tech Stack:** `@supabase/supabase-js` (already installed), `@supabase/ssr` (already installed), Supabase Dashboard SQL Editor (for the schema migration), TypeScript.

> **Note:** No test infrastructure exists in this project. Verification steps are manual browser/terminal checks.

---

## Files that currently import Prisma

| File | Prisma operations used |
|---|---|
| `lib/prisma.ts` | singleton — DELETE this file at the end |
| `app/api/ai-guide/chat/route.ts` | `studentSource.findMany` |
| `app/api/ai-guide/rate/route.ts` | `aiGuideSession.update` |
| `app/api/ai-guide/generate/route.ts` | `studentSource.findMany`, `answerSheet.findUnique` (+ include feedback), `aiGuideSession.findUnique`, `aiGuideSession.update` |
| `app/api/uploads/student-sources/route.ts` | `studentSource.create` |
| `app/api/share-resources/route.ts` | `studentSource.create` × N, `$transaction` |
| `app/api/student/import-data/route.ts` | `answerSheet.findUnique` (+ include feedback), `studentSource.create` |
| `app/student/ai-guide/page.tsx` | `student.findUnique`, `studentSource.findMany` |

> **Future files** in the V2 implementation plan also use Prisma — they are already written with Prisma syntax. Those files will be updated there as part of executing this migration plan first.

---

## Prisma → Supabase Quick Reference

Use this table when converting calls. The Supabase client used in all API routes is the **admin client** (see Task 2).

```typescript
// ── FIND ONE ──────────────────────────────────────────────────
// Prisma:
const row = await prisma.student.findUnique({ where: { user_id: id } })
// Supabase:
const { data: row } = await supabase.from('students').select('*').eq('user_id', id).maybeSingle()

// ── FIND MANY ─────────────────────────────────────────────────
// Prisma:
const rows = await prisma.studentSource.findMany({ where: { id: { in: ids }, student_id: sid } })
// Supabase:
const { data: rows } = await supabase.from('student_sources').select('*').in('id', ids).eq('student_id', sid)

// ── FIND MANY ORDERED ─────────────────────────────────────────
// Prisma:
const rows = await prisma.studentSource.findMany({ where: { student_id: sid }, orderBy: { created_at: 'desc' } })
// Supabase:
const { data: rows } = await supabase.from('student_sources').select('*').eq('student_id', sid).order('created_at', { ascending: false })

// ── CREATE ────────────────────────────────────────────────────
// Prisma:
const row = await prisma.studentSource.create({ data: { ... } })
// Supabase:
const { data: row } = await supabase.from('student_sources').insert({ ... }).select().single()

// ── UPDATE ────────────────────────────────────────────────────
// Prisma:
await prisma.aiGuideSession.update({ where: { id }, data: { rating } })
// Supabase:
await supabase.from('ai_guide_sessions').update({ rating }).eq('id', id)

// ── BULK INSERT (replaces $transaction of creates) ────────────
// Prisma:
await prisma.$transaction(ids.map(sid => prisma.studentSource.create({ data: { student_id: sid, ... } })))
// Supabase:
await supabase.from('student_sources').insert(ids.map(sid => ({ student_id: sid, ... })))

// ── JOIN (include) ────────────────────────────────────────────
// Prisma:
const sheet = await prisma.answerSheet.findUnique({ where: { id }, include: { exam: true, feedback: true } })
// Supabase (uses PostgREST foreign key syntax):
const { data: sheet } = await supabase
  .from('answer_sheets')
  .select('*, exams(*), feedback_analysis(*)')
  .eq('id', id)
  .maybeSingle()
// Access: sheet.exams  (object, not array, for belongs-to)
//         sheet.feedback_analysis  (array, for has-many)
```

---

## Phase 1 — Schema: Create New Tables in Supabase

---

### Task 1: Run SQL Migration in Supabase Dashboard

**Files:** None (SQL run directly in Supabase Dashboard)

**Context:** The updated `prisma/schema.prisma` defines 4 new tables and 6 new columns on `ai_guide_sessions`. Since we are dropping Prisma migrate, these must be created directly in Supabase via the SQL Editor. Run once, then never touch again.

**Step 1: Open Supabase SQL Editor**

Go to your Supabase project → SQL Editor → New query.

**Step 2: Run the ALTER for `ai_guide_sessions`**

The table already exists but is missing the new columns. Run this:

```sql
-- Add new columns to ai_guide_sessions
ALTER TABLE ai_guide_sessions
  ADD COLUMN IF NOT EXISTS title               TEXT    NOT NULL DEFAULT 'Untitled Session',
  ADD COLUMN IF NOT EXISTS session_type        TEXT    NOT NULL DEFAULT 'free_study',
  ADD COLUMN IF NOT EXISTS exam_context_id     UUID,
  ADD COLUMN IF NOT EXISTS error_focus         TEXT,
  ADD COLUMN IF NOT EXISTS generated_outputs   JSONB,
  ADD COLUMN IF NOT EXISTS mastery_checkpoints JSONB,
  ADD COLUMN IF NOT EXISTS last_active_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();
```

Click Run. Expected: `Success. No rows returned.`

**Step 3: Create the 4 new tables**

Run this in a new query:

```sql
-- flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  front             TEXT        NOT NULL,
  back              TEXT        NOT NULL,
  subject           TEXT,
  source_exam_id    UUID,
  source_session_id UUID,
  error_type        TEXT,
  level             INT         NOT NULL DEFAULT 0,
  next_review_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- xp_logs
CREATE TABLE IF NOT EXISTS xp_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount     INT         NOT NULL,
  reason     TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- self_assessments
CREATE TABLE IF NOT EXISTS self_assessments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id          UUID        NOT NULL,
  topics           JSONB       NOT NULL,
  actual_result    JSONB,
  prediction_delta FLOAT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- topic_recovery
CREATE TABLE IF NOT EXISTS topic_recovery (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject               TEXT        NOT NULL,
  topic                 TEXT        NOT NULL,
  error_count           INT         NOT NULL DEFAULT 0,
  session_count         INT         NOT NULL DEFAULT 0,
  flashcard_completions INT         NOT NULL DEFAULT 0,
  recovery_score        FLOAT       NOT NULL DEFAULT 0,
  last_updated          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Click Run. Expected: `Success. No rows returned.`

**Step 4: Verify tables exist**

In Supabase → Table Editor, confirm these tables appear in the left panel:
- `ai_guide_sessions` (with the new columns visible)
- `flashcards`
- `xp_logs`
- `self_assessments`
- `topic_recovery`

**Step 5: Commit the SQL as a record**

Save the SQL as a file so future developers know what was run:

```bash
mkdir -p /c/Users/acer/Documents/projects/MARK_AI/supabase/migrations
```

Create `supabase/migrations/20260226_v2_schema.sql` with the SQL from Steps 2 and 3 combined, then:

```bash
cd /c/Users/acer/Documents/projects/MARK_AI
git add supabase/migrations/
git commit -m "chore: add Supabase SQL migration record for V2 schema (ai_guide_sessions columns + 4 new tables)"
```

---

## Phase 2 — Add Supabase Admin Client

---

### Task 2: Create Server-Side Admin Client

**Files:**
- Create: `lib/supabase/admin.ts`
- Modify: `.env.local` (add `SUPABASE_SERVICE_ROLE_KEY`)

**Context:** API routes need to read and write data without a user auth cookie (they receive `studentId` in the request body instead). The existing `createClient()` is for cookie-based user sessions. A service-role client bypasses Row Level Security (RLS) entirely — safe for server-only use, never expose to the browser.

**Step 1: Get the service role key**

Supabase Dashboard → Project Settings → API → `service_role` key (the long secret one). Add to `.env.local`:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Step 2: Create `lib/supabase/admin.ts`**

```typescript
import { createClient } from "@supabase/supabase-js"

/**
 * Server-only admin client — uses service role key, bypasses RLS.
 * Use ONLY in API routes (app/api/**) and Server Actions.
 * Never import this in client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

**Step 3: Verify it imports without error**

```bash
cd /c/Users/acer/Documents/projects/MARK_AI
npx tsc --noEmit
```

Expected: no errors related to the new file.

**Step 4: Commit**

```bash
git add lib/supabase/admin.ts .env.local
git commit -m "feat: add Supabase admin client for server-side API routes"
```

---

## Phase 3 — Replace Prisma File by File

> Work through each file in order. After each file: verify in the browser, then commit. Do NOT batch multiple files into one commit.

---

### Task 3: `app/api/ai-guide/chat/route.ts`

**Files:**
- Modify: `app/api/ai-guide/chat/route.ts`

**Current Prisma usage:** `prisma.studentSource.findMany` (fetches OCR text for AI context)

**Step 1: Replace the file**

```typescript
import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { createAdminClient } from "@/lib/supabase/admin"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, sourceIds, studentId, examContextId } = await req.json()
    const supabase = createAdminClient()

    // 1. Fetch source materials
    let context = ""
    if (sourceIds && sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from("student_sources")
        .select("title, ocr_text")
        .in("id", sourceIds)
        .eq("student_id", studentId)

      if (sources) {
        context = sources
          .map((s) => `Source: ${s.title}\nContent: ${s.ocr_text || "(No text)"}`)
          .join("\n\n")
      }
    }

    // 2. Fetch exam context if provided
    let examContext = ""
    if (examContextId) {
      const { data: sheet } = await supabase
        .from("answer_sheets")
        .select("total_score, exams(*), feedback_analysis(*)")
        .eq("id", examContextId)
        .maybeSingle()

      if (sheet) {
        const exam = sheet.exams as any
        const fb = (sheet.feedback_analysis as any[])?.[0]
        const rca = fb?.root_cause_analysis || {}
        examContext = `\n\nExam context: ${fb?.exam_name || exam?.exam_name} — Score: ${sheet.total_score}/${fb?.exam_total_marks || exam?.total_marks}. Errors: concept=${rca.concept || 0}, calculation=${rca.calculation || 0}, keyword=${rca.keyword || 0}`
      }
    }

    const systemPrompt = `You are an AI Study Guide tutor for Indian school students. Help the student based on their materials and exam performance.\n\n${context}${examContext}\n\nBe specific, encouraging, and reference the actual content when answering.`

    const result = streamText({
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      messages,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Chat Error:", error)
    return new Response("Chat Failed", { status: 500 })
  }
}
```

**Step 2: Verify**

In the running app, open any AI Guide session and send a chat message. It should stream a response. Check the terminal — no `prisma` import errors.

**Step 3: Commit**

```bash
git add app/api/ai-guide/chat/route.ts
git commit -m "refactor: replace Prisma with Supabase in ai-guide/chat route"
```

---

### Task 4: `app/api/ai-guide/rate/route.ts`

**Files:**
- Modify: `app/api/ai-guide/rate/route.ts`

**Current Prisma usage:** `prisma.aiGuideSession.update`

**Step 1: Replace the file**

```typescript
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(req: Request) {
  try {
    const { sessionId, rating } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    await supabase
      .from("ai_guide_sessions")
      .update({ rating })
      .eq("id", sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Rating Failed" }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add app/api/ai-guide/rate/route.ts
git commit -m "refactor: replace Prisma with Supabase in ai-guide/rate route"
```

---

### Task 5: `app/api/ai-guide/generate/route.ts`

**Files:**
- Modify: `app/api/ai-guide/generate/route.ts`

**Current Prisma usage:** `studentSource.findMany`, `answerSheet.findUnique` (with `include: { exam, feedback }`), `aiGuideSession.findUnique`, `aiGuideSession.update`

**Step 1: Replace only the data-fetching/writing section**

The prompt-building logic (`buildPrompt`) stays exactly the same. Only replace the Prisma client calls. Full file replacement:

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

type GenType =
  | "summary" | "quiz" | "faq" | "study_plan"
  | "concept_explainer" | "drill_practice" | "keyword_builder" | "exam_debrief"

function buildPrompt(type: GenType, sourceContext: string, examContext: string): string {
  const base = `You are an expert tutor for Indian school students (CBSE/ICSE/State Board). Be specific, clear, and encouraging.\n\n`

  switch (type) {
    case "summary":
      return `${base}Summarize these study materials. Focus on key concepts and important points.\n\n${sourceContext}`
    case "quiz":
      return `${base}Generate a 5-question multiple choice quiz. Return as JSON array:
[{ "question": "...", "options": ["A","B","C","D"], "answer": "A", "explanation": "..." }]\n\nMaterials:\n${sourceContext}`
    case "faq":
      return `${base}Generate 5 common exam questions with detailed model answers.\n\nMaterials:\n${sourceContext}`
    case "study_plan":
      return `${base}Create a structured 3-day study plan with daily topics, activities, and revision checkpoints.\n\nMaterials:\n${sourceContext}`
    case "concept_explainer":
      return `${base}The student made CONCEPT ERRORS — they don't fully understand the underlying ideas.
- Explain core concepts clearly using analogies and real-world examples
- Break down each complex idea step by step
- End with 3 "check your understanding" questions
${examContext ? `\nExam context:\n${examContext}\n` : ""}
Materials:\n${sourceContext}`
    case "drill_practice":
      return `${base}The student made CALCULATION/PROCEDURAL ERRORS.
Generate 8 practice problems with full step-by-step worked solutions.
- Each problem isolates one procedural step
- Show every step explicitly
- Mark the step most students get wrong
${examContext ? `\nExam context:\n${examContext}\n` : ""}
Materials:\n${sourceContext}`
    case "keyword_builder":
      return `${base}The student made KEYWORD/EXPRESSION ERRORS.
1. List 10 key terms with clear definitions
2. Show 3 examples: weak student answer → strong model answer
3. Provide a "power phrases" list for this topic
${examContext ? `\nExam context:\n${examContext}\n` : ""}
Materials:\n${sourceContext}`
    case "exam_debrief":
      return `${base}Review this student's graded exam and write a structured debrief.

EXAM PERFORMANCE:
${examContext}

STUDY MATERIALS (if any):
${sourceContext || "(None provided)"}

Write:
1. **What you did well** — specific, cite actual correct areas
2. **Where you lost marks** — each gap with error type (concept / calculation / keyword)
3. **The fix for each gap** — concrete and actionable
4. **Your study priority** — rank gaps from most to least impactful
5. **One encouraging note** — genuine, not generic`
    default:
      return `${base}Provide helpful study insights.\n\n${sourceContext}`
  }
}

export async function POST(req: Request) {
  try {
    const { type, sourceIds, studentId, sessionId, examContextId } = await req.json()
    const supabase = createAdminClient()

    // 1. Fetch source materials
    let sourceContext = ""
    if (sourceIds && sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from("student_sources")
        .select("title, ocr_text")
        .in("id", sourceIds)
        .eq("student_id", studentId)

      if (sources) {
        sourceContext = sources
          .map((s) => `[${s.title}]\n${s.ocr_text || "(No text extracted)"}`)
          .join("\n\n---\n\n")
      }
    }

    // 2. Fetch exam context
    let examContext = ""
    if (examContextId) {
      const { data: sheet } = await supabase
        .from("answer_sheets")
        .select("total_score, exams(*), feedback_analysis(*)")
        .eq("id", examContextId)
        .maybeSingle()

      if (sheet) {
        const exam = sheet.exams as any
        const fb = (sheet.feedback_analysis as any[])?.[0]
        const rca = (fb?.root_cause_analysis as Record<string, number>) || {}
        const examName = fb?.exam_name || exam?.exam_name || "Exam"
        const subject = fb?.exam_subject || exam?.subject || "General"
        const totalMarks = fb?.exam_total_marks || exam?.total_marks || 100
        examContext = `Exam: ${examName} (${subject})
Score: ${sheet.total_score}/${totalMarks} (${Math.round(((sheet.total_score || 0) / totalMarks) * 100)}%)
Error breakdown:
  Concept errors: ${rca.concept || 0}
  Calculation errors: ${rca.calculation || 0}
  Keyword/expression errors: ${rca.keyword || 0}`
      }
    }

    if (!sourceContext && !examContext) {
      return NextResponse.json({ error: "No content found to generate from" }, { status: 400 })
    }

    // 3. Generate
    const prompt = buildPrompt(type as GenType, sourceContext, examContext)
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // 4. Persist output to session if sessionId provided
    if (sessionId) {
      const { data: session } = await supabase
        .from("ai_guide_sessions")
        .select("generated_outputs")
        .eq("id", sessionId)
        .single()

      const existing = (session?.generated_outputs as any[]) || []
      await supabase
        .from("ai_guide_sessions")
        .update({
          generated_outputs: [
            ...existing,
            { type, content: text, saved: false, created_at: new Date().toISOString() },
          ],
          last_active_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
    }

    return NextResponse.json({ result: text })
  } catch (error) {
    console.error("AI Gen Error:", error)
    return NextResponse.json({ error: "AI Generation Failed" }, { status: 500 })
  }
}
```

**Step 2: Verify**

In browser console on any page:

```javascript
fetch('/api/ai-guide/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'summary', sourceIds: [], studentId: 'any', examContextId: null })
}).then(r => r.json()).then(console.log)
// Expected: { error: "No content found to generate from" } — proves route works without crashing
```

**Step 3: Commit**

```bash
git add app/api/ai-guide/generate/route.ts
git commit -m "refactor: replace Prisma with Supabase in ai-guide/generate route"
```

---

### Task 6: `app/api/uploads/student-sources/route.ts`

**Files:**
- Modify: `app/api/uploads/student-sources/route.ts`

**Current Prisma usage:** `prisma.studentSource.create`

**Step 1: Replace only the DB write (keep OCR logic)**

```typescript
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { extractTextFromFile } from "@/lib/sarvam-ocr"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const studentId = formData.get("student_id") as string

    if (!file || !studentId) {
      return NextResponse.json({ error: "Missing file or student_id" }, { status: 400 })
    }

    // 1. Upload to Supabase Storage (use anon key client for storage — bucket policies handle auth)
    const storageClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const fileExt = file.name.split(".").pop()
    const fileName = `${studentId}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await storageClient.storage
      .from("student_sources")
      .upload(fileName, file)

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/student_sources/${fileName}`

    // 2. Extract text via Sarvam AI / pdf-parse
    const { text: ocrText, method } = await extractTextFromFile(file)
    console.log(`[upload] ${file.name} → method: ${method}, chars: ${ocrText.length}`)

    // 3. Save to DB
    const supabase = createAdminClient()
    const { data: source, error: dbError } = await supabase
      .from("student_sources")
      .insert({
        student_id: studentId,
        file_url: fileUrl,
        type: "upload",
        title: file.name,
        ocr_text: ocrText,
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ data: source })
  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add app/api/uploads/student-sources/route.ts
git commit -m "refactor: replace Prisma with Supabase in student-sources upload route"
```

---

### Task 7: `app/api/share-resources/route.ts`

**Files:**
- Modify: `app/api/share-resources/route.ts`

**Current Prisma usage:** `prisma.studentSource.create` × N inside `prisma.$transaction`

**Step 1: Replace the file**

Supabase supports bulk insert natively — pass an array to `.insert()`.

```typescript
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { studentIds, title, content, fileUrl } = await req.json()

    if (!studentIds?.length) {
      return NextResponse.json({ error: "No students specified" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Bulk insert — one row per student
    const rows = studentIds.map((studentId: string) => ({
      student_id: studentId,
      type: "shared",
      title: title || "Shared Resource",
      ocr_text: content || "",
      file_url: fileUrl || "",
    }))

    const { error } = await supabase.from("student_sources").insert(rows)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: studentIds.length })
  } catch (error) {
    console.error("Share Error:", error)
    return NextResponse.json({ error: "Share Failed" }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add app/api/share-resources/route.ts
git commit -m "refactor: replace Prisma with Supabase in share-resources route (bulk insert replaces \$transaction)"
```

---

### Task 8: `app/api/student/import-data/route.ts`

**Files:**
- Modify: `app/api/student/import-data/route.ts`

**Current Prisma usage:** `prisma.answerSheet.findUnique` (with `include: { feedback: true }`), `prisma.studentSource.create`

**Step 1: Replace the file**

```typescript
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const { type, id, studentId, title } = await req.json()
    const supabase = createAdminClient()

    let content = ""

    if (type === "exam") {
      const { data: sheet } = await supabase
        .from("answer_sheets")
        .select("total_score, feedback_analysis(*)")
        .eq("id", id)
        .maybeSingle()

      if (!sheet) {
        return NextResponse.json({ error: "Data not found" }, { status: 404 })
      }

      content = JSON.stringify(
        { score: sheet.total_score, feedback: sheet.feedback_analysis },
        null,
        2
      )
    }

    if (!content) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 })
    }

    const { error } = await supabase.from("student_sources").insert({
      student_id: studentId,
      type: "imported_exam",
      title: title,
      ocr_text: content,
      file_url: "",
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Import Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add app/api/student/import-data/route.ts
git commit -m "refactor: replace Prisma with Supabase in student/import-data route"
```

---

### Task 9: `app/student/ai-guide/page.tsx`

**Files:**
- Modify: `app/student/ai-guide/page.tsx`

**Current Prisma usage:** `prisma.student.findUnique`, `prisma.studentSource.findMany`

**Context:** This is a Server Component. It uses the cookie-based `createClient()` (not the admin client) because it runs in the context of the logged-in user. The existing `createClient()` from `lib/supabase/server.ts` is already used in this file for auth — extend it for data fetching too.

**Step 1: Replace the file**

```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AiGuideView } from "@/components/ai-guide/ai-guide-view"
import { Separator } from "@/components/ui/separator"
import { Brain } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AiGuidePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/sign-in")

  const { data: student } = await supabase
    .from("students")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!student) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Profile not found</h1>
        <p>Please contact your administrator to link your account.</p>
      </div>
    )
  }

  const { data: sources } = await supabase
    .from("student_sources")
    .select("*")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <Brain className="text-indigo-500 h-10 w-10" />
            AI Study Guide
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Synthesize your notes into personalised study aids.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
          Beta
        </span>
      </div>
      <Separator className="bg-border/50" />
      <AiGuideView initialSources={sources || []} studentId={student.id} />
    </div>
  )
}
```

**Step 2: Verify**

Go to `/student/ai-guide` in the browser. Page should load with the existing source list. Check the terminal — no Prisma-related errors.

**Step 3: Commit**

```bash
git add app/student/ai-guide/page.tsx
git commit -m "refactor: replace Prisma with Supabase in ai-guide page (Server Component)"
```

---

## Phase 4 — Remove Prisma

---

### Task 10: Update V2 Plan Files to Use Supabase

**Files:**
- Modify: `docs/plans/2026-02-26-ai-guide-v2-implementation.md`

**Context:** The V2 implementation plan (Tasks 4–15) contains Prisma calls in its code snippets. These must be updated to use Supabase before executing that plan, otherwise the executor will introduce Prisma again.

**Step 1: Search for all Prisma references in the V2 plan**

```bash
grep -n "prisma\." /c/Users/acer/Documents/projects/MARK_AI/docs/plans/2026-02-26-ai-guide-v2-implementation.md | head -40
```

**Step 2: Update each occurrence**

Open the V2 plan and apply these replacements (use Edit tool for each):

**Sessions API (Task 4 in V2 plan)** — replace `prisma.aiGuideSession.*` and `prisma.answerSheet.*` calls with Supabase equivalents using `createAdminClient()`.

**Daily Brief API (Task 6 in V2 plan)** — replace `prisma.student.findUnique`, `prisma.answerSheet.findMany`, `prisma.exam.findFirst` with Supabase queries.

**Self-Assessment API (Task 7 in V2 plan)** — replace `prisma.selfAssessment.*` calls.

**AI Guide Session Page (Task 13 in V2 plan)** — Server Component, uses `createClient()`:
- Replace `prisma.student.findUnique` → `supabase.from('students').select(...).eq('user_id', user.id).maybeSingle()`
- Replace `prisma.aiGuideSession.findUnique` → `supabase.from('ai_guide_sessions').select('*').eq('id', sessionId).single()`
- Replace `prisma.studentSource.findMany` → `supabase.from('student_sources').select(...).eq('student_id', ...).order(...)`
- Replace `prisma.answerSheet.findUnique` with include → `supabase.from('answer_sheets').select('*, exams(*), feedback_analysis(*)').eq('id', ...).maybeSingle()`

**Dashboard Page (Task 14 in V2 plan)** — Server Component, uses `createClient()`:
- Replace `prisma.aiGuideSession.findMany` → `supabase.from('ai_guide_sessions').select(...).eq('student_id', ...).order('last_active_at', { ascending: false }).limit(5)`

> **Tip:** In every case where the V2 plan adds `import { prisma } from "@/lib/prisma"`, replace with `import { createAdminClient } from "@/lib/supabase/admin"` (for API routes) or use the existing `supabase` client from `createClient()` (for Server Components).

**Step 3: Commit the updated plan**

```bash
git add docs/plans/2026-02-26-ai-guide-v2-implementation.md
git commit -m "docs: update V2 implementation plan — replace Prisma calls with Supabase equivalents"
```

---

### Task 11: Delete Prisma and Uninstall Packages

**Files:**
- Delete: `lib/prisma.ts`
- Delete: `prisma/schema.prisma`
- Delete: `prisma/` directory (after archiving the migration SQL)
- Modify: `package.json`

**Context:** The schema.prisma is no longer needed — Supabase manages the schema. The migration SQL has already been saved to `supabase/migrations/` in Task 1. The `lib/prisma.ts` singleton is replaced by `lib/supabase/admin.ts`.

**Step 1: Confirm no remaining Prisma imports**

```bash
grep -r "from \"@/lib/prisma\"" /c/Users/acer/Documents/projects/MARK_AI/app/
grep -r "from \"@/lib/prisma\"" /c/Users/acer/Documents/projects/MARK_AI/lib/
```

Expected: no output. If any files are listed, fix them before continuing.

**Step 2: Delete Prisma files**

```bash
rm /c/Users/acer/Documents/projects/MARK_AI/lib/prisma.ts
rm -rf /c/Users/acer/Documents/projects/MARK_AI/prisma/
```

**Step 3: Uninstall Prisma packages**

```bash
cd /c/Users/acer/Documents/projects/MARK_AI
npm uninstall prisma @prisma/client
```

**Step 4: Verify build still works**

```bash
npm run build
```

Expected: build succeeds with no `@/lib/prisma` import errors. If there are errors, the grep in Step 1 missed something — fix those files then re-run.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Prisma — delete lib/prisma.ts, prisma/ dir, uninstall prisma packages"
```

---

### Task 12: Final Verification

**Step 1: Run the dev server**

```bash
npm run dev
```

**Step 2: Walk through every affected page/feature**

- [ ] `/student/dashboard` loads without errors
- [ ] `/student/ai-guide` shows the source list (Server Component reads from Supabase)
- [ ] Upload a file in AI Guide — check server log shows `[upload] method: ...` and no Prisma errors
- [ ] Send a chat message in AI Guide — streams a response
- [ ] Generate a summary — returns AI content
- [ ] Rate a session via PATCH `/api/ai-guide/rate` — returns `{ success: true }`
- [ ] No `Cannot find module '@/lib/prisma'` errors anywhere in the terminal

**Step 3: Final commit**

```bash
git add -A
git commit -m "refactor: complete Prisma → Supabase migration — single unified data client"
```

---

## Summary

| Task | File | Change |
|---|---|---|
| 1 | Supabase SQL Editor | Create 4 new tables + alter ai_guide_sessions |
| 2 | `lib/supabase/admin.ts` | New service-role admin client for API routes |
| 3 | `app/api/ai-guide/chat/route.ts` | Prisma → Supabase |
| 4 | `app/api/ai-guide/rate/route.ts` | Prisma → Supabase |
| 5 | `app/api/ai-guide/generate/route.ts` | Prisma → Supabase |
| 6 | `app/api/uploads/student-sources/route.ts` | Prisma → Supabase |
| 7 | `app/api/share-resources/route.ts` | Prisma → Supabase (bulk insert) |
| 8 | `app/api/student/import-data/route.ts` | Prisma → Supabase |
| 9 | `app/student/ai-guide/page.tsx` | Prisma → Supabase (Server Component) |
| 10 | `docs/plans/2026-02-26-ai-guide-v2-implementation.md` | Update V2 plan code snippets |
| 11 | `lib/prisma.ts`, `prisma/`, `package.json` | Delete Prisma entirely |
| 12 | — | Final verification walkthrough |

## New environment variable needed

```
SUPABASE_SERVICE_ROLE_KEY=   # From Supabase Dashboard → Project Settings → API
```

All other env vars already exist.
