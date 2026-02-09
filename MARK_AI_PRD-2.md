# MARK AI - Software Requirements Specification (SRS) for AI Guide Integration in Student Dashboard

**Document Version**: 1.0  
**Last Updated**: February 05, 2026  
**Prepared By**: Grok AI (Based on Conversation with Showmik, Chennai, Tamil Nadu, IN)  
**Status**: Ready for Implementation  
**Purpose**: This SRS compiles all requirements from the provided Product Requirements Document (PRD), idea validation, design suggestions, AI grading accuracy techniques, feature maps for Teacher and Student Dashboards, and the new NotebookLM-style AI Guide integration. It is designed as a self-contained context for a coding agent (e.g., AntiGravity or similar AI coder) to implement the specified changes, focusing on enhancing the Student Dashboard with the AI Guide while ensuring alignment with existing features.

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the functional and non-functional requirements for updating the MARK AI platform, specifically integrating a NotebookLM-inspired AI Guide into the Student Dashboard. The AI Guide will synthesize student-uploaded notes/sources (e.g., PDFs, text, images) with teacher-shared resources (exam results, answer keys, previous question papers) to generate personalized study aids. This builds on the existing PRD (V2.1, January 29, 2026) and prior discussions on validation, designs, AI accuracy, and feature maps.

The goal is to enhance student mastery-focused learning by providing interactive, AI-driven tools tied to performance data, while maintaining high AI grading accuracy (92-95% target).

### 1.2 Scope
- **In Scope**:
  - Integration of AI Guide in Student Dashboard (`/student/dashboard`).
  - Updates to existing dashboard sections (Recent Grades, Analytics, Actions) for seamless linking to the AI Guide.
  - Backend support for uploads, OCR, synthesis using Gemini 2.5.
  - Teacher-side sharing of resources to students.
  - AI accuracy techniques applied to guide outputs.
  - Tech Stack: Next.js (frontend), Supabase (backend/DB/auth/storage), Gemini 2.5 (AI), Tailwind/Shadcn (UI).
- **Out of Scope**:
  - Full mobile app (V2.0 per PRD).
  - Advanced V2.0 features (e.g., Canvas integration, web plagiarism).
  - Non-student dashboards (Teacher/Admin updates are minimal, e.g., sharing buttons).

### 1.3 Definitions and Acronyms
- **AI Guide**: NotebookLM-style tool for synthesizing sources into summaries, FAQs, quizzes, etc.
- **OCR**: Optical Character Recognition for handwritten uploads.
- **PRD**: Product Requirements Document.
- **SRS**: Software Requirements Specification.
- **Gemini 2.5**: Primary AI model for grading and synthesis.
- **Supabase**: Backend for DB, auth, storage, real-time.
- **TanStack Query**: For data fetching.
- **Recharts**: For charts.
- **Bull.js**: For background jobs (e.g., OCR, AI processing).

### 1.4 References
- Original PRD: MARK_AI_PRD.md (GitHub: https://github.com/SHADOW-465/MARK_AI).
- Live Demo: https://mark-ai-wine.vercel.app/.
- Conversation History: Idea validation, page designs, AI grading techniques, feature maps, AI Guide integration.
- Tech Stack: Next.js 14, React 18, Tailwind, Shadcn/UI, Supabase, Gemini API.

### 1.5 Overview
This SRS is structured as follows:
- Section 2: Idea Validation Summary.
- Section 3: AI Grading Accuracy Techniques.
- Section 4: Overall System Design and Pages.
- Section 5: Detailed Feature Maps (Teacher and Student Dashboards).
- Section 6: New AI Guide Requirements.
- Section 7: Functional Requirements.
- Section 8: Non-Functional Requirements.
- Section 9: Implementation Guidelines.

---

## 2. Idea Validation Summary
- **Strengths**: Strong market fit in India (1.5M schools, ₹300+ crores TAM). Differentiators: Handwritten OCR, multi-language (EN/HI/TA), affordability. Tech feasible with Gemini/Supabase stack.
- **Risks**: AI accuracy/bias, teacher adoption, competition (Turnitin). Mitigate via pilots, human-in-loop, compliance (GDPR/FERPA).
- **Recommendations**: Beta test with 50-100 users; focus on 80% time savings. Validation Score: 8/10.
- **Business Alignment**: Supports Year 1 goals (1,500 schools, 92-95% accuracy). Proceed with AI Guide as V2.0 enhancement for student engagement.

---

## 3. AI Grading Accuracy Techniques
Apply these to both core grading and the new AI Guide (e.g., for quiz generation tied to weaknesses):
1. **Detailed Rubrics**: Use teacher-defined criteria (e.g., JSON weights) in prompts.
2. **Model Answers/Training**: Incorporate keys/papers for reference; fine-tune with overrides.
3. **NLP/Explainable AI**: Semantic similarity (Sentence Transformers); show confidence/highlights.
4. **Bias Reduction**: Audit distributions; cross-reference teacher resources.
5. **Human-in-Loop**: Student ratings/overrides log for iterative improvement.
6. **Prompt Engineering**: Low temperature (0.3); structured JSON outputs.
- **Target**: 92-95% agreement; start with 85-90% for guide aids.
- **Implementation**: Extend PRD's AI engine (/api/grades/process) to new endpoints (e.g., /api/ai-guide/generate).

---

## 4. Overall System Design and Pages
- **Architecture**: Matches PRD (Next.js frontend, Express/Supabase backend, Gemini AI layer, S3 storage).
- **Design Guidelines**:
  - Colors: Teal (#208090) actions, #FFFCF9 background.
  - Typography: Inter font, 14px body.
  - Components: Shadcn (cards, modals, tables), Dropzone (uploads).
  - Accessibility: WCAG AA, ARIA labels.
  - Routing: Next.js App Router (e.g., /student/dashboard).
- **Key Pages** (Focus on Dashboards):
  - Teacher Dashboard: /teacher/dashboard (Tabs: Exams, Grading, Analytics, Settings).
  - Student Dashboard: /student/dashboard (Sections: Recent Grades, Analytics, Actions, AI Guide).
  - Auth: /auth/sign-in, /auth/sign-up.
  - Other: Landing (/), Profile (/profile).

---

## 5. Detailed Feature Maps

### 5.1 Teacher Dashboard Feature Map (/teacher/dashboard)
Tabbed layout for exam management.

| Tab/Section | Key Features | UI Elements | Interactions & Data Flow | Notes |
|-------------|--------------|-------------|--------------------------|-------|
| **Exams** | View/create exams; upload answers; monitor status. New: "Share to Students" for results/keys/papers. | Table (name/date/status); New Exam modal; Dropzone; Progress bar. | API: /api/exams/create; WebSockets for status. New: Share button → API (/api/share-resources) links to student DB. | Workflow 1: Steps 1-5. Enable sharing for AI Guide. |
| **Grading Console** | AI grades/feedback/plagiarism; overrides; bulk approve. | Card grid (scores/bars/feedback/badges); Edit modal; Bulk checkboxes. | API: /api/grades/:exam_id; Overrides recompute averages. | Workflow 1: Steps 6-9. Features 2-4. |
| **Analytics** | Averages/difficulty/rankings. | Recharts charts; Tables; Metrics. | Auto-refresh; Drill-down. Export CSV/PDF. | Feature 5: Analytics. |
| **Settings** | Rubrics/models/thresholds/classes. | Forms (JSON editor); Uploads; Sliders/dropdowns. | API: /api/rubrics/create; i18n reload. | Feature 5: Settings. Multi-lang (Feature 8). |

### 5.2 Student Dashboard Feature Map (/student/dashboard)
Section-based; new AI Guide tab.

| Section | Key Features | UI Elements | Interactions & Data Flow | Notes |
|---------|--------------|-------------|--------------------------|-------|
| **Recent Grades** | Scores/breakdowns/feedback. New: "Send to AI Guide" for import. | Cards (scores/bars/text); AI wand button. | Notifications; API copy to guide session. | Workflow 2: Steps 3-4. Links to AI Guide. |
| **Analytics** | History/trends/strengths. New: "Generate Study Plan" to AI Guide. | Recharts; Badges; Button. | API: /api/student/progress; Pre-populate guide. | Feature 6: Analytics. |
| **Actions** | Resubmit/ask/print. New: "Practice with AI Guide" for quizzes. | Buttons; Link. | API submits; Navigates to guide with papers. | Feature 6: Actions. |
| **AI Guide** | Uploads; Auto-import shared; Generate aids (summaries/FAQs/quizzes/audio); Chat. Session/rate. | Dropzone; Source cards; Generate dropdown; Markdown output; Quiz form; Audio player; Chat textarea; Sidebar (sessions/ratings). | API: /api/uploads/student-sources (OCR); /api/student/shared-resources; /api/ai-guide/generate (Gemini prompt); Streaming chat; Log ratings. Export PDF/CSV. | New: NotebookLM-style. Uses OCR (Feature 1), AI (Feature 2). |

---

## 6. New AI Guide Requirements
- **Inputs**:
  - Student: Upload notes/sources (PDF/text/image; OCR for handwritten).
  - Teacher-Shared: Exam results (scores/feedback from `ai_grades`), answer keys (`rubrics`/uploads), previous papers (linked via `exams` ID).
- **Outputs** (Generated Aids):
  - Summaries: Concise overviews.
  - FAQs: Q&A from sources.
  - Study Guides: Bullet-point plans.
  - Timelines: Chronological topic flows.
  - Quizzes: Self-grading MCQs (tied to weaknesses).
  - Audio Overviews: Text-to-speech (Google Cloud).
  - Explanations: Linked to exam weaknesses.
- **Chat Mode**: Interactive queries (e.g., "Explain from notes").
- **Privacy/Security**: Student-isolated sessions; opt-in sharing.
- **Accuracy**: Apply Section 3 techniques; 85-90% relevance initial target.

---

## 7. Functional Requirements

### 7.1 User Stories
- US-001: As a student, upload notes/sources to AI Guide for synthesis.
- US-002: As a student, auto-import teacher-shared resources (results/keys/papers).
- US-003: As a student, generate specific aids (e.g., quiz) from sources.
- US-004: As a student, chat with guide for queries.
- US-005: As a student, rate/save/export guide outputs.
- US-006: As a teacher, share resources to students for their AI Guide.
- US-007: As a system, apply OCR/AI accuracy to guide processes.

### 7.2 API Endpoints (New/Updated)
- POST /api/uploads/student-sources: Handle uploads/OCR; Return ID.
- GET /api/student/shared-resources: Fetch teacher-shared (auth-check).
- POST /api/ai-guide/generate: Body {type: 'quiz', sources: [IDs]}; Use Gemini.
- POST /api/ai-guide/chat: Streaming query response.
- PATCH /api/ai-guide/rate: Log rating for fine-tuning.
- POST /api/share-resources: Teacher shares to student/class.

### 7.3 Database Updates
- New Table: `student_sources` (id, student_id, file_url, ocr_text, type: 'upload'/'shared').
- New Table: `ai_guide_sessions` (id, student_id, sources_json, outputs_json, rating).
- Update `exams`: Add `shared_with_students` flag.

---

## 8. Non-Functional Requirements
- **Performance**: <30s per generation; <5min batch OCR. Scale to 500 concurrent users.
- **Availability**: 99.5% uptime; backups hourly.
- **Security**: JWT auth; Encrypt uploads (AES-256); Row-level security in Supabase.
- **Usability**: Mobile-first; WCAG AA; Tooltips for aids.
- **Scalability**: Auto-scale Vercel/Supabase; Cache responses (Redis).
- **Cost**: ₹0.50-1 per generation (Gemini optimization).
- **Testing**: Unit (Jest), E2E (Playwright); Accuracy audits.

---

## 9. Implementation Guidelines
- **Priority**: V1.0 core (dashboards) first; AI Guide as additive module.
- **Steps for Coding Agent**:
  1. Clone repo: https://github.com/SHADOW-465/MARK_AI.
  2. Update Student Dashboard: Add AI Guide tab (Shadcn tabs).
  3. Implement uploads: Dropzone → Supabase storage/OCR (Google Cloud API).
  4. AI Integration: Extend Gemini prompts; Handle JSON outputs.
  5. Sharing: Add buttons in Teacher Grading; DB links.
  6. Test: Pilots with sample data; Measure accuracy.
  7. Deploy: Vercel; Monitor with Sentry.
- **Timeline**: 2-4 weeks for integration.
- **Assumptions**: Existing auth/DB schema per PRD; No new deps (use built-in libs).

This SRS provides complete context for implementation. Contact for clarifications.