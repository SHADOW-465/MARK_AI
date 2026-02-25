# MARK AI — Student Dashboard + AI Guide V2 Design

**Date**: 2026-02-25
**Status**: Approved
**Approach**: Complete & Connect — wire the grading→learning pipeline as the core design thesis
**Version Target**: V2.0

---

## 1. Executive Summary

MARK AI's unique advantage over every competitor (Vedantu, BYJU'S, Khan Academy, Gradescope, NotebookLM, Doubtnut, Unacademy, Turnitin) is that it holds both grading data AND a learning guide in one platform. No competitor bridges these two. This design makes the grading→learning pipeline the engine of everything.

The core loop:
```
Exam graded → Error analysis captured → AI Guide knows exactly what to fix →
Student studies with full context → Next exam performance improves → Loop
```

### Market Gaps This Design Solves

From research across 17 platforms:

| Gap | How This Design Addresses It |
|---|---|
| No platform connects grading to learning | Exam Debrief flow + "Study This" button |
| No error-type diagnosis with type-specific remediation | Concept Explainer, Drill Practice, Keyword Builder modes |
| No handwriting support for Indian scripts | Sarvam AI OCR integration |
| No AI feedback in Indian regional languages | Sarvam AI + multi-language Gemini prompts |
| AI Guide sessions not persisted | Named, resumable sessions with full chat history |
| No metacognitive development | Self-Assessment + Study Intelligence Score |
| OCR pipeline is a placeholder | Real OCR via Sarvam AI (Indian) + pdf-parse (English) |

---

## 2. Core Philosophy: Three Error Types as First-Class Citizens

MARK AI already captures `root_cause_analysis` JSON with three error types per exam. V2 makes these the foundation of all personalized learning.

| Error Type | Meaning | AI Guide Prescription |
|---|---|---|
| **Concept error** | Student doesn't understand the underlying idea | Concept Explainer mode + Q&A |
| **Calculation error** | Student understands but makes procedural mistakes | Drill Practice mode + worked examples |
| **Keyword error** | Student understands but can't express it properly | Keyword Builder mode + model answer comparison |

---

## 3. Student Dashboard Redesign

### Layout: Three Zones

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Name, Streak, Level, XP bar                            │
├──────────────────────────────┬──────────────────────────────────┤
│                              │                                  │
│   ZONE A: FOCUS (60%)        │   ZONE B: SNAPSHOT (40%)         │
│                              │                                  │
│  AI DAILY BRIEF              │  RECOVERY RADAR                  │
│  (2-3 sentence personalized  │  (Concept / Calc / Keyword       │
│   message from AI based on   │   donut chart — tappable to      │
│   errors + upcoming exams)   │   filter AI Guide sessions)      │
│                              │                                  │
│  RECENT RESULTS              │  UPCOMING EXAMS + countdown      │
│  (last 3 exams, each with    │                                  │
│   "Study This" → AI Guide)   │  ACTIVE AI GUIDE SESSIONS        │
│                              │  (resume named sessions)         │
│  TODAY'S MISSIONS            │                                  │
│  (AI-generated, 2-3 tasks)   │                                  │
├──────────────────────────────┴──────────────────────────────────┤
│  QUICK ACTIONS: [Open AI Guide] [Flashcards] [Vault] [Planner]  │
└─────────────────────────────────────────────────────────────────┘
```

### New Dashboard Components

**AI Daily Brief**
- Lightweight Gemini call on each dashboard load
- Inputs: last 3 exam error types, streak, upcoming exam dates, active session count
- Output example: "You made 4 concept errors in Physics last week, mostly in Optics. Your exam is on Friday. Open your AI Guide to work through them."
- Tap → opens AI Guide session pre-loaded with that exam's context

**Recovery Radar**
- Replace static bar chart with interactive donut: concept / calculation / keyword proportions
- Tapping any segment pre-filters a new AI Guide session to that error type

**Active AI Guide Sessions**
- Cards showing open, named sessions with last active timestamp
- Tap to resume (full chat history restored)

**Recent Results → AI Guide Bridge**
- Each exam card has a "Study This" button
- Tap → creates Exam Debrief session in AI Guide with that exam pre-loaded

**Today's Missions (AI-generated)**
- AI suggests 2–3 focused tasks based on error patterns and upcoming exams
- Example: "Review Snell's Law (concept error, Physics exam Friday)"
- Manual task creation still available

---

## 4. AI Guide V2 — Complete Design

### Information Architecture

```
/student/ai-guide
├── Sessions List (home)         — named, resumable sessions
├── /[sessionId]                 — single session view (3-column)
└── /new                         — session creation wizard
```

### Session Data Model

```typescript
AiGuideSession {
  id: String
  student_id: String
  title: String                  // "Physics Ch7 Prep" (AI-generated or student-named)
  session_type: String           // 'exam_prep' | 'concept_study' | 'note_synthesis' | 'free_study'
  exam_context_id: String?       // FK to AnswerSheet (for exam_prep sessions)
  error_focus: String?           // 'concept' | 'calculation' | 'keyword' | null
  sources_json: Json             // Array of StudentSource IDs
  chat_history: Json             // [{ role: 'user'|'assistant', content, timestamp }]
  generated_outputs: Json        // [{ type, content, saved: bool, created_at }]
  mastery_checkpoints: Json?     // [{ topic, confidence: 'low'|'medium'|'high', demonstrated_at }]
  last_active_at: DateTime       // For sorting/resuming
  created_at: DateTime
  updated_at: DateTime
}
```

### Session View Layout (3-column)

```
┌──────────────┬──────────────────────────────┬───────────────────┐
│ SOURCES (25%)│ CHAT / OUTPUT (50%)           │ CONTEXT (25%)     │
│              │                               │                   │
│ Checkboxes:  │ AI message (cites sources     │ YOUR ERROR GAPS   │
│ [✓] PDF Notes│ with [[Source]] notation)     │ Concept: 55%      │
│ [✓] May Exam │                               │ Calc: 30%         │
│ [✓] Teacher  │ Student message               │ Keyword: 15%      │
│    Key       │                               │                   │
│              │ ...streaming response...      │ THIS EXAM         │
│ + Add Sources│                               │ Physics: 68%      │
│              ├───────────────────────────────│ Lost: refraction  │
│ GENERATE     │ [Concept Explainer]           │                   │
│ Save Session │ [Drill Practice]              │ MASTERY CHECKLIST │
│              │ [Keyword Builder]             │ □ Snell's Law     │
│              │ [Mastery Quiz]                │ □ Refraction      │
│              │ [Exam Debrief]                │ □ Total IR        │
│              │                               │                   │
│              │ [Type question...] ►          │ [Review Flashcards│
│              │                               │  12 due today]    │
└──────────────┴──────────────────────────────┴───────────────────┘
```

### Source Types

| Source Type | V1 | V2 |
|---|---|---|
| Student upload (PDF, txt, doc, image) | ✅ (no OCR) | ✅ with real OCR |
| Graded exam (auto-import) | ❌ | ✅ pulls score + error analysis |
| Teacher-shared resource (answer key, past paper) | ❌ | ✅ |
| Flashcard deck | ❌ | ✅ |
| Web URL | ❌ | V3 |

### Generation Modes (5 modes, 3 are new)

| Mode | Purpose | Solves |
|---|---|---|
| **Concept Explainer** *(new)* | Deep explanation with examples + analogies | Concept errors |
| **Drill Practice** *(new)* | 10 step-by-step worked examples of the exact error pattern | Calculation errors |
| **Keyword Builder** *(new)* | Vocabulary list, model answer comparisons, phrasing guide | Keyword errors |
| **Mastery Quiz** *(enhanced)* | 5–10 questions on the specific topics student lost marks on | All types |
| **Exam Debrief** *(new)* | Full analysis of one graded exam: what went wrong, why, what to do | All types |
| Summary | Concise overview | General study |
| Study Plan | Structured learning plan | General study |

### The Exam Debrief Flow (Core Differentiator)

When student taps "Study This" on any graded exam:

1. System creates `AiGuideSession` with `session_type: 'exam_prep'`, `exam_context_id` → AnswerSheet ID
2. AI Guide fetches: exam name, total marks, student score, `root_cause_analysis`, all `FeedbackAnalysis` records
3. AI generates opening: "You scored 68% on Physics. You made 4 concept errors (refraction, lenses), 2 calculation errors (Snell's Law), 1 keyword error. Let's fix these one by one. Where do you want to start?"
4. Student chats, picks a generation mode, or lets AI guide the sequence
5. Flashcards generated are tagged with exam ID and error type
6. Session saves continuously — fully resumable

**This flow exists nowhere in the current market.**

---

## 5. OCR Pipeline — Sarvam AI + Gemini

### Pipeline Design

```
File uploaded → Supabase Storage →
  Detect content type:
    ├── Handwritten OR Indian script (Hindi/Tamil/Telugu/etc.)
    │   → Sarvam AI OCR API
    │     (specialized for Indian language handwriting)
    │
    ├── English printed PDF / typed document
    │   → pdf-parse (existing library)
    │
    └── Diagram / mixed / ambiguous
        → Gemini Vision (multimodal understanding)

  → Combine extracted text
  → Store in StudentSource.ocr_text
  → Mark source as ready for AI Guide
```

### Why Sarvam AI

Sarvam AI's models are purpose-built for Indian language recognition including handwritten Devanagari, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati. General-purpose vision models (Gemini, GPT-4V) perform significantly worse on regional scripts and cursive handwriting. This is the largest unserved gap in the Indian edtech OCR market.

### Supported Input Formats After V2

- PDF (printed) — pdf-parse
- PDF (handwritten, Indian scripts) — Sarvam AI
- Image/photo (JPEG, PNG, WEBP) — Sarvam AI or Gemini Vision
- TXT, MD, DOCX — direct text extraction
- Teacher-shared resources — same pipeline

---

## 6. Metacognitive Layer

### Study Intelligence Score

A per-student score (0–100) computed from:
- Error type distribution trending over time (are concept errors decreasing?)
- Session consistency (regular study > cramming)
- Flashcard mastery progression (cards moving up levels)
- Self-assessment accuracy (do predictions match actual results?)

Displayed on dashboard with plain language: "Your Study Intelligence is 72. Your self-assessments are becoming more accurate — you're getting better at knowing what you know."

### Self-Assessment Before Each Exam

When upcoming exam is ≤ 7 days away, dashboard surfaces:
"Before your Physics exam, how confident do you feel about each topic? (rate 1–5)"

After grading, MARK AI compares prediction to actual result. Over time this trains metacognitive accuracy and the gap becomes a metric students actively try to close.

### Data Fields (additions to Student table)

```typescript
study_intelligence_score: Int?         // 0-100, computed periodically
last_self_assessment: Json?            // { exam_id, topics: [{ name, confidence }] }
prediction_accuracy_history: Json?     // [{ exam_id, predicted_avg, actual_avg, delta }]
```

---

## 7. Analytics Enhancement

### Error Trend Chart (new)

Stacked area chart over time: concept / calculation / keyword error proportions per exam. Students see which error types are improving and which aren't.

More actionable than raw score progression because it shows *what kind* of studying is working.

### Recovery Score per Topic (new)

For each topic appearing in any exam's feedback:

```
Topic: Refraction (Physics)
Errors identified: 3 (across 2 exams)
AI Guide sessions on this topic: 1
Flashcards completed: 8
Recovery Score: 40% — needs work
```

Sorted by lowest recovery score first. This is the student's prioritized study queue, automatically maintained.

### Grade Prediction Enhancement

Existing `PredictiveGradeSandbox` becomes: "Based on your current error reduction trend, fixing your concept errors in Optics before Friday could improve your Physics score by 8–12 marks." Uses actual error analysis data to make predictions meaningful.

---

## 8. Complete Data Model (New/Updated Tables)

```prisma
// AiGuideSession — major expansion of existing model
model AiGuideSession {
  id                 String    @id @default(uuid())
  student_id         String
  title              String    // AI-generated or student-named
  session_type       String    // 'exam_prep'|'concept_study'|'note_synthesis'|'free_study'
  exam_context_id    String?   // FK to AnswerSheet
  error_focus        String?   // 'concept'|'calculation'|'keyword'
  sources_json       Json?     // StudentSource IDs
  chat_history       Json?     // Message array
  generated_outputs  Json?     // [{ type, content, saved, created_at }]
  mastery_checkpoints Json?    // [{ topic, confidence, demonstrated_at }]
  last_active_at     DateTime?
  created_at         DateTime  @default(now())
  updated_at         DateTime  @updatedAt
  student            Student   @relation(fields: [student_id], references: [id])
}

// Flashcard — referenced in code but missing from schema
model Flashcard {
  id                String    @id @default(uuid())
  student_id        String
  front             String
  back              String
  subject           String?
  source_exam_id    String?   // Which exam generated this
  source_session_id String?   // Which AI Guide session generated this
  error_type        String?   // 'concept'|'calculation'|'keyword'
  level             Int       @default(0)  // 0-5, 5=mastered
  next_review_at    DateTime?
  created_at        DateTime  @default(now())
  student           Student   @relation(fields: [student_id], references: [id])
}

// XpLog — referenced in code but missing from schema
model XpLog {
  id          String   @id @default(uuid())
  student_id  String
  amount      Int
  reason      String   // 'exam_graded'|'flashcard_mastered'|'session_completed'|'streak'
  created_at  DateTime @default(now())
  student     Student  @relation(fields: [student_id], references: [id])
}

// SelfAssessment — new
model SelfAssessment {
  id                String   @id @default(uuid())
  student_id        String
  exam_id           String
  topics            Json     // [{ name, confidence: 1-5 }]
  actual_result     Json?    // Post-grading actuals per topic
  prediction_delta  Float?   // Accuracy score
  created_at        DateTime @default(now())
  student           Student  @relation(fields: [student_id], references: [id])
}

// TopicRecovery — new
model TopicRecovery {
  id                     String   @id @default(uuid())
  student_id             String
  subject                String
  topic                  String
  error_count            Int      @default(0)
  session_count          Int      @default(0)
  flashcard_completions  Int      @default(0)
  recovery_score         Float    @default(0)  // 0-100, computed
  last_updated           DateTime @updatedAt
  student                Student  @relation(fields: [student_id], references: [id])
}
```

---

## 9. API Routes Required

### New Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/ai-guide/sessions` | GET | List all sessions for student, sorted by last_active_at |
| `/api/ai-guide/sessions` | POST | Create new session (with session_type, optional exam_context_id) |
| `/api/ai-guide/sessions/[id]` | GET | Get single session (chat history, outputs, sources) |
| `/api/ai-guide/sessions/[id]` | PATCH | Update session (save output, rename, update mastery checkpoints) |
| `/api/ai-guide/generate` | POST | Generate content (enhanced: includes Concept Explainer, Drill, Keyword Builder, Exam Debrief) |
| `/api/uploads/ocr` | POST | Process uploaded file through Sarvam AI / Gemini OCR pipeline |
| `/api/student/self-assessment` | POST | Save pre-exam self-assessment |
| `/api/student/topic-recovery` | GET | Get recovery scores for all topics |
| `/api/ai-guide/daily-brief` | GET | Generate AI Daily Brief for dashboard |

### Modified Routes

| Route | Change |
|---|---|
| `/api/ai-guide/generate` | Add 3 new modes: concept_explainer, drill_practice, keyword_builder, exam_debrief |
| `/api/uploads/student-sources` | Wire OCR pipeline (Sarvam AI / pdf-parse) instead of empty ocr_text |
| `/api/student/gamify` | Add XpLog record on each XP award |

---

## 10. Implementation Priority Order

### Phase 1 — Fix the Broken Foundation
1. Add missing Prisma models (Flashcard, XpLog, SelfAssessment, TopicRecovery)
2. Wire OCR pipeline: Sarvam AI API integration for uploads
3. Fix AiGuideSession: add new fields (title, session_type, exam_context_id, error_focus, last_active_at)
4. Implement session persistence API (`/api/ai-guide/sessions` CRUD)

### Phase 2 — The Core Differentiator
5. Exam Debrief flow: "Study This" button → create exam_prep session → pre-load error context
6. Three new generation modes: Concept Explainer, Drill Practice, Keyword Builder
7. Session view: 3-column layout with Context Panel

### Phase 3 — Dashboard Intelligence
8. AI Daily Brief component (Gemini call, dashboard-level)
9. Active Sessions widget (resume named sessions)
10. Recovery Radar (interactive donut replacing current bar chart)
11. AI-generated Today's Missions

### Phase 4 — Analytics + Metacognition
12. Error Trend Chart (stacked area over time)
13. Recovery Score per Topic
14. Self-Assessment: pre-exam prompt + post-grading comparison
15. Study Intelligence Score computation

---

## 11. Technology Decisions

| Concern | Decision | Rationale |
|---|---|---|
| Indian language OCR | Sarvam AI API | Specialized for Indian scripts, far superior to general vision models |
| General OCR / diagrams | Gemini Vision | Multimodal understanding, existing integration |
| English PDFs | pdf-parse | Fast, no API cost, already in package.json |
| AI Guide generation | Gemini 1.5 Flash | Existing integration, fast, supports system prompts with student context |
| Session streaming | Vercel AI SDK `streamText()` | Already implemented in chat route |
| Session state | AiGuideSession Prisma model | Already exists, needs schema expansion |

---

## 12. Competitive Position After V2

| Capability | Competitors | MARK AI V2 |
|---|---|---|
| Grading + Learning in one platform | None | ✅ |
| Error-type diagnosis → type-specific remediation | None | ✅ |
| Graded exam → AI Guide pipeline | None | ✅ |
| Indian language handwriting OCR | Doubtnut (Hindi only) | ✅ All major scripts via Sarvam AI |
| Persistent AI study sessions | None | ✅ |
| Metacognitive development | None | ✅ |
| Teacher resources → student AI Guide | None | ✅ |
| Real-time streaming AI tutor | Khanmigo | ✅ |
