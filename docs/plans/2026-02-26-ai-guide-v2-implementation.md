# AI Guide V2 + Student Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the grading→learning pipeline — the one thing no competitor has — by building persistent AI Guide sessions, real Indian-language OCR, error-type generation modes, and an intelligence-driven student dashboard.

**Architecture:** Extend the existing Next.js 14 App Router + Supabase + Prisma stack. All new features are additive — no existing routes are deleted. The core pattern is: `AnswerSheet.root_cause_analysis` drives everything the AI Guide says and does.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL + Storage), Prisma 7, Gemini 1.5 Flash (`@google/generative-ai`), Vercel AI SDK (`ai` + `@ai-sdk/google`) for streaming, Sarvam AI OCR API (new), Tailwind CSS, Radix UI, Recharts, Lucide React.

**Build order:** Database → Services → API Routes → Frontend Components → Frontend Pages → Integration check.
Frontend work does not begin until all API routes are complete and manually verified.

> **Note:** This project has no test infrastructure. All "verify" steps are manual browser/console checks.

---

## Phase 1 — Database

> One task. Get the schema right before anything else. Everything downstream depends on it.

---

### Task 1: Expand Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Context:** The schema is missing `Flashcard`, `XpLog`, `SelfAssessment`, `TopicRecovery` tables that the code already references. `AiGuideSession` also needs new fields for persistence (title, session_type, exam_context_id, error_focus, last_active_at).

**Step 1: Replace the AiGuideSession model**

Open `prisma/schema.prisma`. Replace the entire `AiGuideSession` model:

```prisma
model AiGuideSession {
  id                  String   @id @default(uuid())
  student_id          String
  title               String   @default("Untitled Session")
  session_type        String   @default("free_study")
  // session_type values: 'exam_prep' | 'concept_study' | 'note_synthesis' | 'free_study'
  exam_context_id     String?  // FK to answer_sheets.id
  error_focus         String?  // 'concept' | 'calculation' | 'keyword'
  sources_json        Json?
  chat_history        Json?
  generated_outputs   Json?    // [{ type, content, saved, created_at }]
  mastery_checkpoints Json?    // [{ topic, confidence, demonstrated_at }]
  rating              Int?
  last_active_at      DateTime @default(now())
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  student Student @relation(fields: [student_id], references: [id])

  @@map("ai_guide_sessions")
}
```

**Step 2: Add four missing models**

Paste these after the `AiGuideSession` model:

```prisma
// Flashcard — referenced in code but missing from schema
model Flashcard {
  id                String    @id @default(uuid())
  student_id        String
  front             String
  back              String
  subject           String?
  source_exam_id    String?   // answer_sheets.id that generated this card
  source_session_id String?   // ai_guide_sessions.id that generated this card
  error_type        String?   // 'concept' | 'calculation' | 'keyword'
  level             Int       @default(0) // 0-5, 5 = mastered
  next_review_at    DateTime?
  created_at        DateTime  @default(now())

  student Student @relation(fields: [student_id], references: [id])

  @@map("flashcards")
}

// XpLog — referenced in analytics code but missing from schema
model XpLog {
  id         String   @id @default(uuid())
  student_id String
  amount     Int
  reason     String   // 'exam_graded' | 'flashcard_mastered' | 'session_completed' | 'streak' | 'mission_complete'
  created_at DateTime @default(now())

  student Student @relation(fields: [student_id], references: [id])

  @@map("xp_logs")
}

// SelfAssessment — pre-exam confidence ratings
model SelfAssessment {
  id               String   @id @default(uuid())
  student_id       String
  exam_id          String
  topics           Json     // [{ name: string, confidence: 1-5 }]
  actual_result    Json?    // filled post-grading: [{ name, actual_pct }]
  prediction_delta Float?   // abs(predicted_avg - actual_avg)
  created_at       DateTime @default(now())

  student Student @relation(fields: [student_id], references: [id])

  @@map("self_assessments")
}

// TopicRecovery — tracks recovery progress per topic across exams
model TopicRecovery {
  id                    String   @id @default(uuid())
  student_id            String
  subject               String
  topic                 String
  error_count           Int      @default(0)
  session_count         Int      @default(0)
  flashcard_completions Int      @default(0)
  recovery_score        Float    @default(0) // 0-100, computed
  last_updated          DateTime @updatedAt

  student Student @relation(fields: [student_id], references: [id])

  @@map("topic_recovery")
}
```

**Step 3: Add reverse relations to the Student model**

Find the `Student` model. After `answerSheets AnswerSheet[]`, add:

```prisma
  flashcards      Flashcard[]
  xpLogs          XpLog[]
  selfAssessments SelfAssessment[]
  topicRecoveries TopicRecovery[]
```

**Step 4: Run the migration**

```bash
cd /c/Users/acer/Documents/projects/MARK_AI
npx prisma migrate dev --name "add_session_fields_and_missing_tables"
```

Expected output: `Your database is now in sync with your schema.`

If it fails with "column already exists", run `npx prisma migrate dev --name "..." --create-only`, edit the generated SQL to remove the conflicting `ALTER TABLE` statement, then run `npx prisma migrate deploy`.

**Step 5: Verify**

```bash
npx prisma studio
```

Open http://localhost:5555. Confirm these tables exist: `flashcards`, `xp_logs`, `self_assessments`, `topic_recovery`. Confirm `ai_guide_sessions` has columns: `title`, `session_type`, `exam_context_id`, `last_active_at`.

**Step 6: Commit**

```bash
git add prisma/
git commit -m "feat: expand schema — add Flashcard, XpLog, SelfAssessment, TopicRecovery; expand AiGuideSession"
```

---

## Phase 2 — Services & Utilities

> Pure TypeScript logic. No HTTP routes, no UI. Just the reusable OCR service.

---

### Task 2: Sarvam AI OCR Service

**Files:**
- Create: `lib/sarvam-ocr.ts`
- Modify: `.env.local`

**Context:** Sarvam AI is an Indian-language-specialized OCR provider. Their API handles handwritten Devanagari, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Marathi, Punjabi, Odia — far better than general-purpose vision models. This service routes files to the right extractor: Sarvam for images/handwriting, `pdf-parse` (already in package.json) for English PDFs, direct read for plain text.

**Step 1: Add the API key to `.env.local`**

Sign up at https://www.sarvam.ai, get an API key, then:

```bash
echo 'SARVAM_API_KEY=your_key_here' >> .env.local
```

**Step 2: Create `lib/sarvam-ocr.ts`**

```typescript
/**
 * Sarvam AI OCR Service
 *
 * Routes files to the correct text extractor:
 *   Images (JPG/PNG/WEBP)  → Sarvam AI  (Indian scripts + handwriting)
 *   PDFs with text layer   → pdf-parse  (fast, free)
 *   Scanned PDFs           → Sarvam AI  (fallback when pdf-parse yields < 20 chars)
 *   TXT / MD               → file.text() (direct)
 *
 * Sarvam API ref: https://docs.sarvam.ai/api-reference/ocr
 */

import pdf from "pdf-parse"

export type OcrResult = {
  text: string
  method: "sarvam" | "pdf-parse" | "direct" | "none"
}

function isImage(file: File): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)
}

async function extractFromPdf(buffer: ArrayBuffer): Promise<string> {
  try {
    const data = await pdf(Buffer.from(buffer))
    return data.text || ""
  } catch {
    return ""
  }
}

async function extractWithSarvam(file: File): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) {
    console.warn("[sarvam-ocr] SARVAM_API_KEY not set — skipping Sarvam OCR")
    return ""
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")

    const response = await fetch("https://api.sarvam.ai/v1/ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        image: base64,
        language_code: "auto", // auto-detects script/language
      }),
    })

    if (!response.ok) {
      console.error("[sarvam-ocr] API error:", response.status, await response.text())
      return ""
    }

    const data = await response.json()
    // Sarvam response: { text: string, language: string }
    return data.text || ""
  } catch (err) {
    console.error("[sarvam-ocr] exception:", err)
    return ""
  }
}

/**
 * Main entry point. Call this with any uploaded File object.
 * Returns { text, method } — text is empty string if extraction failed.
 */
export async function extractTextFromFile(file: File): Promise<OcrResult> {
  const name = file.name.toLowerCase()

  // Plain text — read directly, no OCR needed
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    const text = await file.text()
    return { text, method: "direct" }
  }

  // PDF — try pdf-parse first (fast, no API cost)
  if (name.endsWith(".pdf")) {
    const buffer = await file.arrayBuffer()
    const text = await extractFromPdf(buffer)
    if (text.trim().length > 20) {
      return { text, method: "pdf-parse" }
    }
    // Scanned PDF (text layer empty) → fall through to Sarvam
    const sarvamText = await extractWithSarvam(file)
    return { text: sarvamText, method: "sarvam" }
  }

  // Images → Sarvam (handles all Indian scripts + handwriting)
  if (isImage(file)) {
    const text = await extractWithSarvam(file)
    return { text, method: "sarvam" }
  }

  // Unknown file type
  return { text: "", method: "none" }
}
```

**Step 3: Check types compile**

```bash
npx tsc --noEmit
```

If `pdf-parse` types are missing: `npm install --save-dev @types/pdf-parse`

**Step 4: Commit**

```bash
git add lib/sarvam-ocr.ts
git commit -m "feat: Sarvam AI OCR service — routes Indian-script/handwriting to Sarvam, English PDFs to pdf-parse"
```

---

### Task 3: Wire OCR into the Upload Pipeline

**Files:**
- Modify: `app/api/uploads/student-sources/route.ts`

**Context:** Currently `ocrText` is always `""`. This task calls `extractTextFromFile()` after the file is stored in Supabase so that `StudentSource.ocr_text` is actually populated. This is what makes uploaded notes usable in the AI Guide.

**Step 1: Replace `app/api/uploads/student-sources/route.ts`**

```typescript
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { extractTextFromFile } from "@/lib/sarvam-ocr"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const studentId = formData.get("student_id") as string

    if (!file || !studentId) {
      return NextResponse.json(
        { error: "Missing file or student_id" },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split(".").pop()
    const fileName = `${studentId}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from("student_sources")
      .upload(fileName, file)

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/student_sources/${fileName}`

    // 2. Extract text (Sarvam AI / pdf-parse / direct)
    const { text: ocrText, method } = await extractTextFromFile(file)
    console.log(`[upload] ${file.name} → OCR method: ${method}, chars extracted: ${ocrText.length}`)

    // 3. Save to DB with extracted text
    const source = await prisma.studentSource.create({
      data: {
        student_id: studentId,
        file_url: fileUrl,
        type: "upload",
        title: file.name,
        ocr_text: ocrText,
      },
    })

    return NextResponse.json({ data: source })
  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
```

**Step 2: Verify**

1. Run `npm run dev`
2. Upload any file via the existing AI Guide upload UI
3. Check the server terminal — should see `[upload] filename.pdf → OCR method: pdf-parse, chars extracted: 1234`
4. In Supabase table `student_sources`, the `ocr_text` column should now have content

**Step 3: Commit**

```bash
git add app/api/uploads/student-sources/route.ts
git commit -m "feat: wire OCR into upload pipeline — ocr_text now populated via Sarvam AI / pdf-parse"
```

---

## Phase 3 — API Routes

> All HTTP endpoints. No UI code. Build and verify each route before moving to the next.

---

### Task 4: Session Persistence API

**Files:**
- Create: `app/api/ai-guide/sessions/route.ts`
- Create: `app/api/ai-guide/sessions/[id]/route.ts`

**Context:** Currently there is zero session persistence. Every generation is stateless and lost on page refresh. These two files provide full CRUD for `AiGuideSession`.

**Step 1: Create `app/api/ai-guide/sessions/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/ai-guide/sessions?studentId=xxx
// Returns all sessions for a student, newest first
// Excludes heavy chat_history / generated_outputs for the list view
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")

  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 })
  }

  const sessions = await prisma.aiGuideSession.findMany({
    where: { student_id: studentId },
    orderBy: { last_active_at: "desc" },
    select: {
      id: true,
      title: true,
      session_type: true,
      exam_context_id: true,
      error_focus: true,
      sources_json: true,
      last_active_at: true,
      created_at: true,
      rating: true,
    },
  })

  return NextResponse.json({ sessions })
}

// POST /api/ai-guide/sessions
// Body: { studentId, sessionType?, examContextId?, errorFocus?, title?, sourceIds? }
export async function POST(req: Request) {
  try {
    const {
      studentId,
      sessionType = "free_study",
      examContextId,
      errorFocus,
      title,
      sourceIds,
    } = await req.json()

    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 })
    }

    // Auto-generate a meaningful title for exam_prep sessions
    let sessionTitle = title || "New Study Session"
    if (sessionType === "exam_prep" && examContextId) {
      const sheet = await prisma.answerSheet.findUnique({
        where: { id: examContextId },
        include: { exam: true, feedback: true },
      })
      const examName =
        sheet?.feedback?.[0]?.exam_name ||
        sheet?.exam?.exam_name ||
        "Exam"
      sessionTitle = title || `${examName} — Debrief`
    }

    const session = await prisma.aiGuideSession.create({
      data: {
        student_id: studentId,
        title: sessionTitle,
        session_type: sessionType,
        exam_context_id: examContextId || null,
        error_focus: errorFocus || null,
        sources_json: sourceIds ?? [],
        chat_history: [],
        generated_outputs: [],
        last_active_at: new Date(),
      },
    })

    return NextResponse.json({ session })
  } catch (error) {
    console.error("Create session error:", error)
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
```

**Step 2: Create `app/api/ai-guide/sessions/[id]/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/ai-guide/sessions/:id
// Full session including chat_history and generated_outputs
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await prisma.aiGuideSession.findUnique({
    where: { id: params.id },
  })

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  return NextResponse.json({ session })
}

// PATCH /api/ai-guide/sessions/:id
// Partial update — saves chat messages, outputs, mastery checkpoints, rename, etc.
// Always bumps last_active_at
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const updated = await prisma.aiGuideSession.update({
      where: { id: params.id },
      data: { ...body, last_active_at: new Date() },
    })
    return NextResponse.json({ session: updated })
  } catch (error) {
    console.error("Update session error:", error)
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}

// DELETE /api/ai-guide/sessions/:id
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.aiGuideSession.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
```

**Step 3: Verify with browser console**

Open any page on the running dev server. In browser console:

```javascript
// Create a session
const r = await fetch('/api/ai-guide/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ studentId: 'PASTE_A_REAL_STUDENT_ID', sessionType: 'free_study', title: 'Test' })
})
const { session } = await r.json()
console.log(session.id, session.title) // should print id and "Test"

// Fetch it back
const r2 = await fetch('/api/ai-guide/sessions?studentId=PASTE_A_REAL_STUDENT_ID')
const { sessions } = await r2.json()
console.log(sessions.length, sessions[0].title) // should include "Test"
```

Expected: both calls return 200 with session data.

**Step 4: Commit**

```bash
git add app/api/ai-guide/sessions/
git commit -m "feat: session persistence API — full CRUD for AiGuideSession"
```

---

### Task 5: Enhanced Generate Route — 4 New Modes

**Files:**
- Modify: `app/api/ai-guide/generate/route.ts`

**Context:** Current route has 4 modes (`summary`, `quiz`, `faq`, `study_plan`). Add 4 new modes: `concept_explainer`, `drill_practice`, `keyword_builder`, `exam_debrief`. The first three target specific error types. `exam_debrief` fetches the linked `AnswerSheet` + `root_cause_analysis` and generates a personalized analysis. All modes now optionally persist their output to a session.

**Step 1: Replace `app/api/ai-guide/generate/route.ts`**

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

type GenType =
  | "summary"
  | "quiz"
  | "faq"
  | "study_plan"
  | "concept_explainer"
  | "drill_practice"
  | "keyword_builder"
  | "exam_debrief"

function buildPrompt(type: GenType, sourceContext: string, examContext: string): string {
  const base = `You are an expert tutor for Indian school students (CBSE/ICSE/State Board). Be specific, clear, and encouraging.\n\n`

  switch (type) {
    case "summary":
      return `${base}Summarize these study materials. Focus on key concepts and important points.\n\n${sourceContext}`

    case "quiz":
      return `${base}Generate a 5-question multiple choice quiz. Return as JSON array:
[{ "question": "...", "options": ["A","B","C","D"], "answer": "A", "explanation": "..." }]

Materials:
${sourceContext}`

    case "faq":
      return `${base}Generate 5 common exam questions with detailed model answers.

Materials:
${sourceContext}`

    case "study_plan":
      return `${base}Create a structured 3-day study plan with daily topics, activities, and revision checkpoints.

Materials:
${sourceContext}`

    case "concept_explainer":
      return `${base}The student made CONCEPT ERRORS — they don't fully understand the underlying ideas.

Your job:
- Explain the core concepts clearly using simple analogies and real-world examples
- Break down each complex idea step by step
- End with 3 "check your understanding" questions

${examContext ? `Exam context:\n${examContext}\n\n` : ""}Materials:
${sourceContext}`

    case "drill_practice":
      return `${base}The student made CALCULATION/PROCEDURAL ERRORS — they understand concepts but make mistakes in steps.

Your job: Generate 8 practice problems with full step-by-step worked solutions.
- Each problem isolates one procedural step
- Show every step explicitly — no skipping
- Mark the step most students get wrong

${examContext ? `Exam context:\n${examContext}\n\n` : ""}Materials:
${sourceContext}`

    case "keyword_builder":
      return `${base}The student made KEYWORD/EXPRESSION ERRORS — they understand the material but struggle to express it in exams.

Your job:
1. List 10 key terms with clear definitions
2. Show 3 examples: weak student answer → strong model answer
3. Provide a "power phrases" list: exam-ready expressions for this topic

${examContext ? `Exam context:\n${examContext}\n\n` : ""}Materials:
${sourceContext}`

    case "exam_debrief":
      return `${base}Review this student's graded exam and write a structured debrief.

EXAM PERFORMANCE:
${examContext}

STUDY MATERIALS (if any):
${sourceContext || "(None provided)"}

Write:
1. **What you did well** — specific, cite actual correct areas
2. **Where you lost marks** — each gap with error type (concept / calculation / keyword)
3. **The fix for each gap** — concrete and actionable (what to review or practice)
4. **Your study priority** — rank gaps from most to least impactful on score
5. **One encouraging note** — genuine, not generic

Be specific. Reference the actual exam topics.`

    default:
      return `${base}Provide helpful study insights.\n\n${sourceContext}`
  }
}

export async function POST(req: Request) {
  try {
    const { type, sourceIds, studentId, sessionId, examContextId } = await req.json()

    // 1. Fetch source materials
    let sourceContext = ""
    if (sourceIds && sourceIds.length > 0) {
      const sources = await prisma.studentSource.findMany({
        where: { id: { in: sourceIds }, student_id: studentId },
      })
      sourceContext = sources
        .map((s) => `[${s.title}]\n${s.ocr_text || "(No text extracted)"}`)
        .join("\n\n---\n\n")
    }

    // 2. Fetch exam context if provided
    let examContext = ""
    if (examContextId) {
      const sheet = await prisma.answerSheet.findUnique({
        where: { id: examContextId },
        include: { exam: true, feedback: true },
      })

      if (sheet) {
        const examName =
          sheet.feedback?.[0]?.exam_name || sheet.exam?.exam_name || "Exam"
        const subject =
          sheet.feedback?.[0]?.exam_subject || sheet.exam?.subject || "General"
        const totalMarks =
          sheet.feedback?.[0]?.exam_total_marks || sheet.exam?.total_marks || 100
        const score = sheet.total_score || 0
        const rca = (sheet.feedback?.[0]?.root_cause_analysis as Record<string, number>) || {}

        examContext = `Exam: ${examName} (${subject})
Score: ${score}/${totalMarks} (${Math.round((score / totalMarks) * 100)}%)
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
      const session = await prisma.aiGuideSession.findUnique({
        where: { id: sessionId },
        select: { generated_outputs: true },
      })
      const existing = (session?.generated_outputs as any[]) || []
      await prisma.aiGuideSession.update({
        where: { id: sessionId },
        data: {
          generated_outputs: [
            ...existing,
            { type, content: text, saved: false, created_at: new Date().toISOString() },
          ],
          last_active_at: new Date(),
        },
      })
    }

    return NextResponse.json({ result: text })
  } catch (error) {
    console.error("AI Gen Error:", error)
    return NextResponse.json({ error: "AI Generation Failed" }, { status: 500 })
  }
}
```

**Step 2: Verify each new mode**

In the browser console (with a real student ID and answer sheet ID that has `feedback_analysis`):

```javascript
// Test exam_debrief
const r = await fetch('/api/ai-guide/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'exam_debrief',
    sourceIds: [],
    studentId: 'PASTE_STUDENT_ID',
    examContextId: 'PASTE_ANSWER_SHEET_ID'
  })
})
const d = await r.json()
console.log(d.result) // Should be a structured debrief, not an error
```

Also test `concept_explainer` with a sourceId that has ocr_text.

**Step 3: Commit**

```bash
git add app/api/ai-guide/generate/route.ts
git commit -m "feat: add concept_explainer, drill_practice, keyword_builder, exam_debrief generation modes; persist outputs to session"
```

---

### Task 6: AI Daily Brief API

**Files:**
- Create: `app/api/ai-guide/daily-brief/route.ts`

**Context:** Called by the dashboard client component on load. Fetches the student's recent error patterns and upcoming exams, then asks Gemini to write a 2-sentence personalized study focus message. No session is created — this is read-only.

**Step 1: Create `app/api/ai-guide/daily-brief/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  if (!studentId) return NextResponse.json({ brief: null })

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true, class: true, streak: true },
    })

    // Last 3 approved exams with feedback
    const recentSheets = await prisma.answerSheet.findMany({
      where: { student_id: studentId, status: "approved" },
      include: { exam: true, feedback: true },
      orderBy: { created_at: "desc" },
      take: 3,
    })

    if (recentSheets.length === 0) {
      return NextResponse.json({
        brief: "Welcome! Once your teacher grades your first exam, I'll give you a personalised study focus here.",
      })
    }

    // Aggregate error counts across recent exams
    let concept = 0, calculation = 0, keyword = 0
    for (const sheet of recentSheets) {
      const rca = (sheet.feedback?.[0]?.root_cause_analysis as Record<string, number>) || {}
      concept += Number(rca.concept || 0)
      calculation += Number(rca.calculation || 0)
      keyword += Number(rca.keyword || 0)
    }

    const dominantError =
      concept >= calculation && concept >= keyword
        ? "concept understanding"
        : calculation >= keyword
        ? "calculation steps"
        : "exam expression and keywords"

    // Nearest upcoming exam within 7 days
    const soonExam = await prisma.exam.findFirst({
      where: {
        class: student?.class ?? undefined,
        exam_date: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { exam_date: "asc" },
    })

    const prompt = `Write a 2-sentence motivating daily study brief for a student.
Facts:
- Their most common error type across recent exams: ${dominantError}
- Current streak: ${student?.streak || 0} days
${soonExam ? `- Upcoming exam in ≤7 days: ${soonExam.exam_name}` : ""}
- Error counts: concept=${concept}, calculation=${calculation}, keyword=${keyword}

Rules:
- Name the specific error type (not generic advice)
- Mention what to do ("open your AI Guide", "try Drill Practice mode", etc.)
- Tone: supportive mentor, not a robot
- Maximum 2 sentences. No bullet points.`

    const result = await model.generateContent(prompt)
    const brief = result.response.text().trim()

    return NextResponse.json({ brief })
  } catch (err) {
    console.error("[daily-brief] error:", err)
    return NextResponse.json({ brief: null })
  }
}
```

**Step 2: Verify**

```
GET http://localhost:3000/api/ai-guide/daily-brief?studentId=PASTE_STUDENT_ID
```

Expected: `{ brief: "Your recent exams show concept errors in Physics. Open your AI Guide and try Concept Explainer mode to fix this before your exam on Friday." }`

**Step 3: Commit**

```bash
git add app/api/ai-guide/daily-brief/
git commit -m "feat: AI Daily Brief API — personalized 2-sentence study focus from error patterns"
```

---

### Task 7: Self-Assessment API

**Files:**
- Create: `app/api/student/self-assessment/route.ts`

**Context:** Saves a student's pre-exam confidence ratings. Called by the dashboard when a student rates topics before an upcoming exam. Idempotent — if an assessment for this exam already exists, returns it without creating a duplicate.

**Step 1: Create `app/api/student/self-assessment/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/student/self-assessment
// Body: { studentId, examId, topics: [{ name, confidence: 1-5 }] }
export async function POST(req: Request) {
  try {
    const { studentId, examId, topics } = await req.json()

    if (!studentId || !examId || !topics?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Idempotent — one assessment per student per exam
    const existing = await prisma.selfAssessment.findFirst({
      where: { student_id: studentId, exam_id: examId },
    })
    if (existing) {
      return NextResponse.json({ assessment: existing })
    }

    const assessment = await prisma.selfAssessment.create({
      data: { student_id: studentId, exam_id: examId, topics },
    })

    return NextResponse.json({ assessment })
  } catch (err) {
    console.error("[self-assessment] error:", err)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}

// GET /api/student/self-assessment?studentId=xxx&examId=yyy
// Check if an assessment already exists (so UI knows whether to show the prompt)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  const examId = searchParams.get("examId")

  if (!studentId || !examId) {
    return NextResponse.json({ error: "studentId and examId required" }, { status: 400 })
  }

  const assessment = await prisma.selfAssessment.findFirst({
    where: { student_id: studentId, exam_id: examId },
  })

  return NextResponse.json({ assessment })
}
```

**Step 2: Verify**

```javascript
// POST
const r = await fetch('/api/student/self-assessment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentId: 'PASTE_STUDENT_ID',
    examId: 'PASTE_EXAM_ID',
    topics: [{ name: 'Optics', confidence: 3 }, { name: 'Waves', confidence: 4 }]
  })
})
console.log(await r.json()) // { assessment: { id: '...', topics: [...] } }

// POST again — should return same assessment, not duplicate
const r2 = await fetch('/api/student/self-assessment', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ studentId: 'PASTE_STUDENT_ID', examId: 'PASTE_EXAM_ID', topics: [] }) })
console.log(await r2.json()) // same id as above
```

**Step 3: Commit**

```bash
git add app/api/student/self-assessment/
git commit -m "feat: self-assessment API — saves pre-exam confidence ratings, idempotent"
```

---

## Phase 4 — Frontend: Core Components

> All backend is done. Now build the UI components that call those APIs.
> Do not create pages yet — components only.

---

### Task 8: StudyThisButton Component

**Files:**
- Create: `components/student/study-this-button.tsx`

**Context:** Appears on each exam card on the dashboard. On click: calls `POST /api/ai-guide/sessions` with `session_type: 'exam_prep'` and the `examContextId`, then navigates to the new session. This is the physical bridge between grading and learning.

**Step 1: Create `components/student/study-this-button.tsx`**

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"

interface StudyThisButtonProps {
  examId: string       // AnswerSheet id (not Exam id)
  examName: string
  studentId: string
  variant?: "icon" | "full"
}

export function StudyThisButton({
  examId,
  examName,
  studentId,
  variant = "icon",
}: StudyThisButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // prevent parent <Link> from firing
    setLoading(true)

    try {
      const res = await fetch("/api/ai-guide/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          sessionType: "exam_prep",
          examContextId: examId,
          title: `${examName} — Debrief`,
        }),
      })

      if (!res.ok) throw new Error("Failed to create session")
      const { session } = await res.json()
      router.push(`/student/ai-guide/${session.id}`)
    } catch (err) {
      console.error("[study-this]", err)
      setLoading(false)
    }
  }

  if (variant === "full") {
    return (
      <Button
        variant="liquid"
        size="sm"
        onClick={handleClick}
        disabled={loading}
        className="gap-2"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        Study This
      </Button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={`Study ${examName} with AI Guide`}
      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
      Study This
    </button>
  )
}
```

**Step 2: Commit**

```bash
git add components/student/study-this-button.tsx
git commit -m "feat: StudyThisButton — creates exam_prep session and navigates to AI Guide"
```

---

### Task 9: Context Panel Component

**Files:**
- Create: `components/ai-guide/context-panel.tsx`

**Context:** The right column of the 3-column session view. Shows the student's error gap proportions, exam score/weak topics (if exam_prep session), and a mastery checklist they can tick off.

**Step 1: Create `components/ai-guide/context-panel.tsx`**

```typescript
"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Target, Brain, CheckSquare, Square } from "lucide-react"
import { cn } from "@/lib/utils"

interface ErrorStats {
  concept: number
  calculation: number
  keyword: number
}

interface ExamContext {
  examName: string
  subject: string
  score: number
  totalMarks: number
}

interface MasteryCheckpoint {
  topic: string
  confidence: "low" | "medium" | "high"
}

interface ContextPanelProps {
  errorStats?: ErrorStats
  examContext?: ExamContext
  masteryCheckpoints: MasteryCheckpoint[]
  onToggleMastery: (topic: string) => void
}

const ERROR_COLORS = {
  concept: "bg-purple-500",
  calculation: "bg-blue-500",
  keyword: "bg-amber-500",
}

export function ContextPanel({
  errorStats,
  examContext,
  masteryCheckpoints,
  onToggleMastery,
}: ContextPanelProps) {
  const total = errorStats
    ? Math.max(errorStats.concept + errorStats.calculation + errorStats.keyword, 1)
    : 1

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {/* Error gap proportions */}
      {errorStats && (
        <GlassCard variant="neu" className="p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Target size={12} />
            Error Gaps
          </h4>
          {(["concept", "calculation", "keyword"] as const).map((type) => (
            <div key={type} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="capitalize text-muted-foreground">{type}</span>
                <span className="font-semibold text-foreground">
                  {Math.round((errorStats[type] / total) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", ERROR_COLORS[type])}
                  style={{ width: `${(errorStats[type] / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </GlassCard>
      )}

      {/* Exam context */}
      {examContext && (
        <GlassCard variant="neu" className="p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            This Exam
          </h4>
          <p className="text-xs text-muted-foreground">{examContext.subject}</p>
          <p className="text-2xl font-display font-bold text-foreground my-1">
            {Math.round((examContext.score / examContext.totalMarks) * 100)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {examContext.score}/{examContext.totalMarks} marks
          </p>
        </GlassCard>
      )}

      {/* Mastery checklist */}
      {masteryCheckpoints.length > 0 && (
        <GlassCard variant="neu" className="p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Brain size={12} />
            Mastery
          </h4>
          <div className="space-y-2">
            {masteryCheckpoints.map((cp) => (
              <button
                key={cp.topic}
                onClick={() => onToggleMastery(cp.topic)}
                className="flex items-center gap-2 w-full text-left hover:opacity-75 transition-opacity"
              >
                {cp.confidence === "high" ? (
                  <CheckSquare size={13} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <Square size={13} className="text-muted-foreground flex-shrink-0" />
                )}
                <span
                  className={cn(
                    "text-xs",
                    cp.confidence === "high"
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  )}
                >
                  {cp.topic}
                </span>
              </button>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/ai-guide/context-panel.tsx
git commit -m "feat: ContextPanel component — error gaps, exam score, mastery checklist"
```

---

### Task 10: Sessions List Component

**Files:**
- Create: `components/ai-guide/sessions-list.tsx`

**Step 1: Create `components/ai-guide/sessions-list.tsx`**

```typescript
"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import {
  Brain, Plus, BookOpen, FlaskConical, FileText, Clock, Loader2, Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Session {
  id: string
  title: string
  session_type: string
  error_focus: string | null
  last_active_at: string
}

const TYPE_ICON = {
  exam_prep: FlaskConical,
  concept_study: Brain,
  note_synthesis: FileText,
  free_study: BookOpen,
} as const

const TYPE_LABEL = {
  exam_prep: "Exam Debrief",
  concept_study: "Concept Study",
  note_synthesis: "Note Synthesis",
  free_study: "Free Study",
} as const

const ERROR_FOCUS_STYLE = {
  concept: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  calculation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  keyword: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
} as const

export function SessionsList({
  initialSessions,
  studentId,
}: {
  initialSessions: Session[]
  studentId: string
}) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [creating, setCreating] = useState(false)

  const createSession = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/ai-guide/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, sessionType: "free_study" }),
      })
      const { session } = await res.json()
      router.push(`/student/ai-guide/${session.id}`)
    } catch {
      setCreating(false)
    }
  }

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/ai-guide/sessions/${id}`, { method: "DELETE" })
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-6">
      <Button
        variant="liquid"
        className="w-full py-6 text-base gap-2"
        onClick={createSession}
        disabled={creating}
      >
        {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        New Study Session
      </Button>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Brain size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No sessions yet.</p>
          <p className="text-sm mt-1">Start a new session or click "Study This" on any exam.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => {
            const Icon = TYPE_ICON[session.session_type as keyof typeof TYPE_ICON] ?? BookOpen
            return (
              <GlassCard
                key={session.id}
                hoverEffect
                className="p-5 cursor-pointer group relative"
                onClick={() => router.push(`/student/ai-guide/${session.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <Icon size={16} />
                  </div>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <h3 className="font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                  {session.title}
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground bg-secondary/70 px-2 py-0.5 rounded-full">
                    {TYPE_LABEL[session.session_type as keyof typeof TYPE_LABEL] ?? "Study"}
                  </span>
                  {session.error_focus && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      ERROR_FOCUS_STYLE[session.error_focus as keyof typeof ERROR_FOCUS_STYLE]
                    )}>
                      {session.error_focus} focus
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
                  </span>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/ai-guide/sessions-list.tsx
git commit -m "feat: SessionsList component — grid of named sessions with create/delete"
```

---

### Task 11: Session View Component (3-column)

**Files:**
- Create: `components/ai-guide/session-view.tsx`

**Context:** The main AI Guide experience. Left column = source picker. Center = chat + generate. Right = ContextPanel. Persists chat to session after every exchange via `PATCH /api/ai-guide/sessions/[id]`.

**Step 1: Create `components/ai-guide/session-view.tsx`**

```typescript
"use client"

import { useState, useRef, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { ContextPanel } from "@/components/ai-guide/context-panel"
import { UploadZone } from "@/components/ai-guide/upload-zone"
import {
  Send, Sparkles, Brain, FileText, Dumbbell, Type,
  ClipboardList, Search, Loader2, PanelRight, X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Source {
  id: string
  title: string
  type: string
  ocr_text?: string | null
  created_at: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface GeneratedOutput {
  type: string
  content: string
  saved: boolean
  created_at: string
}

interface MasteryCheckpoint {
  topic: string
  confidence: "low" | "medium" | "high"
  demonstrated_at?: string
}

interface Session {
  id: string
  title: string
  session_type: string
  exam_context_id?: string | null
  error_focus?: string | null
  sources_json: string[]
  chat_history: Message[]
  generated_outputs: GeneratedOutput[]
  mastery_checkpoints: MasteryCheckpoint[]
}

interface ExamContext {
  examName: string
  subject: string
  score: number
  totalMarks: number
  errorStats: { concept: number; calculation: number; keyword: number }
}

interface SessionViewProps {
  session: Session
  allSources: Source[]
  studentId: string
  examContext?: ExamContext
}

const GEN_MODES = [
  { id: "exam_debrief",      label: "Exam Debrief",      icon: ClipboardList, color: "text-red-500" },
  { id: "concept_explainer", label: "Concept Explainer", icon: Brain,         color: "text-purple-500" },
  { id: "drill_practice",    label: "Drill Practice",    icon: Dumbbell,      color: "text-blue-500" },
  { id: "keyword_builder",   label: "Keyword Builder",   icon: Type,          color: "text-amber-500" },
  { id: "summary",           label: "Summary",           icon: FileText,      color: "text-teal-500" },
  { id: "quiz",              label: "Quiz Me",           icon: Search,        color: "text-indigo-500" },
] as const

export function SessionView({
  session,
  allSources,
  studentId,
  examContext,
}: SessionViewProps) {
  const [sources, setSources] = useState(allSources)
  const [selectedIds, setSelectedIds] = useState<string[]>(session.sources_json)
  const [messages, setMessages] = useState<Message[]>(session.chat_history)
  const [outputs, setOutputs] = useState<GeneratedOutput[]>(session.generated_outputs)
  const [checkpoints, setCheckpoints] = useState<MasteryCheckpoint[]>(session.mastery_checkpoints)
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genMode, setGenMode] = useState<string>(
    session.session_type === "exam_prep" ? "exam_debrief" : "summary"
  )
  const [showContext, setShowContext] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, outputs])

  const persist = async (
    msgs: Message[],
    outs: GeneratedOutput[],
    cps: MasteryCheckpoint[]
  ) => {
    await fetch(`/api/ai-guide/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_history: msgs,
        generated_outputs: outs,
        mastery_checkpoints: cps,
        sources_json: selectedIds,
      }),
    })
  }

  const sendMessage = async () => {
    if (!input.trim() || streaming) return
    const userMsg: Message = { role: "user", content: input.trim(), timestamp: new Date().toISOString() }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput("")
    setStreaming(true)

    const placeholder: Message = { role: "assistant", content: "", timestamp: new Date().toISOString() }
    setMessages([...newMsgs, placeholder])

    try {
      const res = await fetch("/api/ai-guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
          sourceIds: selectedIds,
          studentId,
          examContextId: session.exam_context_id,
        }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // Vercel AI SDK streaming format: lines starting with "0:"
        full += chunk
          .split("\n")
          .filter((l) => l.startsWith("0:"))
          .map((l) => { try { return JSON.parse(l.slice(2)) } catch { return "" } })
          .join("")
        setMessages((prev) => {
          const u = [...prev]
          u[u.length - 1] = { ...placeholder, content: full }
          return u
        })
      }

      const finalMsgs = [...newMsgs, { ...placeholder, content: full }]
      setMessages(finalMsgs)
      await persist(finalMsgs, outputs, checkpoints)
    } catch (err) {
      console.error(err)
      setMessages((prev) => {
        const u = [...prev]
        u[u.length - 1] = { ...placeholder, content: "Error — please try again." }
        return u
      })
    } finally {
      setStreaming(false)
    }
  }

  const generate = async () => {
    if (selectedIds.length === 0 && !session.exam_context_id) return
    setGenerating(true)
    try {
      const res = await fetch("/api/ai-guide/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: genMode,
          sourceIds: selectedIds,
          studentId,
          sessionId: session.id,
          examContextId: session.exam_context_id,
        }),
      })
      const { result } = await res.json()
      const out: GeneratedOutput = {
        type: genMode,
        content: result,
        saved: false,
        created_at: new Date().toISOString(),
      }
      const newOutputs = [...outputs, out]
      setOutputs(newOutputs)
      await persist(messages, newOutputs, checkpoints)
    } finally {
      setGenerating(false)
    }
  }

  const toggleMastery = async (topic: string) => {
    const updated = checkpoints.map((cp) =>
      cp.topic === topic
        ? { ...cp, confidence: cp.confidence === "high" ? ("low" as const) : ("high" as const) }
        : cp
    )
    setCheckpoints(updated)
    await persist(messages, outputs, updated)
  }

  const toggleSource = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])

  const canGenerate = selectedIds.length > 0 || !!session.exam_context_id

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-3">
      {/* LEFT: Source picker */}
      <div className="w-52 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1">
          Sources
        </p>
        {sources.map((s) => (
          <button
            key={s.id}
            onClick={() => toggleSource(s.id)}
            className={cn(
              "w-full text-left p-3 rounded-xl border text-xs transition-all",
              selectedIds.includes(s.id)
                ? "bg-indigo-50 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300"
                : "bg-secondary/50 border-transparent hover:border-border text-foreground"
            )}
          >
            <FileText size={11} className="mb-1 opacity-50" />
            <p className="font-semibold line-clamp-2">{s.title}</p>
          </button>
        ))}
        <UploadZone
          studentId={studentId}
          onUploadComplete={(newSource: any) => setSources((p) => [newSource, ...p])}
        />
      </div>

      {/* CENTER: Chat + Generate */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mode selector */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 flex-wrap">
          {GEN_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setGenMode(m.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                genMode === m.id
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground"
              )}
            >
              <m.icon size={11} className={genMode === m.id ? "text-primary" : m.color} />
              {m.label}
            </button>
          ))}
          <Button
            variant="liquid"
            size="sm"
            className="flex-shrink-0 gap-1 text-xs h-8"
            onClick={generate}
            disabled={generating || !canGenerate}
          >
            {generating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            Generate
          </Button>
        </div>

        {/* Output + chat area */}
        <GlassCard className="flex-1 overflow-y-auto p-4 space-y-4 mb-3">
          {messages.length === 0 && outputs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Sparkles size={36} className="mb-3 opacity-25" />
              <p className="font-semibold text-sm">
                {session.session_type === "exam_prep"
                  ? "Click Exam Debrief → Generate to start."
                  : "Select sources and generate or chat."}
              </p>
            </div>
          )}

          {outputs.map((out, i) => (
            <GlassCard key={i} variant="neu" className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {out.type.replace(/_/g, " ")}
              </p>
              <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {out.content}
              </div>
            </GlassCard>
          ))}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-foreground rounded-bl-sm"
              )}>
                {msg.content || <span className="opacity-40 animate-pulse">▌</span>}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </GlassCard>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Ask about your materials..."
            className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            variant="liquid"
            size="icon"
            className="h-12 w-12 rounded-xl flex-shrink-0"
          >
            {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
      </div>

      {/* RIGHT: Context panel */}
      {showContext && (
        <div className="w-52 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Context</p>
            <button onClick={() => setShowContext(false)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
              <X size={12} />
            </button>
          </div>
          <ContextPanel
            errorStats={examContext?.errorStats}
            examContext={examContext}
            masteryCheckpoints={checkpoints}
            onToggleMastery={toggleMastery}
          />
        </div>
      )}
      {!showContext && (
        <button
          onClick={() => setShowContext(true)}
          className="flex-shrink-0 self-start mt-10 p-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-muted-foreground"
          title="Show context panel"
        >
          <PanelRight size={15} />
        </button>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/ai-guide/session-view.tsx
git commit -m "feat: SessionView — 3-column layout with chat, generate modes, context panel, persistence"
```

---

### Task 12: Dashboard Widget Components

**Files:**
- Create: `components/dashboard/ai-daily-brief.tsx`
- Create: `components/dashboard/active-sessions-widget.tsx`
- Modify: `components/dashboard/mark-recovery-widget.tsx`
- Create: `components/student/self-assessment-prompt.tsx`
- Create: `components/student/error-trend-chart.tsx`

**Context:** All the new dashboard and analytics UI components. Built here before being wired into pages in the next phase.

**Step 1: Create `components/dashboard/ai-daily-brief.tsx`**

```typescript
"use client"

import { useEffect, useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"

export function AiDailyBrief({ studentId }: { studentId: string }) {
  const [brief, setBrief] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/ai-guide/daily-brief?studentId=${studentId}`)
      .then((r) => r.json())
      .then((d) => { setBrief(d.brief); setLoading(false) })
      .catch(() => setLoading(false))
  }, [studentId])

  if (!loading && !brief) return null

  return (
    <GlassCard variant="liquid" gradientColor="purple" className="p-5 flex items-start gap-3">
      <div className="p-2 rounded-xl bg-white/20 flex-shrink-0">
        {loading
          ? <Loader2 size={15} className="text-white animate-spin" />
          : <Sparkles size={15} className="text-white" />
        }
      </div>
      <div>
        <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Today's Focus</p>
        {loading
          ? <div className="h-4 w-56 bg-white/20 rounded animate-pulse" />
          : <p className="text-white text-sm font-medium leading-relaxed">{brief}</p>
        }
      </div>
    </GlassCard>
  )
}
```

**Step 2: Create `components/dashboard/active-sessions-widget.tsx`**

```typescript
import { GlassCard } from "@/components/ui/glass-card"
import { Brain, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Session {
  id: string
  title: string
  last_active_at: Date | string
}

export function ActiveSessionsWidget({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) return null

  return (
    <GlassCard variant="neu" className="p-6">
      <h3 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
        <Brain className="text-indigo-500" size={20} />
        Resume Studying
      </h3>
      <div className="space-y-2">
        {sessions.slice(0, 3).map((s) => (
          <Link key={s.id} href={`/student/ai-guide/${s.id}`}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-transparent hover:border-border hover:bg-secondary transition-all group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {s.title}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock size={9} />
                  {formatDistanceToNow(new Date(s.last_active_at), { addSuffix: true })}
                </p>
              </div>
              <ArrowRight size={13} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
      {sessions.length > 3 && (
        <Link href="/student/ai-guide" className="block text-center text-xs text-primary font-medium mt-3 hover:underline">
          View all {sessions.length} sessions →
        </Link>
      )}
    </GlassCard>
  )
}
```

**Step 3: Replace `components/dashboard/mark-recovery-widget.tsx`**

Read the existing file first to confirm its current props interface, then replace:

```typescript
"use client"

import { useRouter } from "next/navigation"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { GlassCard } from "@/components/ui/glass-card"
import { Target } from "lucide-react"

interface RecoveryStats { concept: number; calculation: number; keyword: number }

const COLORS = { concept: "#8b5cf6", calculation: "#3b82f6", keyword: "#f59e0b" }

export function MarkRecoveryWidget({
  stats,
  studentId,
}: {
  stats: RecoveryStats
  studentId: string
}) {
  const router = useRouter()
  const total = Math.max(stats.concept + stats.calculation + stats.keyword, 1)
  const data = (["concept", "calculation", "keyword"] as const)
    .filter((k) => stats[k] > 0)
    .map((k) => ({ name: k, value: stats[k], color: COLORS[k] }))

  const handleClick = async (entry: { name: string }) => {
    const res = await fetch("/api/ai-guide/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        sessionType: "concept_study",
        errorFocus: entry.name,
        title: `${entry.name.charAt(0).toUpperCase() + entry.name.slice(1)} Error Recovery`,
      }),
    })
    const { session } = await res.json()
    router.push(`/student/ai-guide/${session.id}`)
  }

  if (total === 1) {
    return (
      <GlassCard variant="neu" className="p-6">
        <h3 className="text-lg font-display font-bold text-foreground mb-2 flex items-center gap-2">
          <Target className="text-indigo-500" size={20} /> Mark Recovery
        </h3>
        <p className="text-sm text-muted-foreground">Complete an exam to see your error gaps.</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="neu" className="p-6">
      <h3 className="text-lg font-display font-bold text-foreground mb-1 flex items-center gap-2">
        <Target className="text-indigo-500" size={20} /> Mark Recovery
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Tap a segment to study that error type</p>
      <ResponsiveContainer width="100%" height={150}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
            paddingAngle={3} dataKey="value" onClick={handleClick} className="cursor-pointer">
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v: number) => [`${Math.round((v / total) * 100)}%`]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-3 mt-2 flex-wrap">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-muted-foreground capitalize">
              {d.name}: {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
```

**Step 4: Create `components/student/self-assessment-prompt.tsx`**

```typescript
"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Brain, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelfAssessmentPromptProps {
  examId: string
  examName: string
  studentId: string
  subject: string
}

const TOPICS_BY_DEFAULT = ["Key Concepts", "Problem Solving", "Formulae / Definitions"]

export function SelfAssessmentPrompt({
  examId,
  examName,
  studentId,
  subject,
}: SelfAssessmentPromptProps) {
  const topics = [subject, ...TOPICS_BY_DEFAULT].slice(0, 3)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [done, setDone] = useState(false)

  const allRated = topics.every((t) => ratings[t])

  const submit = async () => {
    if (!allRated) return
    await fetch("/api/student/self-assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        examId,
        topics: topics.map((t) => ({ name: t, confidence: ratings[t] })),
      }),
    })
    setDone(true)
  }

  if (done) {
    return (
      <GlassCard variant="neu" className="p-4 flex items-center gap-3">
        <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
        <p className="text-sm font-medium text-foreground">
          Saved! We'll compare this to your actual result after grading.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="neu" className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-500 flex-shrink-0">
          <Brain size={15} />
        </div>
        <div>
          <p className="font-bold text-foreground text-sm">{examName} — Coming Up</p>
          <p className="text-xs text-muted-foreground mt-0.5">Rate your confidence (1–5)</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {topics.map((topic) => (
          <div key={topic} className="flex items-center justify-between gap-2">
            <span className="text-xs text-foreground flex-1 min-w-0 truncate">{topic}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatings((p) => ({ ...p, [topic]: n }))}
                  className={cn(
                    "w-6 h-6 rounded-lg text-xs font-bold transition-all",
                    ratings[topic] === n
                      ? "bg-indigo-500 text-white"
                      : "bg-secondary/70 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button variant="liquid" size="sm" className="w-full" onClick={submit} disabled={!allRated}>
        Save Assessment
      </Button>
    </GlassCard>
  )
}
```

**Step 5: Create `components/student/error-trend-chart.tsx`**

```typescript
"use client"

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { GlassCard } from "@/components/ui/glass-card"
import { TrendingUp } from "lucide-react"

interface ErrorDataPoint {
  examName: string
  concept: number
  calculation: number
  keyword: number
}

export function ErrorTrendChart({ data }: { data: ErrorDataPoint[] }) {
  if (data.length < 2) {
    return (
      <GlassCard variant="neu" className="p-6">
        <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-2">
          <TrendingUp size={20} className="text-indigo-500" /> Error Trend
        </h3>
        <p className="text-sm text-muted-foreground">
          Need at least 2 graded exams to show error trends.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="neu" className="p-6">
      <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-1">
        <TrendingUp size={20} className="text-indigo-500" /> Error Trend Over Time
      </h3>
      <p className="text-xs text-muted-foreground mb-5">
        Falling lines = you're improving that error type.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            {(["concept", "calculation", "keyword"] as const).map((k, i) => {
              const c = ["#8b5cf6", "#3b82f6", "#f59e0b"][i]
              return (
                <linearGradient key={k} id={k} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              )
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="examName" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
          <Legend iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="concept"     name="Concept"     stroke="#8b5cf6" fill="url(#concept)"     strokeWidth={2} />
          <Area type="monotone" dataKey="calculation" name="Calculation" stroke="#3b82f6" fill="url(#calculation)" strokeWidth={2} />
          <Area type="monotone" dataKey="keyword"     name="Keyword"     stroke="#f59e0b" fill="url(#keyword)"     strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
```

**Step 6: Commit all components**

```bash
git add components/dashboard/ components/student/self-assessment-prompt.tsx components/student/error-trend-chart.tsx
git commit -m "feat: dashboard + analytics components — Daily Brief, Active Sessions, Recovery Radar, Self-Assessment, Error Trend"
```

---

## Phase 5 — Frontend: Pages

> Wire components into pages. All logic and APIs are already done.

---

### Task 13: Update AI Guide Pages

**Files:**
- Modify: `app/student/ai-guide/page.tsx`
- Create: `app/student/ai-guide/[sessionId]/page.tsx`

**Step 1: Replace `app/student/ai-guide/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SessionsList } from "@/components/ai-guide/sessions-list"
import { Brain, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AiGuidePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/sign-in")

  const student = await prisma.student.findUnique({ where: { user_id: user.id } })
  if (!student) return <div className="p-8 text-center"><p className="text-destructive font-bold">Profile not found. Contact your administrator.</p></div>

  const sessions = await prisma.aiGuideSession.findMany({
    where: { student_id: student.id },
    orderBy: { last_active_at: "desc" },
    select: { id: true, title: true, session_type: true, error_focus: true, last_active_at: true },
  })

  const serialized = sessions.map((s) => ({
    ...s,
    last_active_at: s.last_active_at.toISOString(),
  }))

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-8 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <Brain className="text-indigo-500 h-10 w-10" />
            AI Study Guide
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Your personal learning sessions — pick up where you left off.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-xs font-bold">
          <Sparkles size={12} /> V2
        </div>
      </div>
      <SessionsList initialSessions={serialized} studentId={student.id} />
    </div>
  )
}
```

**Step 2: Create `app/student/ai-guide/[sessionId]/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SessionView } from "@/components/ai-guide/session-view"
import { Brain, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/sign-in")

  const student = await prisma.student.findUnique({ where: { user_id: user.id } })
  if (!student) redirect("/auth/sign-in")

  const session = await prisma.aiGuideSession.findUnique({ where: { id: params.sessionId } })
  if (!session || session.student_id !== student.id) notFound()

  const allSources = await prisma.studentSource.findMany({
    where: { student_id: student.id },
    orderBy: { created_at: "desc" },
    select: { id: true, title: true, type: true, ocr_text: true, created_at: true },
  })

  // Build exam context if this is an exam_prep session
  let examContext = undefined
  if (session.exam_context_id) {
    const sheet = await prisma.answerSheet.findUnique({
      where: { id: session.exam_context_id },
      include: { exam: true, feedback: true },
    })
    if (sheet) {
      const rca = (sheet.feedback?.[0]?.root_cause_analysis as Record<string, number>) || {}
      examContext = {
        examName: sheet.feedback?.[0]?.exam_name || sheet.exam?.exam_name || "Exam",
        subject: sheet.feedback?.[0]?.exam_subject || sheet.exam?.subject || "General",
        score: sheet.total_score || 0,
        totalMarks: sheet.feedback?.[0]?.exam_total_marks || sheet.exam?.total_marks || 100,
        errorStats: {
          concept: Number(rca.concept || 0),
          calculation: Number(rca.calculation || 0),
          keyword: Number(rca.keyword || 0),
        },
      }
    }
  }

  // Serialize dates for client boundary
  const serializedSession = {
    ...session,
    exam_context_id: session.exam_context_id ?? null,
    error_focus: session.error_focus ?? null,
    sources_json: (session.sources_json as string[]) || [],
    chat_history: (session.chat_history as any[]) || [],
    generated_outputs: (session.generated_outputs as any[]) || [],
    mastery_checkpoints: (session.mastery_checkpoints as any[]) || [],
    last_active_at: session.last_active_at.toISOString(),
    created_at: session.created_at.toISOString(),
    updated_at: session.updated_at.toISOString(),
  }
  const serializedSources = allSources.map((s) => ({
    ...s,
    created_at: s.created_at.toISOString(),
  }))

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link href="/student/ai-guide" className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <Brain size={20} className="text-indigo-500" />
        <h1 className="text-xl font-display font-bold text-foreground line-clamp-1">{session.title}</h1>
        {session.session_type === "exam_prep" && (
          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-semibold">
            Exam Debrief
          </span>
        )}
      </div>
      <SessionView
        session={serializedSession}
        allSources={serializedSources}
        studentId={student.id}
        examContext={examContext}
      />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/student/ai-guide/
git commit -m "feat: AI Guide pages — sessions list + 3-column session view with routing"
```

---

### Task 14: Update Student Dashboard Page

**Files:**
- Modify: `app/student/dashboard/page.tsx`

**Context:** Wire all the new dashboard components: `AiDailyBrief`, `ActiveSessionsWidget`, `StudyThisButton` (replaces `AddToGuideButton`), updated `MarkRecoveryWidget` (now needs `studentId`), and `SelfAssessmentPrompt`.

**Step 1: Add the new imports and queries**

At the top of `app/student/dashboard/page.tsx`, replace the import for `AddToGuideButton` and add new imports:

```typescript
// Remove:
import { AddToGuideButton } from "@/components/student/add-to-guide-button"

// Add:
import { StudyThisButton } from "@/components/student/study-this-button"
import { AiDailyBrief } from "@/components/dashboard/ai-daily-brief"
import { ActiveSessionsWidget } from "@/components/dashboard/active-sessions-widget"
import { SelfAssessmentPrompt } from "@/components/student/self-assessment-prompt"
```

**Step 2: Add the recent sessions query**

After the `upcomingExams` query, add:

```typescript
// Recent AI Guide sessions for the "Resume Studying" widget
const recentSessions = await prisma.aiGuideSession.findMany({
  where: { student_id: student.id },
  orderBy: { last_active_at: "desc" },
  take: 5,
  select: { id: true, title: true, last_active_at: true },
})
```

**Step 3: Replace `AddToGuideButton` with `StudyThisButton`**

Find:
```typescript
<AddToGuideButton examId={sheet.id} examName={displayName} studentId={student.id} />
```

Replace with:
```typescript
<StudyThisButton examId={sheet.id} examName={displayName} studentId={student.id} />
```

**Step 4: Add `AiDailyBrief` after the header section**

Find the closing `</div>` of the header section (after the performance pill GlassCard), add:

```typescript
<AiDailyBrief studentId={student.id} />
```

**Step 5: Update `MarkRecoveryWidget` to pass `studentId`**

Find:
```typescript
<MarkRecoveryWidget stats={recoveryStats} />
```
Replace with:
```typescript
<MarkRecoveryWidget stats={recoveryStats} studentId={student.id} />
```

**Step 6: Add `ActiveSessionsWidget` and `SelfAssessmentPrompt` to the right sidebar**

In the right sidebar (inside the `lg:col-span-1` div), before the existing `MarkRecoveryWidget`:

```typescript
<ActiveSessionsWidget sessions={recentSessions} />
```

And after the `upcomingExams` GlassCard, add the self-assessment prompt (only shown when an exam is ≤7 days away):

```typescript
{(() => {
  if (!upcomingExams || upcomingExams.length === 0) return null
  const soon = upcomingExams[0] as any
  const daysUntil = Math.ceil(
    (new Date(soon.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
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
```

**Step 7: Verify the full dashboard**

1. Run `npm run dev`, go to `/student/dashboard`
2. AI Daily Brief loads within 3 seconds with a personalised message
3. Exam cards show "Study This" instead of old button
4. Recovery Radar shows as a donut chart (was a bar chart)
5. "Resume Studying" widget shows recent sessions (if any exist)
6. If an exam is within 7 days, self-assessment prompt appears

**Step 8: Commit**

```bash
git add app/student/dashboard/page.tsx
git commit -m "feat: student dashboard — AI Daily Brief, Active Sessions, StudyThis, Recovery Radar, Self-Assessment"
```

---

### Task 15: Add Error Trend Chart to Performance Page

**Files:**
- Modify: `app/student/performance/page.tsx`

**Context:** Add the `ErrorTrendChart` to the performance analytics page. The data comes from the already-fetched `recentExams` + `feedback_analysis`. No new query needed.

**Step 1: Add the import**

```typescript
import { ErrorTrendChart } from "@/components/student/error-trend-chart"
```

**Step 2: Derive the chart data from existing fetched data**

Find where `recentExams` is used in the JSX, and compute the chart data nearby (server-side, in the data section):

```typescript
const errorTrendData = (recentExams || [])
  .filter((sheet: any) => sheet.feedback_analysis?.length > 0)
  .map((sheet: any) => {
    const fb = sheet.feedback_analysis[0]
    const rca = (fb?.root_cause_analysis as Record<string, number>) || {}
    return {
      examName: (fb?.exam_name || "Exam").slice(0, 14),
      concept: Number(rca.concept || 0),
      calculation: Number(rca.calculation || 0),
      keyword: Number(rca.keyword || 0),
    }
  })
  .reverse() // oldest first = left-to-right chronological
```

**Step 3: Add the chart component to the JSX**

Place it as the first item in the charts/analytics section (wherever the other charts are rendered):

```typescript
<ErrorTrendChart data={errorTrendData} />
```

**Step 4: Verify**

Go to `/student/performance` — if 2+ exams are graded, the stacked area chart should appear. If only 1 exam, shows the "Need at least 2 exams" message.

**Step 5: Commit**

```bash
git add app/student/performance/page.tsx
git commit -m "feat: Error Trend Chart on performance page — stacked area showing error type progression"
```

---

## Phase 6 — Integration Check

---

### Task 16: Full End-to-End Walkthrough

**Step 1: Run dev server**

```bash
npm run dev
```

**Step 2: Walk the critical path**

- [ ] `/student/dashboard` loads — AI Daily Brief appears (not blank, not erroring)
- [ ] Click "Study This" on a graded exam → session created → redirects to `/student/ai-guide/[id]`
- [ ] In session view: right panel shows error gaps and exam score
- [ ] Select "Exam Debrief" mode → click Generate → personalised debrief appears
- [ ] Type a question in chat → AI streams a response
- [ ] Navigate away, come back to `/student/ai-guide/[id]` → chat history preserved
- [ ] Go to `/student/ai-guide` → sessions list shows the session you created
- [ ] Delete a session → it disappears from the list
- [ ] Click "New Study Session" → blank session opens
- [ ] Upload a file → check server logs for `[upload] method: sarvam|pdf-parse, chars: N`
- [ ] Tap a segment on the Recovery Radar → opens a new error-focused session
- [ ] "Resume Studying" widget shows on dashboard, links work
- [ ] `/student/performance` shows Error Trend Chart

**Step 3: Fix any issues**

Use `superpowers:systematic-debugging` skill for any failures.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: MARK AI V2 complete — AI Guide sessions, Exam Debrief, Sarvam OCR, dashboard intelligence"
```

---

## Summary

| Phase | Tasks | What it covers |
|---|---|---|
| 1 — Database | 1 | Prisma schema: 4 new tables + AiGuideSession fields |
| 2 — Services | 2–3 | Sarvam AI OCR service + upload pipeline |
| 3 — API Routes | 4–7 | Session CRUD, generate (8 modes), Daily Brief, Self-Assessment |
| 4 — Frontend Components | 8–12 | StudyThisButton, ContextPanel, SessionsList, SessionView, dashboard widgets |
| 5 — Frontend Pages | 13–15 | AI Guide pages, Dashboard page update, Performance page |
| 6 — Integration | 16 | End-to-end walkthrough + final commit |

## Environment Variables Needed

```
GOOGLE_API_KEY=           # Already set
SARVAM_API_KEY=           # New — get from sarvam.ai
DATABASE_URL=             # Already set
DIRECT_URL=               # Already set
NEXT_PUBLIC_SUPABASE_URL= # Already set
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Already set
```
