# MARK AI — Market Positioning, UI/UX Redesign & Pitch Documentation Design

**Date**: 2026-03-21
**Status**: Approved
**Approach**: Continuous Assessment Platform — closes the Grade → Diagnose → Recover loop

---

## 1. Executive Summary

MARK AI is repositioned from a general-purpose EdTech tool into **India's only platform that closes the full assessment loop for K-12 schools**: AI grades handwritten answer sheets, diagnoses each student's root errors, and automatically generates a personalised recovery path. No competitor in India does all three at K-12 pricing.

This document covers three parallel workstreams:
1. **Market positioning** — the core narrative, target segment, and competitive differentiation
2. **UI/UX redesign** — fixing the student dashboard, navigation, subject cards, and AI Guide entry points
3. **Pitch documentation** — a one-page principal brief and a 10-slide sales deck for institutional sales

---

## 2. Market Context & Research Findings

### 2.1 Beachhead Segment

**Primary target**: CBSE private schools in Tier 1 Indian cities (Delhi NCR, Mumbai, Bangalore, Hyderabad, Pune)

| Metric | Value |
|---|---|
| Addressable schools | 5,000–8,000 |
| Students per school | 800–2,500 |
| Annual tuition (parent) | ₹80,000–3,00,000 |
| Willingness to pay (SaaS) | ₹500–1,000/student/year |
| Budget decision window | October–February |

**Why CBSE Tier 1 first:**
- Homogeneous marking schemes (CBSE publishes official marking schemes — AI trains once, generalises across schools)
- English-medium: no language barrier in the product
- CBSE Class 12 On-Screen Marking (OSM) rolling out in 2026 — schools are actively looking for digital evaluation tools
- Higher willingness to pay vs state boards
- Urbanisation means reliable internet (removes offline dependency)

**Phase 2 expansion**: ICSE private schools (2,750 schools, higher per-student pricing at ₹1,500–3,000/student/year, more application-oriented papers). Phase 3: regional language state boards (technically harder; requires multilingual OCR pipelines).

### 2.2 Competitive Landscape

| Player | Grading Capability | Student Learning | India K-12 Focus | Pricing |
|---|---|---|---|---|
| Gradescope (Turnitin) | ★★★★★ | ✗ | ✗ (HE/Western) | Too high for India K-12 |
| Eklavvya | ★★★★ | ✗ | ✗ (HE focus) | Enterprise/custom |
| Chanakya AI | ★★★ | ✗ | ✓ | Early stage |
| Embibe | ✗ | ★★★★★ | Partial (exam prep) | B2C model |
| Extramarks | ★★ | ★★★ | ✓ | Hardware bundle |
| Google Classroom | ✗ | ✗ | Partial | Free (no moat) |
| **MARK AI** | **★★★★★** | **★★★★★** | **✓** | **₹500–1,000/student/yr** |

**The PMF gap**: No product in India closes the loop between grading and personalised student learning at school-affordable pricing. MARK AI owns the upper-right quadrant of the competitive map (high grading + high learning).

### 2.3 Key Market Tailwinds

1. **CBSE OSM 2026**: CBSE is digitalising Class 12 answer sheet evaluation. Schools need an on-screen evaluation workflow — MARK AI is purpose-built for this.
2. **NEP 2020 / PARAKH**: Policy mandates continuous, competency-based assessment. MARK AI's continuous diagnostic loop is directly aligned to this language — principals respond to it.
3. **BYJU's trust deficit**: Schools are wary of EdTech companies mishandling data or going bust. Early emphasis on DPDP compliance and stability differentiates.
4. **Teacher time crisis**: Indian teachers grade 40–80 students per class. Any tool that credibly saves 6–8 hours per exam cycle gets serious attention.

---

## 3. Positioning Strategy

### 3.1 Core Positioning (Option B — Continuous Assessment Platform)

MARK AI is not positioned as a "faster grading tool." The pitch is the full loop:

> **"MARK AI grades your answer sheets in minutes, tells you exactly which students need help, and gives them a personalised path to improve — automatically."**

Supporting lines:
- Built for CBSE schools · NEP 2020 aligned · DPDP compliant
- ₹500–1,000/student/year — less than one hour of private tutoring
- Free pilot for one term. No setup fee. We configure your marking schemes.

### 3.2 The Three-Stage Value Proposition

```
GRADE          →       DIAGNOSE        →       RECOVER
─────────────────────────────────────────────────────
AI grades              Identifies root          Student gets
handwritten            error type per           personalised AI
answer sheets          student                  study guide
aligned to CBSE        (concept /               driven by their
marking scheme         calculation /            actual mistakes
                       keyword)
Teacher saves          Principal sees           Scores improve
6–8 hrs/exam           class-wide gaps          term over term
```

### 3.3 Persona Pitches

**For the Principal (buyer)**
- NEP/PARAKH continuous assessment compliance, built in
- Class-wide performance dashboard — no more surprise board results
- Demonstrates ROI to school trustees: scores improve, parents are satisfied
- One platform replaces 3 tools (grading, analytics, learning)

**For the Teacher (decision influencer)**
- Grade 40 answer sheets in 20 minutes, not 8 hours
- AI suggests marks — teacher reviews and approves (positioned as assistant, not replacement)
- Feedback comments auto-generated per student, ready to share with parents

**For the Student (end user)**
- Knows exactly which concept they got wrong and why
- AI Guide builds a recovery session from their own exam mistakes
- Personalised — not generic test prep

**For the Parent (retention driver)**
- Real progress data, not just term grades
- Can see study activity, tasks completed, sessions done
- Reduces dependency on expensive private tutors

---

## 4. UI/UX Redesign

### 4.1 Design Principles

1. **One primary action per visit** — the AI tells the student what to do today; no decision paralysis
2. **Status signals over raw numbers** — red/amber/green status on subject cards replaces ambiguous percentage rings
3. **Honest empty states** — new users see real onboarding prompts, not fake default averages
4. **AI Guide has one entry point** — currently 4 different paths create confusion; consolidate to one
5. **Navigation reflects the loop** — 4 items: Home · Subjects · Study · Results

### 4.2 Navigation Restructure

**Current (8 items)**: Dashboard · AI Guide · Performance · Planner · Study · Vault · Flashcards · Analytics

**Proposed (4 items)**:
| Nav Item | What It Contains |
|---|---|
| **Home** | Dashboard (today's focus, subjects summary, AI brief, upcoming exams) |
| **Subjects** | Subject detail pages (tasks, sessions, history, AI Guide) — replaces Planner + Vault |
| **Study** | AI Guide sessions list + Flashcard Studio — consolidated study entry point |
| **Results** | Performance analytics + exam history — replaces Performance + Analytics |

Rationale: Planner and Vault are functionally part of the subject workflow. Flashcards and AI Guide are both study tools. Performance and Analytics overlap significantly. Consolidating gives students a mental model that matches the actual loop.

### 4.3 Student Dashboard Redesign

**Current state problems:**
- 9 sections with equal visual weight — no clear primary action
- avgScore defaults to 72 for new users with no exams — misleading
- Subject carousel uses ambiguous progress rings (0% looks the same as no-data)
- 8 nav items with overlapping purposes
- 4 separate paths to AI Guide

**Proposed 3-column layout:**

```
┌─────────────────┬──────────────────────────────┬──────────────────┐
│ LEFT (25%)      │ CENTER — hero (50%)           │ RIGHT (25%)      │
│                 │                               │                  │
│ Student name    │ ★ TODAY'S FOCUS               │ AI Daily Brief   │
│ Class · Streak  │   AI-picked session based     │ (personalised    │
│ Avg score       │   on real error patterns      │  to error data)  │
│ Tasks due       │   [Start Session →]           │                  │
│                 │                               │ Recent Results   │
│ ─────────────── │ Pending Tasks                 │ (last 2 exams)   │
│                 │ (subject-tagged checkboxes)   │                  │
│ Subjects        │                               │                  │
│ ■ Physics  ⚠   │ ─────────────────────────── │                  │
│   62% · needs   │                               │                  │
│   focus         │ Upcoming Exam Alert           │                  │
│ ■ Chemistry ✓  │ (if exam within 7 days)       │                  │
│   81% · on track│                               │                  │
│ ■ Maths    ↗   │                               │                  │
│   68% · improving│                             │                  │
│                 │                               │                  │
│ + Add Subject   │                               │                  │
└─────────────────┴──────────────────────────────┴──────────────────┘
```

**Key changes from current:**
- Subject carousel (horizontal scroll) → subject list with colour-coded status labels
- Study Process Chart → removed from dashboard (lives in Results)
- Recent Results (3 items, right column) → moved to right sidebar (2 items only)
- Mark Recovery Widget → merged into AI Daily Brief
- Active Sessions Widget → removed from dashboard (lives in Study nav)
- Assistant Widget → removed as separate section (replaced by Today's Focus card)
- `avgScore` default of 72 removed — new users see explicit empty state

### 4.4 Subject Status Signals

Replace circular progress rings with clear status labels:

| Status | Trigger | Colour | Label |
|---|---|---|---|
| Needs focus | avgScore < 65% | Red `#ef4444` | `⚠ {score}% · needs focus` |
| Improving | Score improved >5% vs prev exam | Amber `#f59e0b` | `↗ {score}% · improving` |
| On track | avgScore ≥ 70% | Green `#22c55e` | `✓ {score}% · on track` |
| No data | No graded exams yet | Muted | `No exams yet` |

### 4.5 AI Guide Consolidation

**Current**: 4 entry points (dashboard widget, `/student/ai-guide` list, subject detail right column, "Study This" button on results). Each creates a session differently; student doesn't know if they're continuing or starting new.

**Proposed**:
- Primary entry: **Today's Focus card** on dashboard — AI picks the session, student taps "Start Session"
- Secondary entry: **Study nav → AI Guide sessions list** — browse/resume all sessions
- Subject context: Subject detail page shows sessions filtered to that subject (not a separate entry point — same session list, filtered)
- "Study This" button on results → redirects to Study nav, pre-selecting that exam's session if it exists

One session model. One list. Context-filtered views, not separate flows.

### 4.6 Empty States

All pages must show honest, actionable empty states when no data exists:

| Page | Empty State Message | CTA |
|---|---|---|
| Dashboard (new student) | "Your dashboard fills up after your first graded exam. Ask your teacher to upload your results." | None |
| Subjects (no subjects) | "You'll see subjects here once your teacher grades your first exam." | — |
| Results (no exams) | "No results yet. Check back after your first exam is graded." | — |
| Flashcards (no cards) | "No flashcards yet. Generate some from an AI Guide session." | "Open Study" |
| Study (no sessions) | "Start your first AI Guide session — pick a subject to begin." | "Choose a Subject" |

Remove all fallback defaults: `avgScore = 72`, `monthlyActivity` formula, and static chart placeholders must not render for users with zero data.

### 4.7 Teacher Dashboard Additions (for institutional pitch)

The teacher/principal dashboard needs a **class-wide insights panel** to support the institutional pitch:

```
┌──────────────────────────────────────────────────────────┐
│ Class 11A — Physics — Unit Test 3                        │
├──────────────────┬───────────────────────────────────────┤
│ 34 graded        │ Class avg: 67%                        │
│ 6 pending review │ ↓5% from last test                   │
├──────────────────┴───────────────────────────────────────┤
│ Error Breakdown (class-wide)                             │
│ Concept errors    ████████████████░░░░  62%              │
│ Calculation errors████████░░░░░░░░░░░░  31%              │
│ Keyword errors    ███░░░░░░░░░░░░░░░░░░  7%              │
├──────────────────────────────────────────────────────────┤
│ At-Risk Students (score < 50%)                           │
│ Rahul Sharma    42%  · 3 consecutive ↓ · AI Guide: 0 sessions │
│ Priya Mehta     48%  · Concept errors dominant           │
└──────────────────────────────────────────────────────────┘
```

This panel is what a principal sees when they log into the dashboard — it surfaces the ROI of MARK AI directly: "8 students are at risk, here's why, here's what's being done."

---

## 5. Pitch Documentation

### 5.1 Artifact 1 — One-Page Principal Brief

**Format**: A4 PDF / printed leave-behind for in-person school visits
**Audience**: School principal or academic director
**Length**: Single page, no scrolling

**Structure**:
1. **Header**: MARK AI logo + tagline
2. **The Problem** (2–3 sentences): Teacher grading burden + student feedback gap
3. **What MARK AI Does** (3–4 sentences): The full loop explained simply
4. **What Your School Gets** (bullet list): Time saved, principal dashboard, NEP alignment, student AI guide, parent portal
5. **Why Now** (1–2 sentences): CBSE OSM 2026 + NEP PARAKH window
6. **Pilot Offer** (box callout): Free for one term · No setup fee · We configure your marking schemes

**Tone**: Direct, outcome-focused, no jargon. Principals respond to "teacher saves 8 hours" and "scores improve" — not "AI-powered personalised learning pathways."

### 5.2 Artifact 2 — 10-Slide Sales Deck

**Format**: PDF / Google Slides
**Audience**: Principal + academic committee (2–3 people)
**Used in**: Follow-up meeting after the one-pager has been seen

| Slide | Title | Core Content |
|---|---|---|
| 1 | The Problem | Teacher grading overload. Student score stagnation. The feedback that comes too late. |
| 2 | Market Timing | CBSE OSM 2026 rollout. NEP 2020 PARAKH mandate. The window is now. |
| 3 | The Full Loop | Grade → Diagnose → Recover diagram. Why doing only one step doesn't work. |
| 4 | Teacher Experience | Screenshots: upload → AI grades → review → publish. 20 min not 8 hours. |
| 5 | Student Experience | Screenshots: personalised study guide, error recovery, AI Guide session. |
| 6 | Principal Dashboard | Screenshots: class-wide analytics, at-risk students, error breakdown. |
| 7 | Competitive Landscape | Positioning map. "Gradescope grades. Embibe teaches. MARK AI does both." |
| 8 | Pricing | ₹500–1,000/student/year. School-wide licence. Less than one hour of private tutoring. |
| 9 | Data Security | DPDP Act compliance. Student data stays in India. No third-party sharing. |
| 10 | Free Pilot CTA | One term, free, no obligation. We handle setup. You evaluate results by end of term. |

### 5.3 Positioning Line (canonical)

> **"MARK AI grades your answer sheets in minutes, tells you exactly which students need help, and gives them a personalised path to improve — automatically."**

Sub-line: *Built for CBSE schools · NEP 2020 aligned · DPDP compliant · ₹500–1,000/student/year*

### 5.4 Go-to-Market Notes

- **Sales window**: October–February (school budget cycles). Missing this costs a full year.
- **Pilot offer is mandatory**: Indian schools will not pay before seeing results. One free term removes procurement friction and gets MARK AI inside a school.
- **Teacher buy-in is the renewal risk**: If teachers don't adopt the tool, the school won't renew regardless of what the principal signed. Teacher onboarding and daily utility are as important as the principal pitch.
- **Reference customers**: The first 2–3 pilot schools become the social proof for every subsequent sale. Prioritise schools where the principal is well-networked in the CBSE community.
- **DPDP compliance** must be proactively addressed — schools have been burned by EdTech companies mishandling student data. A one-line data policy mention in every communication builds trust.

---

## 6. Implementation Priority

### Phase 1 — UI/UX (Weeks 1–3)
1. Collapse navigation from 8 to 4 items
2. Rebuild student dashboard with 3-column layout and Today's Focus hero card
3. Replace subject carousel with subject status list (red/amber/green signals)
4. Remove all fake default data (avgScore=72, static chart fallbacks)
5. Add honest empty states across all student pages
6. Consolidate AI Guide entry points to one primary + one secondary

### Phase 2 — Teacher/Principal Dashboard (Weeks 4–5)
7. Add class-wide error breakdown panel to teacher dashboard
8. Add at-risk students panel (score < 50%, 3 consecutive declines)
9. Add per-exam grading stats (class avg, pending count, score distribution)

### Phase 3 — Pitch Documents (Weeks 5–6)
10. Design and produce one-page principal brief (PDF)
11. Design and produce 10-slide sales deck
12. Add product screenshots from Phase 1–2 improvements into deck

---

## 7. Out of Scope

- Voice assistant (separate feature roadmap)
- Multilingual / regional language support (Phase 3 market expansion)
- Google Drive integration (not needed for pilot)
- Power Sprint flashcard mode (gamification roadmap, separate)
- Mobile app (follow-up after web product is stable)
- State board / government school market (requires separate strategy + pricing)
