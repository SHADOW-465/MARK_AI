# AI Guide V2 + Student Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the grading→learning pipeline — the one thing no competitor has — by building persistent AI Guide sessions, real Indian-language OCR, error-type generation modes, and an intelligence-driven student dashboard.

**Architecture:** Extend the existing Next.js 14 App Router + Supabase + Prisma stack. All new features are additive — no existing routes are deleted. The core pattern is: `AnswerSheet.root_cause_analysis` drives everything the AI Guide says and does.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL + Storage), Prisma 7, Gemini 1.5 Flash (`@google/generative-ai`), Vercel AI SDK (`ai` + `@ai-sdk/google`) for streaming, Sarvam AI OCR API (new), Tailwind CSS, Radix UI, Recharts, Lucide React.

> **Note:** This project has no test infrastructure. All "verify" steps are manual browser/console checks. Add `console.log` freely during dev; remove before commit.

---

## Phase 1 — Fix the Broken Foundation

> These tasks fix what's broken before adding anything new. Do them in order.

---

### Task 1: Expand Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Context:** The schema is missing `Flashcard`, `XpLog`, `SelfAssessment`, `TopicRecovery` tables that are referenced in the code. `AiGuideSession` also needs new fields for persistence.

**Step 1: Open the file and add the new models**

Replace the entire `AiGuideSession` model and add the four missing models. The final schema additions (paste after the existing `AiGuideSession` model, and replace the `AiGuideSession` model entirely):

```prisma
// REPLACE the existing AiGuideSession model with this:
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

// NEW: Flashcard (referenced in code but missing from schema)
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

// NEW: XpLog (referenced in analytics code but missing)
model XpLog {
  id         String   @id @default(uuid())
  student_id String
  amount     Int
  reason     String   // 'exam_graded' | 'flashcard_mastered' | 'session_completed' | 'streak' | 'mission_complete'
  created_at DateTime @default(now())

  student Student @relation(fields: [student_id], references: [id])

  @@map("xp_logs")
}

// NEW: SelfAssessment — pre-exam confidence ratings
model SelfAssessment {
  id               String   @id @default(uuid())
  student_id       String
  exam_id          String   // exams.id of the upcoming exam
  topics           Json     // [{ name: string, confidence: 1-5 }]
  actual_result    Json?    // filled after grading: [{ name, actual_pct }]
  prediction_delta Float?   // abs(predicted_avg - actual_avg), computed post-grading
  created_at       DateTime @default(now())

  student Student @relation(fields: [student_id], references: [id])

  @@map("self_assessments")
}

// NEW: TopicRecovery — tracks recovery progress per topic
model TopicRecovery {
  id                    String   @id @default(uuid())
  student_id            String
  subject               String
  topic                 String
  error_count           Int      @default(0)
  session_count         Int      @default(0)
  flashcard_completions Int      @default(0)
  recovery_score        Float    @default(0) // 0-100
  last_updated          DateTime @updatedAt

  student Student @relation(fields: [student_id], references: [id])

  @@map("topic_recovery")
}
```

Also add the reverse relations to the `Student` model. Find the `Student` model and add these lines inside it (after `answerSheets AnswerSheet[]`):

```prisma
  flashcards      Flashcard[]
  xpLogs          XpLog[]
  selfAssessments SelfAssessment[]
  topicRecoveries TopicRecovery[]
```

**Step 2: Run the migration**

```bash
cd /c/Users/acer/Documents/projects/MARK_AI
npx prisma migrate dev --name "add_session_fields_and_missing_tables"
```

Expected: Migration created and applied. Prisma client regenerated automatically.

If it fails with "column already exists", use `--create-only` then edit the migration SQL to remove the conflicting column, then run `npx prisma migrate deploy`.

**Step 3: Verify**

```bash
npx prisma studio
```

Open http://localhost:5555. Confirm `flashcards`, `xp_logs`, `self_assessments`, `topic_recovery` tables exist. Confirm `ai_guide_sessions` has `title`, `session_type`, `exam_context_id`, `last_active_at` columns.

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: expand schema — add Flashcard, XpLog, SelfAssessment, TopicRecovery; expand AiGuideSession"
```

---

### Task 2: Sarvam AI OCR Service

**Files:**
- Create: `lib/sarvam-ocr.ts`
- Modify: `.env.local` (add `SARVAM_API_KEY`)

**Context:** Sarvam AI provides Indian-language-specialized OCR. Their API accepts a base64-encoded image and returns extracted text. For PDFs we first use `pdf-parse` (already in package.json), then fall back to Sarvam for images/handwritten content.

**Step 1: Get Sarvam AI API key**

Sign up at https://www.sarvam.ai — get an API key and add it to `.env.local`:

```bash
echo 'SARVAM_API_KEY=your_key_here' >> .env.local
```

**Step 2: Create the OCR service**

Create `lib/sarvam-ocr.ts`:

```typescript
/**
 * Sarvam AI OCR Service
 * Handles Indian-language handwriting and printed text extraction.
 * Falls back to pdf-parse for English PDFs, Gemini Vision for diagrams.
 *
 * Sarvam API docs: https://docs.sarvam.ai/api-reference/ocr
 */

import pdf from "pdf-parse"

type OcrResult = {
  text: string
  language?: string
  method: "sarvam" | "pdf-parse" | "gemini-vision" | "none"
}

/**
 * Detect if content is likely Indian-script or handwritten
 * based on file type and name hints.
 */
function needsSarvamOcr(file: File): boolean {
  const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
  return imageTypes.includes(file.type)
}

/**
 * Extract text from a PDF buffer using pdf-parse.
 */
async function extractFromPdf(buffer: ArrayBuffer): Promise<string> {
  try {
    const data = await pdf(Buffer.from(buffer))
    return data.text || ""
  } catch {
    return ""
  }
}

/**
 * Extract text from an image using Sarvam AI OCR.
 * Supports Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali,
 * Gujarati, Marathi, Punjabi, Odia, English.
 */
async function extractWithSarvam(file: File): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY
  if (!apiKey) {
    console.warn("SARVAM_API_KEY not set — skipping Sarvam OCR")
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
        // language_code: "auto" tells Sarvam to detect language automatically
        language_code: "auto",
      }),
    })

    if (!response.ok) {
      console.error("Sarvam OCR error:", response.status, await response.text())
      return ""
    }

    const data = await response.json()
    // Sarvam returns { text: string, language: string }
    return data.text || ""
  } catch (err) {
    console.error("Sarvam OCR exception:", err)
    return ""
  }
}

/**
 * Main OCR function. Routes to the right extractor based on file type.
 *
 * Routing logic:
 * - .pdf → pdf-parse (fast, no API cost)
 * - .jpg/.png/.webp (images, likely handwritten) → Sarvam AI
 * - .txt/.md/.docx → direct text read (handled before this fn is called)
 */
export async function extractTextFromFile(file: File): Promise<OcrResult> {
  const name = file.name.toLowerCase()

  // PDF: use pdf-parse
  if (name.endsWith(".pdf")) {
    const buffer = await file.arrayBuffer()
    const text = await extractFromPdf(buffer)
    if (text.trim().length > 20) {
      return { text, method: "pdf-parse" }
    }
    // If pdf-parse returned very little text (scanned PDF), try Sarvam
    const sarvamText = await extractWithSarvam(file)
    return { text: sarvamText, method: "sarvam" }
  }

  // Images: Sarvam AI (best for Indian scripts + handwriting)
  if (needsSarvamOcr(file)) {
    const text = await extractWithSarvam(file)
    return { text, method: "sarvam" }
  }

  // Plain text files
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    const text = await file.text()
    return { text, method: "none" }
  }

  return { text: "", method: "none" }
}
```

**Step 3: Verify the import works**

```bash
cd /c/Users/acer/Documents/projects/MARK_AI
npx tsc --noEmit
```

Fix any type errors (usually just the `pdf-parse` types — if missing, run `npm install --save-dev @types/pdf-parse`).

**Step 4: Commit**

```bash
git add lib/sarvam-ocr.ts .env.local
git commit -m "feat: add Sarvam AI OCR service for Indian-language handwriting"
```

---

### Task 3: Wire OCR into the Upload Pipeline

**Files:**
- Modify: `app/api/uploads/student-sources/route.ts`

**Context:** Currently `ocrText` is always `""`. This task wires the Sarvam OCR service into the upload so `StudentSource.ocr_text` is actually populated after upload.

**Step 1: Replace the upload route**

Full replacement for `app/api/uploads/student-sources/route.ts`:

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

    // 2. Extract text via Sarvam AI OCR / pdf-parse
    const { text: ocrText, method } = await extractTextFromFile(file)
    console.log(`[OCR] ${file.name} → method: ${method}, chars: ${ocrText.length}`)

    // 3. Save to DB
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

**Step 2: Verify manually**

1. Run `npm run dev`
2. Go to `/student/ai-guide`
3. Upload a photo of a handwritten note (any language)
4. Check browser Network tab: the POST to `/api/uploads/student-sources` should return `{ data: { ocr_text: "..extracted text.." } }`
5. Check Supabase table `student_sources` — `ocr_text` column should now have content

**Step 3: Commit**

```bash
git add app/api/uploads/student-sources/route.ts
git commit -m "feat: wire Sarvam AI OCR into upload pipeline — ocr_text now populated"
```

---

### Task 4: Session Persistence API

**Files:**
- Create: `app/api/ai-guide/sessions/route.ts`
- Create: `app/api/ai-guide/sessions/[id]/route.ts`

**Context:** Currently there's no way to list, create, or fetch AI Guide sessions. Every generation is stateless. These two routes provide full CRUD for sessions.

**Step 1: Create `app/api/ai-guide/sessions/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/ai-guide/sessions?studentId=xxx
// Returns all sessions for a student, sorted by last_active_at desc
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")

  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 })
  }

  const sessions = await prisma.aiGuideSession.findMany({
    where: { student_id: studentId },
    orderBy: { last_active_at: "desc" },
    // Return lightweight list — omit heavy chat_history for list view
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
// Creates a new session and returns it
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      studentId,
      sessionType = "free_study",
      examContextId,
      errorFocus,
      title,
      sourceIds,
    } = body

    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 })
    }

    // Auto-generate title for exam_prep sessions
    let sessionTitle = title || "New Study Session"
    if (sessionType === "exam_prep" && examContextId) {
      // Fetch the exam name for a better default title
      const sheet = await prisma.answerSheet.findUnique({
        where: { id: examContextId },
        include: { exam: true, feedback: true },
      })
      const examName =
        sheet?.feedback?.[0]?.exam_name ||
        sheet?.exam?.exam_name ||
        "Exam Debrief"
      sessionTitle = title || `${examName} — Study Session`
    }

    const session = await prisma.aiGuideSession.create({
      data: {
        student_id: studentId,
        title: sessionTitle,
        session_type: sessionType,
        exam_context_id: examContextId || null,
        error_focus: errorFocus || null,
        sources_json: sourceIds ? sourceIds : [],
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
// Returns full session including chat_history and generated_outputs
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
// Body: any subset of { title, chat_history, generated_outputs, mastery_checkpoints, rating, sources_json, last_active_at }
// Used to save chat messages, save generated outputs, rename, etc.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const updated = await prisma.aiGuideSession.update({
      where: { id: params.id },
      data: {
        ...body,
        last_active_at: new Date(), // always bump on any activity
      },
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

**Step 3: Verify**

In browser console or REST client (e.g. Thunder Client VS Code extension):

```
POST http://localhost:3000/api/ai-guide/sessions
Body: { "studentId": "<any student id from DB>", "sessionType": "free_study", "title": "Test Session" }
→ Should return { session: { id: "...", title: "Test Session", ... } }

GET http://localhost:3000/api/ai-guide/sessions?studentId=<same id>
→ Should return { sessions: [{ id: "...", title: "Test Session" }] }
```

**Step 4: Commit**

```bash
git add app/api/ai-guide/sessions/
git commit -m "feat: session persistence API — CRUD for AiGuideSession"
```

---

## Phase 2 — The Core Differentiator

---

### Task 5: Exam Debrief — "Study This" Flow

**Files:**
- Create: `components/student/study-this-button.tsx`
- Modify: `app/student/dashboard/page.tsx` (replace `AddToGuideButton` with `StudyThisButton`)

**Context:** When a student clicks "Study This" on any graded exam card, it creates an `exam_prep` session pre-loaded with that exam's error analysis, then navigates to the session view. This is the core grading→learning bridge that no competitor has.

**Step 1: Create `components/student/study-this-button.tsx`**

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"

interface StudyThisButtonProps {
  examId: string      // AnswerSheet id
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

  const handleStudyThis = async (e: React.MouseEvent) => {
    e.preventDefault() // prevent parent <Link> navigation
    e.stopPropagation()
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
      console.error(err)
      setLoading(false)
    }
  }

  if (variant === "full") {
    return (
      <Button
        variant="liquid"
        size="sm"
        onClick={handleStudyThis}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Sparkles size={14} />
        )}
        Study This
      </Button>
    )
  }

  return (
    <button
      onClick={handleStudyThis}
      disabled={loading}
      title={`Open AI Guide for ${examName}`}
      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Sparkles size={12} />
      )}
      Study This
    </button>
  )
}
```

**Step 2: Update the dashboard to use `StudyThisButton`**

In `app/student/dashboard/page.tsx`:

1. Replace import line:
```typescript
// Remove this:
import { AddToGuideButton } from "@/components/student/add-to-guide-button"
// Add this:
import { StudyThisButton } from "@/components/student/study-this-button"
```

2. Find the section inside the recent exams map where `AddToGuideButton` is rendered:
```typescript
<AddToGuideButton examId={sheet.id} examName={displayName} studentId={student.id} />
```
Replace with:
```typescript
<StudyThisButton examId={sheet.id} examName={displayName} studentId={student.id} />
```

**Step 3: Verify**

1. Run `npm run dev`, go to `/student/dashboard`
2. On any exam card, click "Study This"
3. Should redirect to `/student/ai-guide/[new-session-id]` (will 404 for now — that page is built in Task 7)
4. In Supabase, check `ai_guide_sessions` table — a new row should exist with `session_type = 'exam_prep'` and the correct `exam_context_id`

**Step 4: Commit**

```bash
git add components/student/study-this-button.tsx app/student/dashboard/page.tsx
git commit -m "feat: StudyThisButton — creates exam_prep session and navigates to AI Guide"
```

---

### Task 6: Enhanced Generate Route — 3 New Error-Type Modes

**Files:**
- Modify: `app/api/ai-guide/generate/route.ts`

**Context:** Add `concept_explainer`, `drill_practice`, `keyword_builder`, and `exam_debrief` generation modes. The first three are targeted at the three error types. `exam_debrief` fetches the linked `AnswerSheet` + `FeedbackAnalysis` and uses the `root_cause_analysis` to generate a personalized debrief.

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

function buildPrompt(type: GenType, context: string, examContext?: string): string {
  const base = `You are an expert tutor for Indian school students (CBSE/ICSE/State Board). Be specific, clear, and encouraging.\n\n`

  switch (type) {
    case "summary":
      return `${base}Summarize these study materials for a student. Focus on key concepts, definitions, and important points.\n\n${context}`

    case "quiz":
      return `${base}Generate a 5-question multiple choice quiz based on these materials. Format as JSON array: [{ "question": "...", "options": ["A", "B", "C", "D"], "answer": "A", "explanation": "..." }]\n\n${context}`

    case "faq":
      return `${base}Generate 5 common exam questions and detailed model answers based on these materials.\n\n${context}`

    case "study_plan":
      return `${base}Create a structured 3-day study plan for this material. Break it into daily topics, practice activities, and revision checkpoints.\n\n${context}`

    case "concept_explainer":
      return `${base}The student made CONCEPT ERRORS in their exam — they don't fully understand the underlying ideas.
Your job: Explain the core concepts in this material clearly.
- Use simple analogies and real-world examples
- Break down complex ideas step by step
- End with 3 "check your understanding" questions
\n\n${context}`

    case "drill_practice":
      return `${base}The student made CALCULATION/PROCEDURAL ERRORS in their exam — they understand concepts but make mistakes in steps.
Your job: Generate 8 practice problems with full step-by-step worked solutions.
- Each problem should isolate one procedural step
- Show every step explicitly — don't skip any
- Highlight the step most students get wrong
\n\n${context}`

    case "keyword_builder":
      return `${base}The student made KEYWORD/EXPRESSION ERRORS — they understand the material but struggle to express it properly in exam answers.
Your job:
1. List 10 key terms/phrases with clear definitions
2. Show 3 examples of weak answers vs strong model answers
3. Provide a "power phrases" list: exam-ready expressions for this topic
\n\n${context}`

    case "exam_debrief":
      return `${base}You are reviewing a student's graded exam to help them improve.

EXAM PERFORMANCE DATA:
${examContext}

STUDY MATERIALS (if any):
${context || "(No additional materials provided)"}

Your task — write a structured debrief:
1. **What you did well** (be specific, cite actual correct answers)
2. **Where you lost marks** (list each gap with the error type: concept/calculation/keyword)
3. **The fix for each gap** (concrete, actionable — what to review or practice)
4. **Your study priority** (rank the gaps from most to least impactful on their score)
5. **One encouraging note** (genuine, not generic)

Be specific. Reference the actual exam topics, not generic advice.`

    default:
      return `${base}Analyze these materials and provide helpful study insights.\n\n${context}`
  }
}

export async function POST(req: Request) {
  try {
    const { type, sourceIds, studentId, sessionId, examContextId } = await req.json()

    // 1. Fetch source materials
    let context = ""
    if (sourceIds && sourceIds.length > 0) {
      const sources = await prisma.studentSource.findMany({
        where: { id: { in: sourceIds }, student_id: studentId },
      })
      context = sources
        .map((s) => `Source: ${s.title}\n${s.ocr_text || "(No text extracted)"}`)
        .join("\n\n---\n\n")
    }

    // 2. Fetch exam context for exam_debrief (and optionally for other modes)
    let examContext = ""
    const contextId = examContextId
    if (contextId) {
      const sheet = await prisma.answerSheet.findUnique({
        where: { id: contextId },
        include: {
          exam: true,
          feedback: true,
        },
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

        examContext = `
Exam: ${examName} (${subject})
Score: ${score}/${totalMarks} (${Math.round((score / totalMarks) * 100)}%)
Error breakdown:
- Concept errors: ${rca.concept || 0}
- Calculation errors: ${rca.calculation || 0}
- Keyword/expression errors: ${rca.keyword || 0}
        `.trim()
      }
    }

    if (!context && !examContext) {
      return NextResponse.json(
        { error: "No source content found" },
        { status: 400 }
      )
    }

    // 3. Build prompt and generate
    const prompt = buildPrompt(type as GenType, context, examContext)
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

**Step 2: Verify**

Test via browser console on `/student/ai-guide`:

```javascript
fetch('/api/ai-guide/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'exam_debrief',
    sourceIds: [],
    studentId: 'your-student-id',
    examContextId: 'an-answer-sheet-id-with-feedback'
  })
}).then(r => r.json()).then(console.log)
```

Expected: `{ result: "## What you did well...\n..." }`

**Step 3: Commit**

```bash
git add app/api/ai-guide/generate/route.ts
git commit -m "feat: add concept_explainer, drill_practice, keyword_builder, exam_debrief generation modes"
```

---

### Task 7: AI Guide Sessions List Page

**Files:**
- Modify: `app/student/ai-guide/page.tsx` (new sessions-list design)
- Create: `components/ai-guide/sessions-list.tsx`

**Context:** Replace the current single-view page with a sessions home that shows all named sessions and a "New Session" button. The old upload/generate UI moves to the session view.

**Step 1: Create `components/ai-guide/sessions-list.tsx`**

```typescript
"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import {
  Brain, Plus, BookOpen, FlaskConical, FileText, Clock,
  Loader2, Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface Session {
  id: string
  title: string
  session_type: string
  error_focus: string | null
  last_active_at: string
  created_at: string
}

const typeIcon = {
  exam_prep: FlaskConical,
  concept_study: Brain,
  note_synthesis: FileText,
  free_study: BookOpen,
}

const typeLabel = {
  exam_prep: "Exam Debrief",
  concept_study: "Concept Study",
  note_synthesis: "Note Synthesis",
  free_study: "Free Study",
}

const errorFocusColor = {
  concept: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  calculation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  keyword: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
}

interface SessionsListProps {
  initialSessions: Session[]
  studentId: string
}

export function SessionsList({ initialSessions, studentId }: SessionsListProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [creating, setCreating] = useState(false)

  const createNewSession = async () => {
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
      {/* New Session CTA */}
      <Button
        variant="liquid"
        className="w-full py-6 text-base gap-2"
        onClick={createNewSession}
        disabled={creating}
      >
        {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        New Study Session
      </Button>

      {/* Sessions Grid */}
      {sessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <Brain size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No sessions yet.</p>
          <p className="text-sm">Start a new session or click "Study This" on any exam.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => {
            const Icon = typeIcon[session.session_type as keyof typeof typeIcon] || BookOpen
            return (
              <GlassCard
                key={session.id}
                hoverEffect
                className="p-5 cursor-pointer group relative"
                onClick={() => router.push(`/student/ai-guide/${session.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    <Icon size={18} />
                  </div>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-all"
                    title="Delete session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <h3 className="font-bold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {session.title}
                </h3>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-muted-foreground bg-secondary/70 px-2 py-0.5 rounded-full">
                    {typeLabel[session.session_type as keyof typeof typeLabel] || "Study"}
                  </span>
                  {session.error_focus && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      errorFocusColor[session.error_focus as keyof typeof errorFocusColor]
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

**Step 2: Update `app/student/ai-guide/page.tsx`**

Full replacement:

```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SessionsList } from "@/components/ai-guide/sessions-list"
import { Brain, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AiGuidePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/sign-in")

  const student = await prisma.student.findUnique({ where: { user_id: user.id } })
  if (!student) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Profile not found</h1>
        <p>Please contact your administrator.</p>
      </div>
    )
  }

  const sessions = await prisma.aiGuideSession.findMany({
    where: { student_id: student.id },
    orderBy: { last_active_at: "desc" },
    select: {
      id: true,
      title: true,
      session_type: true,
      error_focus: true,
      last_active_at: true,
      created_at: true,
    },
  })

  // Serialize dates (Next.js server→client boundary)
  const serialized = sessions.map((s) => ({
    ...s,
    last_active_at: s.last_active_at.toISOString(),
    created_at: s.created_at.toISOString(),
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
          <Sparkles size={12} />
          V2
        </div>
      </div>

      <SessionsList initialSessions={serialized} studentId={student.id} />
    </div>
  )
}
```

**Step 3: Verify**

1. Navigate to `/student/ai-guide` — should show sessions list (empty if fresh)
2. Click "New Study Session" — should redirect to `/student/ai-guide/[id]` (404 for now)
3. Sessions created via "Study This" on dashboard should appear in the list

**Step 4: Commit**

```bash
git add app/student/ai-guide/page.tsx components/ai-guide/sessions-list.tsx
git commit -m "feat: AI Guide sessions list page — named, resumable sessions"
```

---

### Task 8: Session View — 3-Column Layout

**Files:**
- Create: `app/student/ai-guide/[sessionId]/page.tsx`
- Create: `components/ai-guide/session-view.tsx`
- Create: `components/ai-guide/context-panel.tsx`

**Context:** The core AI Guide experience. Three columns: Sources (left), Chat+Generate (center), Context Panel (right — shows the student's error gaps and exam data).

**Step 1: Create `components/ai-guide/context-panel.tsx`**

```typescript
"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Brain, Target, CheckSquare, Square } from "lucide-react"
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
  weakTopics: string[]
}

interface MasteryCheckpoint {
  topic: string
  confidence: "low" | "medium" | "high"
  demonstrated_at: string
}

interface ContextPanelProps {
  errorStats?: ErrorStats
  examContext?: ExamContext
  masteryCheckpoints: MasteryCheckpoint[]
  onToggleMastery: (topic: string) => void
}

const errorColor = {
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
    ? (errorStats.concept + errorStats.calculation + errorStats.keyword) || 1
    : 1

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-1">
      {/* Error Gaps */}
      {errorStats && (
        <GlassCard variant="neu" className="p-4">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Target size={14} className="text-indigo-500" />
            Your Error Gaps
          </h4>
          <div className="space-y-2">
            {(["concept", "calculation", "keyword"] as const).map((type) => (
              <div key={type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize text-muted-foreground">{type}</span>
                  <span className="font-semibold text-foreground">
                    {Math.round((errorStats[type] / total) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", errorColor[type])}
                    style={{ width: `${(errorStats[type] / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Exam Context */}
      {examContext && (
        <GlassCard variant="neu" className="p-4">
          <h4 className="text-sm font-bold text-foreground mb-2">This Exam</h4>
          <p className="text-xs text-muted-foreground mb-1">{examContext.subject}</p>
          <div className="text-2xl font-display font-bold text-foreground mb-1">
            {Math.round((examContext.score / examContext.totalMarks) * 100)}%
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {examContext.score}/{examContext.totalMarks} marks
          </p>
          {examContext.weakTopics.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Weak Topics:</p>
              <div className="flex flex-wrap gap-1">
                {examContext.weakTopics.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Mastery Checklist */}
      {masteryCheckpoints.length > 0 && (
        <GlassCard variant="neu" className="p-4">
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Brain size={14} className="text-indigo-500" />
            Mastery Checklist
          </h4>
          <div className="space-y-2">
            {masteryCheckpoints.map((cp) => (
              <button
                key={cp.topic}
                onClick={() => onToggleMastery(cp.topic)}
                className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
              >
                {cp.confidence === "high" ? (
                  <CheckSquare size={14} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <Square size={14} className="text-muted-foreground flex-shrink-0" />
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

**Step 2: Create `components/ai-guide/session-view.tsx`**

This is the largest component. Create `components/ai-guide/session-view.tsx`:

```typescript
"use client"

import { useState, useRef, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { UploadZone } from "@/components/ai-guide/upload-zone"
import { ContextPanel } from "@/components/ai-guide/context-panel"
import {
  Send, Sparkles, Brain, FileText, Dumbbell,
  Type, ClipboardList, Search, Loader2, Plus,
  CheckSquare, PanelRight, X
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- Types ---
interface Source {
  id: string
  title: string
  type: string
  ocr_text?: string
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
  demonstrated_at: string
}

interface Session {
  id: string
  title: string
  session_type: string
  exam_context_id?: string
  error_focus?: string
  sources_json?: string[]
  chat_history?: Message[]
  generated_outputs?: GeneratedOutput[]
  mastery_checkpoints?: MasteryCheckpoint[]
}

interface ExamContext {
  examName: string
  subject: string
  score: number
  totalMarks: number
  weakTopics: string[]
  errorStats: { concept: number; calculation: number; keyword: number }
}

interface SessionViewProps {
  session: Session
  allSources: Source[]
  studentId: string
  examContext?: ExamContext
}

const GEN_MODES = [
  { id: "concept_explainer", label: "Concept Explainer", icon: Brain, color: "text-purple-500", desc: "Fix concept gaps" },
  { id: "drill_practice", label: "Drill Practice", icon: Dumbbell, color: "text-blue-500", desc: "Step-by-step problems" },
  { id: "keyword_builder", label: "Keyword Builder", icon: Type, color: "text-amber-500", desc: "Exam expressions" },
  { id: "exam_debrief", label: "Exam Debrief", icon: ClipboardList, color: "text-red-500", desc: "Full error analysis" },
  { id: "summary", label: "Summary", icon: FileText, color: "text-teal-500", desc: "Quick overview" },
  { id: "quiz", label: "Quiz Me", icon: Search, color: "text-indigo-500", desc: "Test yourself" },
] as const

export function SessionView({ session, allSources, studentId, examContext }: SessionViewProps) {
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(
    session.sources_json || []
  )
  const [messages, setMessages] = useState<Message[]>(session.chat_history || [])
  const [outputs, setOutputs] = useState<GeneratedOutput[]>(session.generated_outputs || [])
  const [masteryCheckpoints, setMasteryCheckpoints] = useState<MasteryCheckpoint[]>(
    session.mastery_checkpoints || []
  )
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedGenMode, setSelectedGenMode] = useState<string>("exam_debrief")
  const [showContextPanel, setShowContextPanel] = useState(true)
  const [sources, setSources] = useState<Source[]>(allSources)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Persist messages to DB after each exchange
  const persistSession = async (
    updatedMessages: Message[],
    updatedOutputs?: GeneratedOutput[],
    updatedCheckpoints?: MasteryCheckpoint[]
  ) => {
    await fetch(`/api/ai-guide/sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_history: updatedMessages,
        generated_outputs: updatedOutputs ?? outputs,
        mastery_checkpoints: updatedCheckpoints ?? masteryCheckpoints,
        sources_json: selectedSourceIds,
      }),
    })
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const userMsg: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setIsStreaming(true)

    // Optimistic assistant placeholder
    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    }
    setMessages([...newMessages, assistantMsg])

    try {
      const res = await fetch("/api/ai-guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          sourceIds: selectedSourceIds,
          studentId,
          examContextId: session.exam_context_id,
        }),
      })

      if (!res.body) throw new Error("No stream")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // Vercel AI SDK streams in "0:text" format
        const textChunks = chunk
          .split("\n")
          .filter((l) => l.startsWith("0:"))
          .map((l) => {
            try { return JSON.parse(l.slice(2)) } catch { return "" }
          })
          .join("")
        fullText += textChunks
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...assistantMsg, content: fullText }
          return updated
        })
      }

      const finalMessages = [
        ...newMessages,
        { ...assistantMsg, content: fullText },
      ]
      setMessages(finalMessages)
      await persistSession(finalMessages)
    } catch (err) {
      console.error(err)
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...assistantMsg,
          content: "Sorry, there was an error. Please try again.",
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const generate = async (mode: string) => {
    if (selectedSourceIds.length === 0 && !session.exam_context_id) return
    setIsGenerating(true)

    try {
      const res = await fetch("/api/ai-guide/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          sourceIds: selectedSourceIds,
          studentId,
          sessionId: session.id,
          examContextId: session.exam_context_id,
        }),
      })
      const data = await res.json()
      const newOutput: GeneratedOutput = {
        type: mode,
        content: data.result,
        saved: false,
        created_at: new Date().toISOString(),
      }
      const updatedOutputs = [...outputs, newOutput]
      setOutputs(updatedOutputs)
      await persistSession(messages, updatedOutputs)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleMastery = async (topic: string) => {
    const updated = masteryCheckpoints.map((cp) =>
      cp.topic === topic
        ? {
            ...cp,
            confidence: cp.confidence === "high" ? ("low" as const) : ("high" as const),
            demonstrated_at: new Date().toISOString(),
          }
        : cp
    )
    setMasteryCheckpoints(updated)
    await persistSession(messages, outputs, updated)
  }

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* LEFT: Sources Panel */}
      <div className="w-56 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Sources
        </p>
        {sources.map((source) => (
          <button
            key={source.id}
            onClick={() => toggleSource(source.id)}
            className={cn(
              "w-full text-left p-3 rounded-xl border text-xs transition-all",
              selectedSourceIds.includes(source.id)
                ? "bg-indigo-50 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300"
                : "bg-secondary/50 border-transparent hover:border-border text-foreground"
            )}
          >
            <FileText size={12} className="mb-1 opacity-60" />
            <p className="font-semibold line-clamp-2">{source.title}</p>
            <p className="text-muted-foreground mt-0.5 capitalize">{source.type}</p>
          </button>
        ))}
        <UploadZone
          studentId={studentId}
          onUploadComplete={(newSource: Source) => setSources((prev) => [newSource, ...prev])}
          compact
        />
      </div>

      {/* CENTER: Chat + Generate */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Generation mode buttons */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {GEN_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSelectedGenMode(mode.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                selectedGenMode === mode.id
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground"
              )}
            >
              <mode.icon size={12} className={selectedGenMode === mode.id ? "text-primary" : mode.color} />
              {mode.label}
            </button>
          ))}
          <Button
            variant="liquid"
            size="sm"
            className="flex-shrink-0 gap-1 text-xs"
            onClick={() => generate(selectedGenMode)}
            disabled={isGenerating || (selectedSourceIds.length === 0 && !session.exam_context_id)}
          >
            {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            Generate
          </Button>
        </div>

        {/* Chat messages + generated outputs */}
        <GlassCard className="flex-1 overflow-y-auto p-4 space-y-4 mb-3">
          {messages.length === 0 && outputs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Sparkles size={40} className="mb-3 opacity-30" />
              {session.session_type === "exam_prep" ? (
                <>
                  <p className="font-semibold">Exam Debrief ready.</p>
                  <p className="text-sm mt-1">Click "Exam Debrief" above or ask a question to start.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">Select sources and start studying.</p>
                  <p className="text-sm mt-1">Generate content or chat with your materials.</p>
                </>
              )}
            </div>
          )}

          {/* Generated Outputs */}
          {outputs.map((output, i) => (
            <GlassCard key={i} variant="neu" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {output.type.replace(/_/g, " ")}
                </span>
              </div>
              <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {output.content}
              </div>
            </GlassCard>
          ))}

          {/* Chat Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </GlassCard>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask a question about your materials..."
            className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            variant="liquid"
            size="icon"
            className="h-12 w-12 rounded-xl"
          >
            {isStreaming ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
      </div>

      {/* RIGHT: Context Panel */}
      {showContextPanel && (
        <div className="w-52 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Context
            </p>
            <button
              onClick={() => setShowContextPanel(false)}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <X size={12} />
            </button>
          </div>
          <ContextPanel
            errorStats={examContext?.errorStats}
            examContext={examContext}
            masteryCheckpoints={masteryCheckpoints}
            onToggleMastery={toggleMastery}
          />
        </div>
      )}

      {!showContextPanel && (
        <button
          onClick={() => setShowContextPanel(true)}
          className="flex-shrink-0 self-start mt-8 p-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-muted-foreground"
          title="Show context panel"
        >
          <PanelRight size={16} />
        </button>
      )}
    </div>
  )
}
```

**Step 3: Create `app/student/ai-guide/[sessionId]/page.tsx`**

```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SessionView } from "@/components/ai-guide/session-view"
import { Brain, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SessionPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/sign-in")

  const student = await prisma.student.findUnique({ where: { user_id: user.id } })
  if (!student) redirect("/auth/sign-in")

  const session = await prisma.aiGuideSession.findUnique({
    where: { id: params.sessionId },
  })

  if (!session || session.student_id !== student.id) notFound()

  // Fetch all student sources for the source picker
  const allSources = await prisma.studentSource.findMany({
    where: { student_id: student.id },
    orderBy: { created_at: "desc" },
    select: { id: true, title: true, type: true, ocr_text: true, created_at: true },
  })

  // Fetch exam context if this is an exam_prep session
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
        weakTopics: [] as string[],
        errorStats: {
          concept: Number(rca.concept || 0),
          calculation: Number(rca.calculation || 0),
          keyword: Number(rca.keyword || 0),
        },
      }
    }
  }

  // Serialize for client boundary
  const serializedSession = {
    ...session,
    last_active_at: session.last_active_at.toISOString(),
    created_at: session.created_at.toISOString(),
    updated_at: session.updated_at.toISOString(),
    sources_json: (session.sources_json as string[]) || [],
    chat_history: (session.chat_history as any[]) || [],
    generated_outputs: (session.generated_outputs as any[]) || [],
    mastery_checkpoints: (session.mastery_checkpoints as any[]) || [],
  }
  const serializedSources = allSources.map((s) => ({
    ...s,
    created_at: s.created_at.toISOString(),
  }))

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link
          href="/student/ai-guide"
          className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <Brain size={20} className="text-indigo-500" />
        <h1 className="text-xl font-display font-bold text-foreground line-clamp-1">
          {session.title}
        </h1>
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

**Step 4: Fix the UploadZone to accept a `compact` prop**

Open `components/ai-guide/upload-zone.tsx` and add `compact?: boolean` to the props interface. When `compact` is true, render a smaller button-style dropzone instead of the full panel.

**Step 5: Verify the full flow**

1. Go to `/student/dashboard` → click "Study This" on an exam card
2. Should redirect to `/student/ai-guide/[id]` with the 3-column layout
3. Click "Exam Debrief" + "Generate" — should show the debrief content
4. Type a message and press Enter — should stream a response
5. Navigate away, come back — chat history should be preserved

**Step 6: Commit**

```bash
git add app/student/ai-guide/ components/ai-guide/
git commit -m "feat: 3-column session view with Context Panel, persistent chat, Exam Debrief"
```

---

## Phase 3 — Dashboard Intelligence

---

### Task 9: AI Daily Brief

**Files:**
- Create: `app/api/ai-guide/daily-brief/route.ts`
- Create: `components/dashboard/ai-daily-brief.tsx`
- Modify: `app/student/dashboard/page.tsx`

**Context:** A 2–3 sentence AI-generated personalized message shown at the top of the dashboard. Pulls the student's most recent error patterns and upcoming exams. Replaces the static hero card text.

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
    // Fetch last 3 graded exams
    const recentSheets = await prisma.answerSheet.findMany({
      where: { student_id: studentId, status: "approved" },
      include: { exam: true, feedback: true },
      orderBy: { created_at: "desc" },
      take: 3,
    })

    // Aggregate error types
    let conceptTotal = 0, calcTotal = 0, keywordTotal = 0
    for (const sheet of recentSheets) {
      const rca = (sheet.feedback?.[0]?.root_cause_analysis as Record<string, number>) || {}
      conceptTotal += Number(rca.concept || 0)
      calcTotal += Number(rca.calculation || 0)
      keywordTotal += Number(rca.keyword || 0)
    }

    // Fetch upcoming exams (next 7 days)
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true, class: true, streak: true },
    })

    const upcomingExams = await prisma.$queryRaw<{ exam_name: string; exam_date: Date }[]>`
      SELECT exam_name, exam_date FROM exams
      WHERE class = ${student?.class}
      AND exam_date >= NOW()
      AND exam_date <= NOW() + INTERVAL '7 days'
      ORDER BY exam_date ASC
      LIMIT 2
    `

    if (recentSheets.length === 0) {
      return NextResponse.json({
        brief: "Welcome! Once your teacher grades your first exam, I'll give you a personalized study plan here.",
      })
    }

    const dominantError =
      conceptTotal >= calcTotal && conceptTotal >= keywordTotal
        ? "concept understanding"
        : calcTotal >= keywordTotal
        ? "calculation steps"
        : "exam expression and keywords"

    const upcomingText =
      upcomingExams.length > 0
        ? ` Your ${upcomingExams[0].exam_name} is coming up soon.`
        : ""

    const prompt = `Write a 2-sentence motivating daily study brief for a student.
Facts:
- Most recent exams show the student struggles most with: ${dominantError}
- Streak: ${student?.streak || 0} days${upcomingText}
- Total error counts: concept=${conceptTotal}, calculation=${calcTotal}, keyword=${keywordTotal}

Rules:
- Be specific about the error type, not generic
- Mention what to do (e.g., "open your AI Guide", "try Drill Practice mode")
- Sound like a supportive mentor, not a robot
- Maximum 2 sentences`

    const result = await model.generateContent(prompt)
    const brief = result.response.text().trim()

    return NextResponse.json({ brief })
  } catch (err) {
    console.error("Daily brief error:", err)
    return NextResponse.json({ brief: null })
  }
}
```

**Step 2: Create `components/dashboard/ai-daily-brief.tsx`**

```typescript
"use client"

import { useEffect, useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"

interface AiDailyBriefProps {
  studentId: string
}

export function AiDailyBrief({ studentId }: AiDailyBriefProps) {
  const [brief, setBrief] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/ai-guide/daily-brief?studentId=${studentId}`)
      .then((r) => r.json())
      .then((d) => {
        setBrief(d.brief)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [studentId])

  if (!loading && !brief) return null

  return (
    <GlassCard variant="liquid" gradientColor="purple" className="p-5 flex items-start gap-3">
      <div className="p-2 rounded-xl bg-white/20 flex-shrink-0">
        {loading ? (
          <Loader2 size={16} className="text-white animate-spin" />
        ) : (
          <Sparkles size={16} className="text-white" />
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-1">
          Today's Focus
        </p>
        {loading ? (
          <div className="h-4 w-64 bg-white/20 rounded animate-pulse" />
        ) : (
          <p className="text-white text-sm font-medium leading-relaxed">{brief}</p>
        )}
      </div>
    </GlassCard>
  )
}
```

**Step 3: Add `AiDailyBrief` to the dashboard**

In `app/student/dashboard/page.tsx`, add the import and insert the component right after the header section:

```typescript
// Add import
import { AiDailyBrief } from "@/components/dashboard/ai-daily-brief"

// Add after the header div (before the grid):
<AiDailyBrief studentId={student.id} />
```

**Step 4: Verify**

Open the student dashboard — should see the AI Daily Brief card load within 2–3 seconds with a personalized message. If no exams are graded, shows the welcome message.

**Step 5: Commit**

```bash
git add app/api/ai-guide/daily-brief/ components/dashboard/ai-daily-brief.tsx app/student/dashboard/page.tsx
git commit -m "feat: AI Daily Brief — personalized study focus on dashboard"
```

---

### Task 10: Active Sessions Widget on Dashboard

**Files:**
- Create: `components/dashboard/active-sessions-widget.tsx`
- Modify: `app/student/dashboard/page.tsx`

**Step 1: Create `components/dashboard/active-sessions-widget.tsx`**

```typescript
import { GlassCard } from "@/components/ui/glass-card"
import { Brain, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Session {
  id: string
  title: string
  session_type: string
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
      <div className="space-y-3">
        {sessions.slice(0, 3).map((session) => (
          <Link key={session.id} href={`/student/ai-guide/${session.id}`}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-transparent hover:border-border hover:bg-secondary transition-all group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {session.title}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true })}
                </p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
      {sessions.length > 3 && (
        <Link href="/student/ai-guide" className="block text-center text-xs text-primary font-medium mt-3 hover:underline">
          View all {sessions.length} sessions
        </Link>
      )}
    </GlassCard>
  )
}
```

**Step 2: Add to dashboard**

In `app/student/dashboard/page.tsx`, add a query for recent sessions and the widget:

```typescript
// Add import
import { ActiveSessionsWidget } from "@/components/dashboard/active-sessions-widget"

// Add query after the upcomingExams query:
const recentSessions = await prisma.aiGuideSession.findMany({
  where: { student_id: student.id },
  orderBy: { last_active_at: "desc" },
  take: 5,
  select: { id: true, title: true, session_type: true, last_active_at: true },
})

// Add in the right sidebar, before MarkRecoveryWidget:
<ActiveSessionsWidget sessions={recentSessions} />
```

**Step 3: Commit**

```bash
git add components/dashboard/active-sessions-widget.tsx app/student/dashboard/page.tsx
git commit -m "feat: Active Sessions widget on dashboard — resume named AI Guide sessions"
```

---

### Task 11: Recovery Radar — Interactive Donut Chart

**Files:**
- Modify: `components/dashboard/mark-recovery-widget.tsx`

**Context:** Replace the existing bar-style widget with an interactive Recharts PieChart showing concept/calculation/keyword proportions. Tapping a segment pre-fills the session type for a new AI Guide session.

**Step 1: Read the current widget first**

Check what's in `components/dashboard/mark-recovery-widget.tsx` and replace it:

```typescript
"use client"

import { useRouter } from "next/navigation"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { GlassCard } from "@/components/ui/glass-card"
import { Target } from "lucide-react"

interface RecoveryStats {
  concept: number
  calculation: number
  keyword: number
}

const COLORS = {
  concept: "#8b5cf6",      // purple
  calculation: "#3b82f6",  // blue
  keyword: "#f59e0b",      // amber
}

const ERROR_LABEL = {
  concept: "Concept",
  calculation: "Calculation",
  keyword: "Keyword",
}

interface MarkRecoveryWidgetProps {
  stats: RecoveryStats
  studentId: string
}

export function MarkRecoveryWidget({ stats, studentId }: MarkRecoveryWidgetProps) {
  const router = useRouter()
  const total = (stats.concept + stats.calculation + stats.keyword) || 1

  const data = [
    { name: "concept", value: stats.concept, label: "Concept", color: COLORS.concept },
    { name: "calculation", value: stats.calculation, label: "Calculation", color: COLORS.calculation },
    { name: "keyword", value: stats.keyword, label: "Keyword", color: COLORS.keyword },
  ].filter((d) => d.value > 0)

  const handleSegmentClick = async (entry: { name: string }) => {
    // Create a new AI Guide session pre-focused on this error type
    const res = await fetch("/api/ai-guide/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        sessionType: "concept_study",
        errorFocus: entry.name,
        title: `${ERROR_LABEL[entry.name as keyof typeof ERROR_LABEL]} Error Recovery`,
      }),
    })
    const { session } = await res.json()
    router.push(`/student/ai-guide/${session.id}`)
  }

  if (total === 1) {
    return (
      <GlassCard variant="neu" className="p-6">
        <h3 className="text-lg font-display font-bold text-foreground mb-2 flex items-center gap-2">
          <Target className="text-indigo-500" size={20} />
          Mark Recovery
        </h3>
        <p className="text-sm text-muted-foreground">No error data yet. Complete an exam to see your gaps.</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="neu" className="p-6">
      <h3 className="text-lg font-display font-bold text-foreground mb-1 flex items-center gap-2">
        <Target className="text-indigo-500" size={20} />
        Mark Recovery
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Tap a segment to study that error type</p>

      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
            onClick={handleSegmentClick}
            className="cursor-pointer"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `${Math.round((value / total) * 100)}%`,
              "",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-4 mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {entry.label}: {Math.round((entry.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
```

**Step 2: Update dashboard call to pass `studentId`**

In `app/student/dashboard/page.tsx`, update the MarkRecoveryWidget call:

```typescript
// Before:
<MarkRecoveryWidget stats={recoveryStats} />
// After:
<MarkRecoveryWidget stats={recoveryStats} studentId={student.id} />
```

**Step 3: Commit**

```bash
git add components/dashboard/mark-recovery-widget.tsx app/student/dashboard/page.tsx
git commit -m "feat: Recovery Radar — interactive donut chart, tap to start error-focused AI Guide session"
```

---

## Phase 4 — Analytics + Metacognition

---

### Task 12: Error Trend Chart

**Files:**
- Create: `components/student/error-trend-chart.tsx`
- Modify: `app/student/performance/page.tsx`

**Context:** A stacked area chart showing how the student's concept/calculation/keyword error proportions have changed across exams over time. More actionable than a raw score line.

**Step 1: Create `components/student/error-trend-chart.tsx`**

```typescript
"use client"

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts"
import { GlassCard } from "@/components/ui/glass-card"
import { TrendingUp } from "lucide-react"

interface ErrorDataPoint {
  examName: string
  date: string
  concept: number
  calculation: number
  keyword: number
}

export function ErrorTrendChart({ data }: { data: ErrorDataPoint[] }) {
  if (data.length < 2) {
    return (
      <GlassCard variant="neu" className="p-6">
        <h3 className="text-lg font-display font-bold flex items-center gap-2 mb-2">
          <TrendingUp size={20} className="text-indigo-500" />
          Error Trend
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
        <TrendingUp size={20} className="text-indigo-500" />
        Error Trend Over Time
      </h3>
      <p className="text-xs text-muted-foreground mb-6">
        Watch your error types shift as you study. Falling lines = improving.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="concept" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="calculation" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="keyword" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="examName"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />
          <Legend iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="concept" name="Concept" stroke="#8b5cf6" fill="url(#concept)" strokeWidth={2} />
          <Area type="monotone" dataKey="calculation" name="Calculation" stroke="#3b82f6" fill="url(#calculation)" strokeWidth={2} />
          <Area type="monotone" dataKey="keyword" name="Keyword" stroke="#f59e0b" fill="url(#keyword)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
```

**Step 2: Add to performance page**

Read `app/student/performance/page.tsx`, find the data-fetching section, add error trend data:

```typescript
// Add import
import { ErrorTrendChart } from "@/components/student/error-trend-chart"

// In the data-fetching (add after recentExams fetch):
const errorTrendData = (recentExams || [])
  .filter((sheet: any) => sheet.feedback_analysis?.length > 0)
  .map((sheet: any) => {
    const fb = sheet.feedback_analysis[0]
    const rca = (fb?.root_cause_analysis as Record<string, number>) || {}
    return {
      examName: (fb?.exam_name || "Exam").slice(0, 12),
      date: sheet.created_at,
      concept: Number(rca.concept || 0),
      calculation: Number(rca.calculation || 0),
      keyword: Number(rca.keyword || 0),
    }
  })
  .reverse() // oldest first for chronological trend

// Add component in JSX (in the charts section):
<ErrorTrendChart data={errorTrendData} />
```

**Step 3: Commit**

```bash
git add components/student/error-trend-chart.tsx app/student/performance/page.tsx
git commit -m "feat: Error Trend Chart — stacked area showing concept/calc/keyword errors over time"
```

---

### Task 13: Self-Assessment — Pre-Exam Confidence Prompt

**Files:**
- Create: `app/api/student/self-assessment/route.ts`
- Create: `components/student/self-assessment-prompt.tsx`
- Modify: `app/student/dashboard/page.tsx`

**Context:** When an exam is ≤7 days away, prompt the student to rate their confidence per topic (1–5). After the exam is graded, compare to actual result. Stored in `self_assessments`.

**Step 1: Create `app/api/student/self-assessment/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST — save self-assessment before exam
export async function POST(req: Request) {
  try {
    const { studentId, examId, topics } = await req.json()
    // topics: [{ name: string, confidence: 1-5 }]

    if (!studentId || !examId || !topics) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Check if one already exists for this exam
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
    console.error(err)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
```

**Step 2: Create `components/student/self-assessment-prompt.tsx`**

```typescript
"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Brain, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Topic {
  name: string
}

interface SelfAssessmentPromptProps {
  examId: string
  examName: string
  studentId: string
  subjects: Topic[]
}

export function SelfAssessmentPrompt({
  examId,
  examName,
  studentId,
  subjects,
}: SelfAssessmentPromptProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const allRated = subjects.every((s) => ratings[s.name])

  const submit = async () => {
    if (!allRated) return
    setLoading(true)
    const topics = subjects.map((s) => ({ name: s.name, confidence: ratings[s.name] }))
    await fetch("/api/student/self-assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, examId, topics }),
    })
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <GlassCard variant="neu" className="p-4 flex items-center gap-3">
        <CheckCircle size={18} className="text-emerald-500" />
        <p className="text-sm font-medium text-foreground">
          Self-assessment saved! We'll compare this to your actual result after grading.
        </p>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="neu" className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
          <Brain size={16} />
        </div>
        <div>
          <p className="font-bold text-foreground text-sm">
            Exam coming up: {examName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            How confident are you in each topic? (1 = not at all, 5 = very confident)
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {subjects.map((subject) => (
          <div key={subject.name} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{subject.name}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRatings((prev) => ({ ...prev, [subject.name]: n }))}
                  className={cn(
                    "w-7 h-7 rounded-lg text-xs font-bold transition-all",
                    ratings[subject.name] === n
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

      <Button
        variant="liquid"
        size="sm"
        className="w-full"
        onClick={submit}
        disabled={!allRated || loading}
      >
        Save My Assessment
      </Button>
    </GlassCard>
  )
}
```

**Step 3: Add to dashboard**

In `app/student/dashboard/page.tsx`, check if any upcoming exam is ≤7 days away and render the prompt for the first one. Determine subjects from the exam or use a sensible default:

```typescript
import { SelfAssessmentPrompt } from "@/components/student/self-assessment-prompt"

// In the JSX, in the right sidebar after ActiveSessionsWidget:
{upcomingExams && upcomingExams.length > 0 && (() => {
  const soonExam = upcomingExams[0] as any
  const daysUntil = Math.ceil(
    (new Date(soonExam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntil <= 7) {
    return (
      <SelfAssessmentPrompt
        examId={soonExam.id}
        examName={soonExam.exam_name}
        studentId={student.id}
        subjects={[{ name: soonExam.subject || "General" }]}
      />
    )
  }
  return null
})()}
```

**Step 4: Commit**

```bash
git add app/api/student/self-assessment/ components/student/self-assessment-prompt.tsx app/student/dashboard/page.tsx
git commit -m "feat: self-assessment prompt for upcoming exams — builds metacognitive awareness"
```

---

### Task 14: Final Integration Check

**Files:** Read-only verification pass

**Step 1: Run the dev server and do a full walkthrough**

```bash
npm run dev
```

Walk through this entire checklist:

- [ ] `/student/dashboard` loads — AI Daily Brief appears within 3s
- [ ] "Study This" on an exam card → creates session → redirects to 3-column view
- [ ] 3-column session view: sources panel loads, context panel shows error stats
- [ ] "Exam Debrief" mode → Generate → shows personalized debrief with error analysis
- [ ] Chat works — type a question, press Enter, AI streams a response
- [ ] Navigate away from session, come back → chat history is preserved
- [ ] `/student/ai-guide` shows sessions list with the created session
- [ ] "New Study Session" creates a blank session and navigates to it
- [ ] Recovery Radar shows donut chart, tapping a segment creates a new session
- [ ] Active Sessions widget shows recent sessions on dashboard
- [ ] Self-Assessment prompt appears when an exam is ≤7 days away
- [ ] `/student/performance` shows the Error Trend Chart
- [ ] Uploading a file → OCR text appears in the source (check in Supabase)

**Step 2: Fix any issues found**

Use the systematic-debugging skill if any step fails.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: MARK AI V2 — AI Guide sessions, Exam Debrief, Sarvam OCR, dashboard intelligence"
```

---

## Summary of All Files Changed

| Phase | Files Created | Files Modified |
|---|---|---|
| 1 | `lib/sarvam-ocr.ts`, `app/api/ai-guide/sessions/route.ts`, `app/api/ai-guide/sessions/[id]/route.ts` | `prisma/schema.prisma`, `app/api/uploads/student-sources/route.ts` |
| 2 | `components/student/study-this-button.tsx`, `components/ai-guide/sessions-list.tsx`, `components/ai-guide/session-view.tsx`, `components/ai-guide/context-panel.tsx`, `app/student/ai-guide/[sessionId]/page.tsx` | `app/api/ai-guide/generate/route.ts`, `app/student/ai-guide/page.tsx`, `app/student/dashboard/page.tsx` |
| 3 | `app/api/ai-guide/daily-brief/route.ts`, `components/dashboard/ai-daily-brief.tsx`, `components/dashboard/active-sessions-widget.tsx` | `components/dashboard/mark-recovery-widget.tsx`, `app/student/dashboard/page.tsx` |
| 4 | `components/student/error-trend-chart.tsx`, `app/api/student/self-assessment/route.ts`, `components/student/self-assessment-prompt.tsx` | `app/student/performance/page.tsx`, `app/student/dashboard/page.tsx` |

## Environment Variables Required

```
GOOGLE_API_KEY=           # Already exists (Gemini)
SARVAM_API_KEY=           # New — get from sarvam.ai
DATABASE_URL=             # Already exists (Supabase)
DIRECT_URL=               # Already exists
NEXT_PUBLIC_SUPABASE_URL= # Already exists
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Already exists
```
