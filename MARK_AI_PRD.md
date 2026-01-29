# 📋 MARK AI — Product Requirements Document (PRD)
## Complete Specification & Strategic Roadmap

**Document Version**: 2.1 (Production Ready)  
**Last Updated**: January 29, 2026  
**Status**: ✅ V1.0 PRODUCTION READY  
**GitHub**: https://github.com/SHADOW-465/MARK_AI  
**Live Demo**: https://mark-ai-wine.vercel.app/

---

## VERSION ROADMAP

### ✅ V1.0 - Production Release (January 2026)
**Status**: READY FOR DEPLOYMENT

| Feature | Status |
|---------|--------|
| AI-Powered Grading (Gemini) | ✅ Complete |
| Handwritten OCR Processing | ✅ Complete |
| Teacher Dashboard | ✅ Complete |
| Student Dashboard & Feedback | ✅ Complete |
| Parent Portal | ✅ Complete |
| Admin Analytics | ✅ Complete |
| Plagiarism Detection (Embeddings) | ✅ Complete |
| Multi-Language Support (EN/HI/TA) | ✅ Complete |
| Excel/CSV Export | ✅ Complete |

### 🔮 V2.0 - Future Enhancements (Q2-Q3 2026)
**Status**: DEFERRED - To be implemented based on user demand

| Feature | Priority | Notes |
|---------|----------|-------|
| Google Classroom Integration | Medium | OAuth, student import, grade sync |
| NEP 2020 Compliance | Medium | Competency mapping, CCE tracking, 360° reports |
| Canvas/Moodle Integration | Low | Enterprise LMS integrations |
| Mobile App (React Native) | Medium | Native mobile experience |
| Advanced Analytics (Charts) | Low | Recharts/D3 visualizations |
| Web Plagiarism Detection | Low | External API (Copyscape) |

---

## EXECUTIVE SUMMARY

### Product Overview

**MARK AI** is an **AI-powered answer grading and assessment platform** designed to automate the evaluation of subjective, written answers in educational institutions. It combines **automated grading, plagiarism detection, OCR processing, and personalized feedback generation** into a single, affordable, teacher-friendly platform.

### Core Problem Statement

Teachers spend **15–25 hours per week grading subjective answers**, resulting in:
- Severe burnout and teacher attrition (top 3 cause of K-12 teacher burnout)
- Delayed feedback (students receive grades weeks later)
- Inconsistent grading (same answer gets different scores from different teachers)
- Lost time for lesson planning, mentorship, and student support

**MARK AI solves this** by automating 90% of grading work while maintaining 95%+ accuracy with human graders.

### Vision Statement

> "MARK AI transforms education from grade-focused to mastery-focused by automating subjective assessment and enabling teachers to spend time on what truly matters: mentoring, personalization, and student success."

### Target Users

- **Primary**: Teachers (secondary & higher education)
- **Secondary**: School administrators, students, institutions
- **Geographic**: India-first (expansion to SEA, Africa, Global)

### Business Goals (Year 1)

| Metric | Target |
|--------|--------|
| **Schools Onboarded** | 1,500+ |
| **Active Teachers** | 15,000+ |
| **Active Students** | 250,000+ |
| **Monthly Recurring Revenue (MRR)** | ₹80 lakhs ($9.6K) |
| **Free-to-Paid Conversion** | 3-5% |
| **Teacher Adoption Rate** | 80%+ |
| **Grading Accuracy** | 92-95% vs human graders |

---

## 1. PROBLEM STATEMENT & MARKET OPPORTUNITY

### Primary Problem

**Inefficient Assessment Workflow**
```
Current State (Status Quo):
┌─────────────────────────────────────────────┐
│ Teacher gets 100 exam papers (3-5 hours work)
│  ↓
│ Opens each paper, reads answer, manually scores
│  ↓
│ Writes feedback (slow, inconsistent)
│  ↓
│ Enters grades into gradebook manually
│  ↓
│ Result: Takes 20-30 hours/week
│         Delayed feedback (students wait 2-3 weeks)
│         Inconsistent quality
│         Teacher burnout
└─────────────────────────────────────────────┘

MARK AI Solution:
┌─────────────────────────────────────────────┐
│ Teacher uploads 100 exam papers (or scans)
│  ↓
│ OCR processes handwritten answers
│  ↓
│ AI grades all 100 in <5 minutes
│  ↓
│ Teacher reviews AI grades (10-20% spot check)
│  ↓
│ AI-generated feedback sent to students
│  ↓
│ Grades auto-sync to LMS/SIS
│  ↓
│ Result: 90% time savings (20-30 hrs → 2-3 hrs)
│         Instant feedback (5 minutes)
│         Consistent quality (AI)
│         Teacher satisfaction & retention
└─────────────────────────────────────────────┘
```

### Secondary Problems Solved

1. **Inconsistent Grading** — Same answer scored differently by different teachers
   - Solution: AI applies same rubric uniformly
2. **Delayed Feedback** — Students receive grades weeks later
   - Solution: Instant AI feedback (seconds)
3. **Plagiarism Detection** — Manual plagiarism checking is impossible at scale
   - Solution: Built-in plagiarism detection
4. **Handwritten Answer Processing** — Scanned papers are tedious to evaluate
   - Solution: OCR + AI handles handwritten answers
5. **Learning Disabilities** — No differentiated feedback for struggling students
   - Solution: Personalized suggestions per student

### Market Size & Opportunity

```
India Education Market:
├─ 1.5M+ schools (K-12 + Higher Ed)
├─ 50M secondary school students (11-12)
├─ 40M undergraduate students
├─ 10M+ competitive exam takers (UPSC, NEET, JEE)
└─ TAM (Total Addressable Market):
   ├─ Annual per-school spend on grading tools: ₹3,000-10,000
   ├─ Realistic capture: 50,000 schools × ₹60,000 avg = ₹300+ crores ARR
   └─ 5-year projection: ₹1,000+ crores ($120M+)
```

### Why MARK AI Wins (Competitive Advantage)

| Factor | Gradescope | Turnitin | MARK AI |
|--------|-----------|----------|---------|
| **Price** | $2-5/student | $2-5/student | ₹50-200/student |
| **Speed** | 10-30 min/batch | 30+ min | <5 min |
| **Handwritten Support** | Limited | None | ✅ Full |
| **Multi-Language** | English-centric | English-centric | ✅ 12 languages |
| **Teacher Training** | Complex | Complex | ✅ Easy |
| **India-Optimized** | No | No | ✅ Yes |
| **Feedback Quality** | Generic | Generic | ✅ Personalized |
| **Plagiarism Included** | No (extra $) | Yes (bundled) | ✅ Included |

---

## 2. TARGET AUDIENCE & USER PERSONAS

### Primary Target Segments

#### **Segment 1: Urban Private K-12 Schools**
- **Size**: 15,000 schools (India-wide)
- **Profile**: CBSE/ICSE boards, 500-2,000 students, tech-forward
- **Pain Point**: Teachers overwhelmed; need efficiency + quality
- **Willingness to Pay**: ₹5,000-10,000/year/school
- **Entry Point**: Principal/Vice Principal (decision-maker)
- **Adoption Timeline**: 4-6 weeks to full teacher adoption

#### **Segment 2: Semi-Urban & Tier-2 Private Schools**
- **Size**: 100,000+ schools
- **Profile**: State boards, 200-1,000 students, gradually digitizing
- **Pain Point**: Limited budget, but want to improve assessment
- **Willingness to Pay**: ₹1,000-3,000/year/school
- **Entry Point**: Principal + tech-savvy teacher
- **Adoption Timeline**: 6-8 weeks

#### **Segment 3: Universities & Colleges**
- **Size**: 50,000+ institutions
- **Profile**: Mix of state + private, 2,000-50,000 students
- **Pain Point**: Grading essays/research papers at scale
- **Willingness to Pay**: ₹5,000-50,000/year/department
- **Entry Point**: Department head or exam cell
- **Adoption Timeline**: 8-10 weeks (slower due to approvals)

#### **Segment 4: Coaching & Test-Prep Institutes**
- **Size**: 100,000+ centers
- **Profile**: Competitive exam prep (NEET, JEE, UPSC, CAT)
- **Pain Point**: High volume of answer evaluation
- **Willingness to Pay**: ₹500-2,000/month/center
- **Entry Point**: Founder/director
- **Adoption Timeline**: 2-4 weeks (fast decision-making)

#### **Segment 5: EdTech Platforms**
- **Size**: 50+ major platforms (Vedantu, Unacademy, Physics Wallah, etc.)
- **Profile**: Digital-native, high volume of assessments
- **Pain Point**: Need to scale assessment without hiring graders
- **Willingness to Pay**: Custom contracts (₹50 lakh - ₹5 crore/year)
- **Entry Point**: VP Product / CTO
- **Adoption Timeline**: 3-6 months (enterprise sales cycle)

### User Personas

#### **Persona 1: Ms. Priya (Teacher, Age 32)**
- **School**: Urban private school, 1,000 students
- **Subjects**: English Literature, History
- **Class Size**: 40 students
- **Pain Points**:
  - Spends 18 hours/week grading essays
  - Provides generic feedback ("Good!" or "Improve organization")
  - Cannot grade all assignments due to time (only tests)
  - Frustrated by administrative workload
- **Goals**:
  - Cut grading time by 70%+
  - Provide better, more detailed feedback
  - Have time for lesson planning
  - Improve student engagement
- **Tech Comfort**: High (uses Google Classroom, WhatsApp)
- **Adoption Drivers**:
  - Easy to use (no training needed)
  - Measurable time savings (proven in trial)
  - Maintains control (teacher reviews AI grades)
  - Improves student outcomes

#### **Persona 2: Mr. Rajesh (School Principal, Age 45)**
- **School**: 1,500 students, CBSE board
- **Responsibility**: Oversee academic quality, teacher management, budget
- **Pain Points**:
  - Teachers overworked, high burnout, retention issues
  - No visibility into grading consistency
  - Cannot identify struggling students early
  - Manual compliance reporting (audit trails)
- **Goals**:
  - Reduce teacher workload (retention)
  - Improve academic outcomes (test scores)
  - Ensure fair grading (equity)
  - Reduce administrative overhead
- **Tech Comfort**: Medium (uses Excel, school software)
- **Adoption Drivers**:
  - Measurable ROI (teacher retention, student grades)
  - Easy implementation (no IT overhaul needed)
  - Data-driven insights (bias detection, trends)
  - Affordable pricing (<₹100/student/year)

#### **Persona 3: Arjun (Student, Age 17, Class 12)**
- **School**: Urban private school
- **Challenges**:
  - Receives grades but no detailed feedback
  - Doesn't know exactly where to improve
  - Takes 2-3 weeks to get answers back (too late to fix)
- **Goals**:
  - Get feedback quickly (within 24 hours)
  - Understand exactly where marks were lost
  - Know how to improve for next assignment
  - See progress over time
- **Tech Comfort**: Very high (native to digital tools)
- **Adoption Drivers**:
  - Instant feedback motivates improvement
  - Clear rubric breakdown (transparent scoring)
  - Comparison with class average (healthy competition)
  - Improvement suggestions (actionable)

---

## 3. PRODUCT OVERVIEW & FEATURES

### Core Features (MVP - Week 12 Launch)

#### **Feature 1: Answer Upload & OCR Processing**
```
Workflow:
1. Teacher uploads answer papers (text, PDF, images)
2. MARK AI detects format:
   - Digital text? → Process directly
   - Handwritten image? → OCR conversion
   - Scanned PDF? → Page extraction + OCR
3. Output: Clean, machine-readable answer text

Key Specs:
├─ Supported formats: PDF, JPG, PNG, DOC, DOCX
├─ OCR accuracy target: 95%+ for clear handwriting
├─ Processing time: <1 min per document
├─ Language support: Hindi, English, Tamil, Telugu (initially)
├─ Batch processing: 500+ papers at once
└─ Cost: $0.01-0.05 per page (absorbed in subscription)
```

#### **Feature 2: AI Grading Engine**
```
Workflow:
1. Teacher defines rubric (e.g., "Concept Clarity: 30%, Grammar: 20%, etc.")
2. Teacher provides model answer (or AI extracts from curriculum)
3. AI evaluates student answer against rubric
4. Output: Score (0-10) + breakdown per criterion

Technology:
├─ Model: Gemini 2.5 (primary), GPT-4 Turbo (fallback)
├─ Accuracy target: 92-95% agreement with teacher
├─ Scoring: Weighted rubric criteria
├─ Speed: <30 sec per answer
├─ Language: Supports 12 languages

Rubric Example:
├─ Concept Understanding (40%): 8/10
├─ Depth of Explanation (30%): 7/10
├─ Grammar & Clarity (20%): 9/10
├─ Presentation (10%): 8/10
└─ TOTAL: 7.9/10 (A grade)
```

#### **Feature 3: Feedback Generation**
```
Workflow:
1. AI analyzes student answer
2. Identifies strengths and weaknesses
3. Generates personalized feedback (2-3 sentences)
4. Provides improvement suggestions

Example Output:
"Good explanation of Newton's Second Law (F=ma). 
However, you missed discussing the relationship between 
acceleration and mass. Try to include a real-world example 
next time. Well done on the mathematical formulation!"

Key Features:
├─ Tone: Encouraging, constructive, specific
├─ Length: 2-3 sentences (concise)
├─ Languages: 12 supported
├─ Customizable: Teacher can edit before sending
└─ Quality: 4.2/5 average student rating
```

#### **Feature 4: Plagiarism Detection**
```
Workflow:
1. Student answer submitted
2. AI compares against:
   - Model answer (provided by teacher)
   - Previous student submissions
   - Web content (if enabled)
3. Output: Similarity score (0-100%)

Scoring:
├─ 0-20%: Original (green)
├─ 21-50%: Paraphrased content (yellow)
├─ 51-80%: Significant similarity (orange)
└─ 81-100%: Likely copied (red)

Features:
├─ Highlight matching sections
├─ Show comparison with source
├─ Configurable threshold (set by teacher)
├─ Supports all languages
└─ Cost: Included in Pro tier +
```

#### **Feature 5: Teacher Dashboard**
```
Components:

1. Exam Management
   ├─ List of all exams (created, in progress, completed)
   ├─ Upload answers (batch upload or one-by-one)
   ├─ View processing status
   └─ Access grading console

2. Grading Console
   ├─ AI-suggested grade + feedback
   ├─ Teacher review & adjustment
   ├─ Quick feedback customization
   ├─ Approve & send to student
   └─ Bulk operations (approve all, flag outliers)

3. Analytics
   ├─ Class average score
   ├─ Question difficulty (% got it right)
   ├─ Student performance (ranked by score)
   ├─ Time-to-grade statistics
   └─ Rubric criterion analysis

4. Settings
   ├─ Create custom rubrics
   ├─ Upload model answers
   ├─ Configure plagiarism threshold
   ├─ Language preference
   └─ Class/subject management
```

#### **Feature 6: Student Dashboard**
```
Components:

1. Grade View
   ├─ Assignment name + date
   ├─ Overall score (e.g., 8.5/10)
   ├─ Rubric breakdown (see points per criterion)
   ├─ Personalized feedback
   └─ Improvement suggestions

2. Analytics
   ├─ Grade history (timeline of scores)
   ├─ Subject-wise average
   ├─ Class average comparison (anonymized)
   ├─ Trend (improving, stable, declining)
   └─ Learning areas (strength vs weakness)

3. Actions
   ├─ View model answer
   ├─ Resubmit (if teacher allows)
   ├─ Print report (for parents)
   └─ Ask question (in-app, goes to teacher)
```

#### **Feature 7: Admin Dashboard** (School Admin)
```
Components:

1. School Overview
   ├─ Total exams processed
   ├─ Total students grades recorded
   ├─ Teachers active this month
   ├─ System uptime
   └─ Usage trending

2. Teacher Management
   ├─ List of teachers (invite, deactivate)
   ├─ Teacher performance metrics
   ├─ Grading patterns (comparative)
   ├─ Grade distribution analysis
   └─ Bias detection (are grades fair?)

3. Student Analytics
   ├─ School-wide average
   ├─ Subject-wise trends
   ├─ At-risk students (grades declining)
   ├─ Top performers
   └─ Demographic breakdown (if available)

4. Settings
   ├─ School name, logo, colors
   ├─ Manage billing & subscription
   ├─ LMS/SIS integrations
   ├─ Language & timezone
   └─ Export/compliance reports
```

#### **Feature 8: Multi-Language Support**
```
MVP (12 Languages):
Tier 1 (High Proficiency):
├─ English (India + Global)
├─ Hindi (Devanagari)
├─ Tamil (Tamil script)
└─ Telugu (Telugu script)

Tier 2 (Good Proficiency):
├─ Marathi
├─ Gujarati
├─ Punjabi
├─ Bengali
├─ Kannada
└─ Malayalam

Plus Code-Switching Support:
├─ Hinglish (English + Hindi mixed)
├─ Tanglish (English + Tamil mixed)
└─ Other regional code-switching
```

#### **Feature 9: Export & Integration**
```
Export Formats:
├─ CSV (for LMS import)
├─ Excel (formatted with charts)
├─ PDF (student report card)
├─ JSON (for API)
└─ SRT/CSV (for custom tools)

LMS Integrations (MVP):
├─ Google Classroom (sync grades)
├─ Google Drive (save results)
└─ Email export

Phase 1+ Integrations:
├─ Canvas
├─ Moodle
├─ PowerSchool (SIS)
├─ Infinite Campus
└─ Custom API
```

---

## 4. USER FLOWS & WORKFLOWS

### Workflow 1: Teacher Grades Exam (Complete Flow)

```
┌─ START: Teacher finishes exam collection
│
├─ STEP 1: Login to MARK AI Dashboard
│  └─ OAuth (Google) or email/password
│
├─ STEP 2: Create New Exam
│  ├─ Name: "Class 12A - Physics Unit 3 Test"
│  ├─ Subject: Physics
│  ├─ Date: Jan 23, 2026
│  ├─ Class: 12A (40 students)
│  └─ Next: Define Rubric
│
├─ STEP 3: Define Grading Rubric
│  ├─ Option A: Use template (pre-built for subject)
│  │  └─ Select template → Auto-populated
│  │
│  └─ Option B: Create custom rubric
│     ├─ Add criterion: "Concept Understanding (40%)"
│     │  └─ Define: "Student explains law correctly, with formula"
│     │
│     ├─ Add criterion: "Problem Solving (40%)"
│     │  └─ Define: "Applies formula correctly, shows all steps"
│     │
│     └─ Add criterion: "Presentation (20%)"
│        └─ Define: "Clear handwriting, organized layout"
│
├─ STEP 4: Provide Model Answer (Optional)
│  ├─ Paste ideal answer OR
│  ├─ Upload sample solution OR
│  └─ AI extracts from curriculum textbook
│
├─ STEP 5: Upload Student Answers
│  ├─ Option A: Bulk upload
│  │  └─ ZIP file with 40 PDFs/images → Extract all
│  │
│  └─ Option B: One-by-one
│     ├─ Scan paper → Upload image
│     ├─ Or: Take photo (mobile) → Upload
│     └─ Or: Digital copy → Upload PDF/DOC
│
├─ STEP 6: AI Processing
│  │
│  ├─ For each student answer:
│  │  ├─ OCR (if handwritten) → Convert to text
│  │  ├─ AI grades against rubric → Score + breakdown
│  │  ├─ Generate feedback → Personalized message
│  │  └─ Check plagiarism → Similarity score
│  │
│  └─ Status: "Grading 40 papers..." (5 min)
│
├─ STEP 7: Teacher Review (Spot Check)
│  │
│  ├─ View batch results: "All graded ✓"
│  │
│  ├─ Review outliers:
│  │  ├─ Student A: AI gave 9.5/10 (top 5%) → Check if fair
│  │  ├─ Student B: AI gave 3/10 (bottom 5%) → Check if harsh
│  │  └─ Student C: Plagiarism 85% → Verify
│  │
│  └─ Actions per student:
│     ├─ Accept: Use AI grade as-is
│     ├─ Adjust: Change score, keep feedback
│     ├─ Override: Set score + write custom feedback
│     └─ Flag: Send to second teacher for review
│
├─ STEP 8: Add Custom Comments (Optional)
│  ├─ For a few students, add personal note
│  │  └─ "Arjun, great improvement from last test!"
│  │
│  └─ AI suggestions are default feedback
│
├─ STEP 9: Approve & Release
│  │
│  ├─ Review summary:
│  │  ├─ "40 papers graded"
│  │  ├─ "Class average: 7.2/10"
│  │  ├─ "5 students below 5/10 (flag for support)"
│  │  └─ "No plagiarism concerns"
│  │
│  └─ Click "Release Grades to Students"
│
├─ STEP 10: Auto-Sync to LMS/Gradebook
│  ├─ Grades sent to Google Classroom
│  ├─ Grades synced to PowerSchool (if integrated)
│  └─ Student notifications sent
│
└─ END: Teacher dashboard shows exam complete
   ├─ Time spent: 2-3 hours total
   │  └─ (Breakdown: 20 min setup, 5 min AI grading, 30 min review, 60 min admin)
   │
   └─ Student experience:
      ├─ Within 5 min: Receive notification "Grade posted!"
      ├─ Within 24 hrs: Detailed feedback available
      └─ Can see rubric breakdown + improvement suggestions

TIME SAVINGS:
├─ Manual grading alone: 15-20 hours
├─ MARK AI approach: 2-3 hours total
└─ Savings: 80% reduction
```

### Workflow 2: Student Receives Feedback & Improves

```
┌─ START: Student submitted answer last week
│
├─ STEP 1: Notification Received
│  ├─ Email: "Your grade for Physics Test is ready!"
│  ├─ SMS (if enabled): Same message
│  └─ In-app notification
│
├─ STEP 2: Student Opens MARK AI Dashboard
│  ├─ Login with school credentials (OAuth)
│  └─ Homepage shows: "New grade: Physics Test - 7/10"
│
├─ STEP 3: View Detailed Feedback
│  │
│  ├─ Overall Score: 7/10 (Grade B)
│  │
│  ├─ Rubric Breakdown:
│  │  ├─ Concept Understanding: 8/10 (✓ Good)
│  │  ├─ Problem Solving: 6/10 (⚠️ Needs work)
│  │  ├─ Presentation: 7/10 (→ Average)
│  │  └─ (Weighted calculation shown)
│  │
│  └─ Personalized Feedback:
│     "You explained Newton's second law correctly and showed the formula.
│     However, you didn't apply the formula to the given numerical values.
│     Try solving the problem step-by-step next time. Good start!"
│
├─ STEP 4: Access Improvement Resources
│  │
│  ├─ AI-Generated Suggestions:
│  │  ├─ "Your weakness: Problem-solving skills"
│  │  ├─ "Try these practice problems: (link to exercises)"
│  │  ├─ "Video: How to apply Newton's Laws (3:45 min)"
│  │  └─ "Next assignment focus area: Numerical problems"
│  │
│  └─ Optional:
│     ├─ View model answer (if teacher provided)
│     ├─ Ask question to teacher (in-app messaging)
│     └─ Compare with class average (anonymized): "Your 7/10 vs class avg 6.8/10"
│
├─ STEP 5: Resubmit (If Allowed)
│  │
│  ├─ Teacher enabled: "Resubmit opportunity"
│  │
│  └─ Student can:
│     ├─ Re-read question + model answer
│     ├─ Solve problem again
│     ├─ Resubmit answer
│     └─ Get new grade + feedback (within 5 min)
│
├─ STEP 6: Track Progress Over Time
│  │
│  ├─ Dashboard shows grade history:
│  │  ├─ Test 1 (Jan 15): 6/10
│  │  ├─ Test 2 (Jan 22): 7/10 ← (Improvement!)
│  │  └─ Trend: ↗ Improving (green)
│  │
│  └─ Learning insights:
│     ├─ Mastery: "You're strong in conceptual understanding"
│     ├─ Growth area: "Problem-solving skills improving (6.5 → 7 over 2 tests)"
│     └─ Prediction: "At current pace, you'll reach 8.5/10 by final exam"
│
└─ END: Student motivated to improve
   ├─ Knows exactly what to fix
   ├─ Has resources to improve
   ├─ Can see progress over time
   └─ Higher engagement & learning outcomes
```

---

## 5. TECHNICAL ARCHITECTURE

### System Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                    │
├────────────────┬─────────────────┬────────────────────────┤
│  Web (Next.js) │  Mobile (React  │  Admin Dashboard       │
│  14 + React 18 │  Native/Flutter)│  (Separate app)        │
└────────────────┴─────────────────┴────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│                    API LAYER (Express.js)                  │
├─ REST API (GraphQL optional)                               │
├─ Authentication (OAuth 2.0 + JWT)                          │
├─ Rate limiting & caching (Redis)                           │
└─ WebSocket (real-time notifications)                       │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC & DATA LAYER                   │
├─ PostgreSQL (Supabase) - Primary database                  │
├─ Redis - Session cache, job queue                          │
├─ AWS S3 - File storage (images, PDFs)                      │
├─ Elasticsearch - Search optimization (future)              │
└─ Bull.js - Background job processing                       │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│              AI/ML PROCESSING LAYER                        │
├─ Google Cloud Speech-to-Text - OCR for handwritten answers │
├─ Gemini 2.5 / GPT-4 API - Answer grading                   │
├─ Sentence Transformers - Plagiarism detection              │
├─ PyAnnote - Speaker diarization (future)                   │
└─ Custom models - Stored in GCS / AWS                       │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│            EXTERNAL INTEGRATIONS                           │
├─ Google Classroom API - Import students, sync grades       │
├─ PowerSchool API - SIS integration                         │
├─ Stripe API - Payments                                     │
├─ SendGrid - Email notifications                           │
├─ Twilio - SMS alerts                                       │
├─ CloudFlare - CDN & DDoS protection                        │
└─ Datadog - Monitoring & logs                               │
└───────────────────────────────────────────────────────────┘
```

### Tech Stack Details

```
Frontend:
├─ Framework: Next.js 14 (App Router)
├─ UI Library: React 18
├─ Styling: Tailwind CSS + Shadcn/UI components
├─ State Management: Zustand
├─ API Client: TanStack Query (React Query)
├─ Forms: React Hook Form + Zod validation
├─ Charts/Analytics: Recharts + Plotly
├─ PDF Generation: jsPDF + html2canvas
├─ File Upload: React Dropzone
├─ Deployment: Vercel (auto-scaling, CDN, global)
└─ Monitoring: Sentry + LogRocket

Backend:
├─ Runtime: Node.js 18+
├─ Framework: Express.js
├─ API Style: REST (GraphQL optional)
├─ Authentication: Passport.js (OAuth) + JWT
├─ Validation: Joi / Yup
├─ Database ORM: Prisma (type-safe)
├─ File Processing: Multer + Sharp (image optimization)
├─ Task Queue: Bull.js (Redis-backed)
├─ Logging: Winston + Morgan
├─ Error Tracking: Sentry
├─ API Rate Limiting: Express-rate-limit
└─ Deployment: AWS ECS (containerized) or Railway/Render

Database:
├─ Primary: PostgreSQL (Supabase)
├─ Read Replicas: AWS RDS (for scaling)
├─ Cache: Redis (Upstash for serverless)
├─ Search: Elasticsearch (Phase 2)
└─ Backups: Automated daily + point-in-time recovery

AI/ML Services:
├─ Speech-to-Text: Google Cloud Speech-to-Text API
├─ Text Processing: Gemini 2.5 (Google)
├─ Fallback: GPT-4 Turbo (OpenAI)
├─ Similarity: Sentence Transformers (local embedding)
├─ Vector DB: Pinecone (for semantic search, Phase 2)
└─ Local Models: Ollama (for privacy-first deployments)

DevOps & Infrastructure:
├─ Containerization: Docker
├─ Orchestration: Kubernetes (EKS) or simpler: Docker Compose
├─ CI/CD: GitHub Actions (auto-test + deploy)
├─ Infrastructure-as-Code: Terraform
├─ Monitoring: Prometheus + Grafana + Datadog
├─ Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
├─ Alerting: PagerDuty
└─ VCS: GitHub (private repo)

Development Tools:
├─ Package Manager: pnpm (faster than npm)
├─ Linting: ESLint + Prettier
├─ Testing: Jest + React Testing Library (frontend)
├─ Testing: Vitest + Supertest (backend)
├─ E2E Testing: Playwright
├─ Documentation: Swagger/OpenAPI
└─ API Testing: Postman / Insomnia
```

### Database Schema (Key Tables)

```sql
-- Core Users & Auth
├─ users (id, email, name, oauth_provider, created_at)
├─ roles (id, name: "teacher", "student", "admin", "principal")
├─ user_roles (user_id, role_id, school_id)
└─ permissions (role_id, permission_name)

-- Schools & Organization
├─ schools (id, name, logo_url, subscription_tier, created_at)
├─ classes (id, school_id, name, teacher_id, student_count)
├─ student_enrollments (id, student_id, class_id, enrolled_at)
└─ teacher_assignments (id, teacher_id, class_id, subject)

-- Exams & Answers
├─ exams (id, class_id, subject, title, date_created, rubric_id)
├─ exam_papers (id, exam_id, student_id, submission_time)
├─ answers (id, paper_id, answer_text_original, answer_text_ocr, created_at)
└─ answer_images (id, answer_id, image_url, ocr_processed_text)

-- Grading & Feedback
├─ rubrics (id, school_id, name, criteria: JSON, created_by)
├─ rubric_criteria (id, rubric_id, name, weight_percentage, description)
├─ ai_grades (id, answer_id, rubric_id, criterion_id, score_out_of_10, processed_at)
├─ ai_feedbacks (id, answer_id, feedback_text, generated_at, language)
├─ teacher_overrides (id, ai_grade_id, teacher_id, new_score, override_reason)
└─ plagiarism_scores (id, answer_id, similarity_percentage, sources_matched)

-- Analytics & Reporting
├─ grade_submissions (id, exam_id, total_students, grades_json, submitted_at)
├─ class_analytics (id, class_id, exam_id, avg_score, score_distribution)
├─ student_progress (id, student_id, subject, avg_grade_over_time, trend)
└─ teacher_metrics (id, teacher_id, exams_graded, avg_grading_time, consistency_score)

-- Integrations & Sync
├─ lms_integrations (id, school_id, lms_type: "google_classroom", "canvas", api_token)
├─ sis_integrations (id, school_id, sis_type: "powerschool", "infinite_campus", api_token)
├─ synced_grades (id, exam_id, lms_id, sync_status: "pending", "synced", "failed")
└─ api_keys (id, user_id, key_hash, created_at, last_used_at)

-- Billing & Subscriptions
├─ subscriptions (id, school_id, tier: "free", "educator", "professional", renewal_date)
├─ invoices (id, school_id, amount, status: "paid", "pending", issue_date)
├─ usage_metrics (id, school_id, exams_created, papers_processed, month)
└─ payment_methods (id, school_id, stripe_customer_id, card_last_4)

-- Audit & Compliance
├─ audit_logs (id, user_id, action: "grade_created", "student_grade_viewed", timestamp)
├─ data_access_logs (id, user_id, data_type: "student_grade", accessed_at, ip_address)
└─ compliance_reports (id, school_id, report_type: "ferpa_audit", "gdpr_dpia", generated_at)
```

---

## 6. USER EXPERIENCE & DESIGN PRINCIPLES

### Design System

**Color Palette** (Inherited from EduGrade):
```
Primary Colors:
├─ Teal: #208090 (actions, buttons, highlights)
├─ Background: #FFFCF9 (light cream, for reduced eye strain)
└─ Text: #1F2121 (dark gray, for readability)

Secondary Colors:
├─ Success (green): #32B8C6 (grade achieved)
├─ Warning (yellow): #E68161 (needs attention)
├─ Error (red): #FF5459 (plagiarism, issues)
├─ Info (blue): #627C71 (information, help)
└─ Neutral (gray): #A7A9A9 (borders, disabled states)

Dark Mode:
├─ Background: #1F2121
├─ Surface: #262828
├─ Text: #F5F5F5
└─ Accent: #32B8C6 (brighter teal)
```

**Typography**:
```
Font Family: System fonts + Inter/Open Sans (fallback)
├─ Headings: Semi-bold (550-600), 24-32px
├─ Body: Regular (400), 14px, line-height 1.5
├─ Buttons: Medium (500), 14px
├─ Monospace: Monaco, Menlo, Courier (for code snippets)
└─ Min font size: 12px (for secondary text)
```

**Spacing & Grid**:
```
8px base unit (multiples: 8, 16, 24, 32, 48, 64)
├─ Padding: 16px (default section), 24px (card), 8px (button)
├─ Margin: 16px (block separation), 8px (inline)
├─ Gap: 16px (flex/grid default)
└─ Grid: 12-column responsive (mobile: full width, tablet: 6-col, desktop: 12-col)
```

**Components & Patterns**:
```
Pre-built Components (Shadcn/UI):
├─ Buttons (Primary, Secondary, Outline, Ghost sizes)
├─ Input fields (Text, Textarea, Select, Checkbox, Radio)
├─ Cards (with header, body, footer)
├─ Tables (sortable, filterable)
├─ Modals (for confirmations, forms)
├─ Notifications (toast alerts, in-page alerts)
├─ Dropdowns (with icons, groups)
├─ Tabs (for switching contexts)
├─ Progress bars (for uploads, grading status)
├─ Badges (for tags, status)
└─ Tooltips (for explanations)
```

### Key UX Flows

**Simplicity First**:
- Onboarding wizard (3 steps max to first grading)
- Sensible defaults (pre-filled forms)
- Progressive disclosure (show advanced options when needed)
- Undo/redo support (no data loss anxiety)

**Accessibility**:
- WCAG 2.1 Level AA compliance
- Keyboard navigation (all features accessible via Tab)
- Screen reader support (ARIA labels, semantic HTML)
- Color contrast: 4.5:1 (normal text), 3:1 (large text)
- Focus indicators: Clear, visible rings

**Mobile-First Design**:
- Responsive layout (works on phone, tablet, desktop)
- Touch-friendly buttons (min 48x48px)
- Simplified navigation (hamburger menu on mobile)
- Optimized forms (single column, larger inputs)

---

## 7. FUNCTIONAL REQUIREMENTS (DETAILED SPECS)

### Feature: Answer Upload & Processing (FR-001)

**Requirement**: Enable teachers to upload student answers in multiple formats (digital, scanned, handwritten)

**User Stories**:
```
US-001: As a teacher, I want to upload a ZIP file containing 40 scanned exam papers
        so that I don't have to upload each one individually.
        Acceptance Criteria:
        ├─ User can drag-drop a ZIP file
        ├─ System extracts all images/PDFs
        ├─ Shows progress: "Uploading 40 files..."
        ├─ Validates each file (must be PDF/JPG/PNG)
        ├─ Skips unsupported formats with warning
        └─ Completes in <2 minutes for 40 files

US-002: As a teacher, I want the system to recognize handwritten answers 
        and convert them to digital text so that I can grade them in MARK AI.
        Acceptance Criteria:
        ├─ User uploads handwritten paper image
        ├─ System runs OCR (Google Vision API)
        ├─ Shows confidence score (e.g., "95% confidence")
        ├─ Allows manual correction if OCR errors detected
        ├─ Stores both original image + OCR text
        └─ Processing time: <1 min per image

US-003: As a student, I want to submit my typed answer via MARK AI
        so that I can get instant feedback.
        Acceptance Criteria:
        ├─ Student can type answer directly in text box
        ├─ Supports rich text (bold, italics, lists)
        ├─ Can paste from Word or Google Docs
        ├─ Auto-saves as draft every 10 seconds
        ├─ Character count visible (if limit set by teacher)
        └─ Submit button only active if content entered
```

**Technical Requirements**:
```
API Endpoints:
POST /api/answers/upload
├─ Body: FormData { file: File, exam_id: string }
├─ Response: { upload_id: string, status: "uploading", progress: 0 }
├─ Rate limit: 10 files/minute per user
└─ Max file size: 50MB per file

POST /api/answers/process-ocr
├─ Body: { answer_id: string, image_url: string }
├─ Processing: Calls Google Cloud Vision API
├─ Response: { ocr_text: string, confidence: 0.95, image_url: string }
└─ Max pages per job: 100

POST /api/answers/submit
├─ Body: { exam_id, answer_text, student_id }
├─ Validation: Text length > 10 chars
├─ Response: { answer_id, timestamp, status: "submitted" }
└─ Idempotency: Same submission = same answer_id

Database:
- Store original file + OCR output separately
- Index by exam_id + student_id for fast retrieval
- Soft delete on manual removal (audit trail)
- Archive old uploads to S3 after 30 days (cost optimization)
```

### Feature: AI Grading Engine (FR-002)

**Requirement**: Grade student answers using AI based on teacher-defined rubrics

**User Stories**:
```
US-004: As a teacher, I want the AI to grade 40 exam papers in <5 minutes
        so that I can review grades and release them to students today.
        Acceptance Criteria:
        ├─ Teacher clicks "Grade All" button
        ├─ System shows: "Grading 40 papers... (3/40 completed)"
        ├─ All papers graded within 5 minutes
        ├─ Each paper gets: score, criterion breakdown, feedback
        ├─ Processing runs in background (doesn't block teacher)
        └─ Email notification when complete

US-005: As a teacher, I want the AI to match my rubric closely
        so that the grades feel fair and accurate.
        Acceptance Criteria:
        ├─ AI grades match teacher grades ±1 point (90%+ of time)
        ├─ Teacher can provide feedback on AI grades
        ├─ System learns from teacher corrections (adaptive)
        ├─ After 20 corrections, accuracy improves visibly
        └─ Monthly accuracy report emailed to teacher

US-006: As a teacher, I want to provide a model answer so the AI 
        knows what a perfect response looks like.
        Acceptance Criteria:
        ├─ Teacher pastes model answer in text box
        ├─ Or: Selects from uploaded documents
        ├─ AI uses model answer as reference for grading
        ├─ Can update model answer anytime (re-grades affected papers)
        └─ Model answer stored per exam
```

**Technical Requirements**:
```
API Endpoints:
POST /api/grades/process-batch
├─ Body: { exam_id: string, model_answer_id?: string }
├─ Processing: Queues Bull.js job for each answer
├─ Response: { batch_id, status: "processing", eta_seconds: 300 }
└─ Notification: WebSocket update every 10 seconds

GET /api/grades/:exam_id
├─ Response: [ { answer_id, student_id, score, criteria: [ { name, score } ], feedback } ]
├─ Includes: plagiarism score, ocr_confidence
└─ Sorting: By score (desc), by student name

PATCH /api/grades/:grade_id
├─ Body: { score?: 8.5, feedback?: "text", teacher_notes: "text" }
├─ Records: Teacher override in audit log
├─ Triggers: Recompute batch average
└─ Notification: Student gets updated grade + feedback

AI Model Specifications:
├─ Model: Gemini 2.5 (primary), GPT-4 Turbo (fallback)
├─ Prompt Template:
│  "Grade the following student answer based on the rubric:
│   Rubric:
│   - Concept Understanding (40%): {criterion description}
│   - Problem-Solving (40%): {criterion description}
│   - Presentation (20%): {criterion description}
│
│   Model Answer: {model_answer}
│   Student Answer: {student_answer}
│
│   Provide JSON output:
│   {
│     "overall_score": 8.5,
│     "criteria": [
│       {"name": "Concept Understanding", "score": 9, "feedback": "..."},
│       {"name": "Problem-Solving", "score": 8, "feedback": "..."},
│       {"name": "Presentation", "score": 8, "feedback": "..."}
│     ]
│   }"
├─ Temperature: 0.3 (low randomness, consistent)
├─ Max tokens: 500 per response
├─ Retry: 3 attempts if API fails
├─ Timeout: 30 seconds per answer
├─ Cost: ~₹0.50-1 per answer (Gemini is cheaper)
└─ Caching: Same rubric + answer = cached response (Redis)
```

### Feature: Plagiarism Detection (FR-003)

**Requirement**: Detect copied/plagiarized student answers

**User Stories**:
```
US-007: As a teacher, I want to know if a student copied from a previous
        submission or from the internet so I can uphold academic integrity.
        Acceptance Criteria:
        ├─ AI checks answer against: model answer, previous submissions, web
        ├─ Returns: Similarity score (0-100%), sources matched
        ├─ Highlights: Copied sections in red
        ├─ Configurable threshold (e.g., >70% = flag)
        ├─ One-click flag: "Mark as plagiarism" (creates warning)
        └─ Report: Teacher can export plagiarism analysis

US-008: As a school admin, I want to see plagiarism reports to ensure
        academic integrity across the school.
        Acceptance Criteria:
        ├─ Dashboard: Plagiarism trends (# flagged by month)
        ├─ List: Flagged submissions with % similarity
        ├─ Action: Bulk export plagiarism report
        └─ Archive: Plagiarism flags stay in audit log
```

**Technical Requirements**:
```
Plagiarism Scoring Methods:

1. Similarity to Model Answer (Semantic)
   ├─ Tool: Sentence Transformers (all-MiniLM-L6-v2)
   ├─ Method: Cosine similarity between embeddings
   ├─ Score: 0-1 (convert to 0-100%)
   ├─ Threshold: >0.7 (70%) = yellow flag
   └─ Processing: <1 sec per answer (local model)

2. Similarity to Previous Submissions (DB lookup)
   ├─ Query: All answers from same exam + class over past 2 years
   ├─ Compare: Current student answer vs historical answers
   ├─ Score: % of identical sentences/phrases
   ├─ Threshold: >0.5 (50%) = orange flag
   └─ Processing: <2 sec (DB indexed)

3. Web Content Matching (Optional, Phase 2)
   ├─ Tool: Copyscape API or similar
   ├─ Cost: $1-5 per check (enable for Pro tier +)
   ├─ Latency: 10-30 sec (external service)
   └─ Threshold: >0.3 (30%) = red flag

Final Score Calculation:
├─ Model answer similarity: 40% weight
├─ Historical submissions: 50% weight
├─ Web content: 10% weight (if enabled)
└─ Combined: Weighted average (0-100%)

Color Coding:
├─ Green (0-30%): Original, no concern
├─ Yellow (31-60%): Paraphrased, some caution
├─ Orange (61-80%): Significant similarity, investigate
└─ Red (81-100%): Likely copied, action needed

API Endpoint:
POST /api/plagiarism/check
├─ Body: { answer_id: string }
├─ Response: {
│   similarity_score: 85,
│   breakdown: {
│     model_answer: 75,
│     historical: 85,
│     web: 10 (optional)
│   },
│   matched_sources: [
│     { source: "Previous submission by Raj Kumar", similarity: 85 },
│     { source: "Wikipedia article on Topic X", similarity: 10 }
│   ],
│   flagged: true,
│   highlighted_sections: [ { text: "...", color: "red" } ]
├─ Caching: Cache results for 7 days (no need to recheck)
└─ Audit log: Track who checked, when, results

Database:
├─ plagiarism_scores table: answer_id, score, sources_json, checked_at, teacher_id
├─ plagiarism_flags table: answer_id, flag_reason, action_taken, resolved_by
└─ Index: exam_id, school_id for quick filtering
```

---

## 8. NON-FUNCTIONAL REQUIREMENTS

### Performance Requirements

```
Response Times (API):
├─ Page load (initial): <2 sec (LCP - Largest Contentful Paint)
├─ API response (p95): <200ms for CRUD operations
├─ Grading processing: <30 sec per answer (AI call timeout)
├─ Batch grading: <5 min for 50 papers
├─ Image upload: <3 sec for 50MB file
├─ Report generation: <30 sec for 100-page PDF
└─ Search results: <500ms for indexed queries

Scalability Targets:
├─ Concurrent users: 500 initially, 5,000 by Year 2
├─ API calls/sec: 100 rps initially, 1,000+ rps by Year 2
├─ DB connections: 100 initially, 500 by Year 2
├─ Storage: 100GB initially, 10TB by Year 3 (archive policy)
└─ AI API calls/day: 100K initially, 5M by Year 2

Infrastructure Scaling:
├─ Frontend: Vercel auto-scales (serverless)
├─ Backend: ECS auto-scaling (min 2, max 10 instances)
├─ Database: PostgreSQL read replicas (1 primary, 2 read replicas)
├─ Cache: Redis cluster (3 nodes minimum)
├─ Storage: S3 with CloudFront CDN
└─ Load balancer: AWS ALB (auto health checks)
```

### Availability & Reliability

```
Uptime SLA:
├─ Free tier: Best effort (no SLA)
├─ Educator tier: 99.5% uptime (2.4 hrs downtime/month)
├─ Professional tier: 99.9% uptime (44 min downtime/month)
└─ Enterprise tier: 99.95% uptime (22 min downtime/month) + on-call support

Disaster Recovery:
├─ RTO (Recovery Time): <1 hour
├─ RPO (Recovery Point): <15 minutes
├─ Backup frequency: Hourly (automated)
├─ Backup locations: Multi-region (AWS + GCS)
├─ Restore testing: Monthly (scheduled maintenance)
└─ Failover: Automatic to standby in <5 min

Error Handling:
├─ Graceful degradation: If AI fails, return basic score (not blank)
├─ Retry logic: 3 retries with exponential backoff (1s, 3s, 9s)
├─ Circuit breaker: Stop calling failed API for 5 min, then retry
├─ Error logging: All errors logged to Sentry with context
└─ Alerting: PagerDuty alert if error rate >1%
```

### Security Requirements

```
Authentication:
├─ OAuth 2.0 (Google, Microsoft, GitHub)
├─ Email/password (salted bcrypt, 12 rounds)
├─ JWT tokens: Access (15 min), Refresh (7 days)
├─ Multi-factor authentication (2FA): TOTP (Google Authenticator)
├─ Session timeout: 30 min of inactivity
└─ API keys: Issued per user, can be revoked anytime

Authorization:
├─ Role-based access control (RBAC)
├─ Row-level security (RLS) in PostgreSQL
├─ Principle of least privilege (no excessive permissions)
├─ API scope limiting (e.g., teacher can only access own students)
└─ Audit logging: Every access logged with user, action, timestamp

Data Protection:
├─ Encryption at rest: AES-256 (AWS KMS or Supabase)
├─ Encryption in transit: TLS 1.3
├─ Certificate: Let's Encrypt (auto-renewal)
├─ No plaintext storage of passwords, API keys, tokens
├─ PII redaction in logs (emails, IPs hashed)
└─ Data deletion: Soft delete (30-day grace period for recovery)

GDPR / Privacy Compliance:
├─ Consent management: Explicit opt-in for marketing emails
├─ Right to deletion: Delete all personal data within 30 days
├─ Right to access: Download data in CSV format
├─ Data portability: Export grades, profiles to standard formats
├─ Privacy policy: Clear, transparent, updated annually
├─ Data processing agreement (DPA): For enterprise customers
└─ No third-party sharing: Data not sold to marketers

FERPA Compliance (US, Phase 2):
├─ Student records protected (access logged)
├─ Parent/Guardian access controlled
├─ Audit trails: Who accessed what, when
├─ Data retention: Per school policy (default 5 years post-graduation)
└─ Secure disposal: Cryptographic erasure

SOC 2 Certification:
├─ Scope: Security, availability, processing integrity, confidentiality
├─ Audit: Annual by Big 4 firm (Deloitte, EY, KPMG)
├─ Controls: Technical, operational, process level
└─ Timeline: Target Q4 2026 (Year 1 end)

Vulnerability Management:
├─ Automated scanning: Snyk (dependencies), OWASP ZAP (app)
├─ Manual penetration testing: Annual (external firm)
├─ Bug bounty: Launch Phase 2 (HackerOne or Bugcrowd)
├─ Dependency updates: Automated via Dependabot
├─ Security patches: Applied within 24 hours (critical)
└─ Incident response: 1-hour response SLA (P1), 4-hour (P2)
```

---

## 9. SUCCESS METRICS & KPIs

### Product Metrics (User Engagement)

```
Teacher Adoption:
├─ DAU (Daily Active Users): % of invited teachers using daily
│  └─ Target: 60%+ by Month 3
├─ Grading frequency: # of exams graded per teacher/month
│  └─ Target: 8-10 exams/month (average)
├─ Feature usage: % using advanced features (rubric customization, etc.)
│  └─ Target: 70%+ using custom rubrics
└─ NPS (Net Promoter Score): Likelihood to recommend (0-10 scale)
   └─ Target: 50+ (excellent for B2B SaaS)

Student Engagement:
├─ Grade view rate: % of students who view their feedback
│  └─ Target: 85%+
├─ Resubmission rate: % of students who resubmit after feedback
│  └─ Target: 40-50%
├─ Session length: Avg time spent on platform/month
│  └─ Target: 20 min/month (low friction, high value)
└─ Retention: % of students active next month
   └─ Target: 90%+ (school-retained)
```

### Business Metrics (Growth & Revenue)

```
Acquisition:
├─ Free signups: # of new free users/month
│  └─ Target Month 1: 5,000, ramping to 50,000/month
├─ Paid schools: # of schools with active subscription
│  └─ Target: 100 by Month 3, 1,500 by Month 12
├─ CAC (Customer Acquisition Cost): Marketing spend per acquired school
│  └─ Target: ₹2,000-3,000 (acceptable at ₹5,000+ LTV)
└─ CAC payback period: Months to recover CAC via revenue
   └─ Target: <12 months

Monetization:
├─ MRR (Monthly Recurring Revenue): Total recurring revenue
│  └─ Target: ₹10 lakhs Month 3, ₹80 lakhs Month 12
├─ ARR (Annual Recurring Revenue): Annualized revenue
│  └─ Target: ₹175+ lakhs by Month 12
├─ ARPU (Average Revenue Per User): Revenue per school/teacher
│  └─ Target: ₹5,000-15,000/school/year
└─ Gross margin: (Revenue - COGS) / Revenue
   └─ Target: 70%+ (high-margin SaaS)

Retention:
├─ MRR churn: % of revenue lost month-over-month
│  └─ Target: <5% monthly (<50% annual)
├─ Renewal rate: % of annual contracts renewed
│  └─ Target: 85%+ (industry benchmark 80-90%)
├─ Expansion revenue: Revenue from upsells/add-ons
│  └─ Target: 25% of new revenue
└─ Net Revenue Retention (NRR): (Start MRR + expansion - churn) / Start MRR
   └─ Target: 110%+ (indicates strong product-market fit)
```

### Learning Outcome Metrics (Student Success)

```
Academic Performance:
├─ Grade improvement: Avg grade change pre/post MARK AI
│  └─ Target: +0.8-1.2 grade points over 6 months
├─ Assignment completion: % of assignments submitted (vs baseline)
│  └─ Target: +15% increase in submissions
├─ Test scores: Improvement in actual board/standardized exams
│  └─ Target: +5-10% improvement in school average
└─ Student satisfaction: % rating MARK AI 4/5+ stars
   └─ Target: 75%+ student satisfaction

Engagement Metrics:
├─ Resubmission participation: % of students who resubmit
│  └─ Target: 40-50% of offered opportunities
├─ Feedback utilization: % who apply feedback to next assignment
│  └─ Target: 60%+ incorporate feedback
└─ Learning velocity: Time to mastery of concept
   └─ Target: 20% faster mastery (measured by pre/post concept tests)

Equity Metrics:
├─ Grade distribution fairness: Std dev of grades by teacher
│  └─ Target: Normalize grade distributions (detect outliers)
├─ Demographic parity: Grade distribution by gender, socioeconomic
│  └─ Target: No >5% bias in grading
└─ Accessibility: % of students with accommodations successful
   └─ Target: 90%+ satisfaction among students with disabilities
```

### Operational Metrics (Quality & Health)

```
System Quality:
├─ Uptime: % of time system is available
│  └─ Target: 99.5%+ (complies with SLA)
├─ Error rate: % of API calls that fail
│  └─ Target: <0.1% (industry benchmark)
├─ Grading accuracy: % of AI grades matching teacher grades ±1 point
│  └─ Target: 92-95%
└─ OCR accuracy: % of text correctly recognized from images
   └─ Target: 95%+ for clear handwriting

Cost Efficiency:
├─ Cost per graded paper: Total costs / papers processed
│  └─ Target: ₹0.50-1.00 per paper
├─ Cost per student outcome: Total costs / learning gains measured
│  └─ Target: Positive ROI within 6 months
├─ LTV/CAC ratio: Lifetime value / customer acquisition cost
│  └─ Target: 5-10x (excellent for SaaS)
└─ Cloud spend: Monthly infrastructure costs
   └─ Target: <₹5 lakhs/month for 1,500 schools
```

---

## 10. ROADMAP & FEATURE TIMELINE

### Phase 0: MVP (Weeks 1-12, Launch)

**Core Deliverables** (LIVE NOW):
- ✅ Answer upload & OCR processing
- ✅ AI grading engine (Gemini-based)
- ✅ Feedback generation
- ✅ Basic plagiarism detection
- ✅ Teacher dashboard (grading console)
- ✅ Student dashboard (feedback view)
- ✅ Basic admin dashboard
- ✅ Google Classroom integration
- ✅ Multi-language support (4 languages)
- ✅ Freemium pricing tier

**Target Metrics**:
- 100 beta schools
- 5,000 answer papers graded
- 80%+ teacher satisfaction
- 90%+ uptime

---

### Phase 1: Pro Features (Weeks 13-26, Months 2-3)

**New Features**:
- [ ] Advanced rubric templates (pre-built by subject)
- [ ] Rubric version control (track changes)
- [ ] Custom glossary (domain-specific terms)
- [ ] Team collaboration (co-grading, approvals)
- [ ] Mobile app (iOS/Android basic)
- [ ] Live grading dashboard (real-time exam monitoring)
- [ ] Student resubmission workflow
- [ ] Class analytics (trends, comparisons)
- [ ] Parent portal (view child's grades)
- [ ] SIS integrations (PowerSchool, Infinite Campus)
- [ ] Advanced export (PDF reports, SIS sync)
- [ ] Multi-subject support (expand from 4 to 12 rubric types)

**Business Goals**:
- 5,000 paying schools
- MRR: ₹15 lakhs
- Free-to-paid conversion: 5%
- Churn: <8%

---

### Phase 2: Enterprise & Scale (Weeks 27-52, Months 4-6)

**New Features**:
- [ ] White-label option (custom domain, branding)
- [ ] API (REST, webhooks, batch processing)
- [ ] Advanced plagiarism (cross-institutional checks)
- [ ] Bias & fairness detection
- [ ] Teacher professional development (adaptive coaching)
- [ ] Automated translation (answer + feedback)
- [ ] Live captioning (for oral exams, vivas)
- [ ] Compliance reporting (FERPA, audit trails)
- [ ] Advanced security (SSO, SAML, encryption)
- [ ] Multi-workspace (department-level management)

**Business Goals**:
- 8,000 schools
- MRR: ₹40 lakhs
- Enterprise customers: 50+
- Accuracy: 95%+

---

### Phase 3: Market Leadership (Year 2, Months 7-12)

**Advanced Features**:
- [ ] AI question generation (create practice problems)
- [ ] Predictive student success model (intervention alerts)
- [ ] Government board partnerships (CBSE, state boards)
- [ ] Voice-based feedback (teacher dictates, AI transcribes)
- [ ] Community features (rubric marketplace, best practices)
- [ ] Advanced analytics (district-level dashboards)
- [ ] Custom AI model training (school-specific fine-tuning)
- [ ] International expansion (UK, Africa, SEA)

**Business Goals**:
- 25,000 schools
- MRR: ₹1+ crore
- Profitability: Positive EBITDA
- Valuation: $100M+

---

### 6-Month Execution Timeline (Detailed)

```
MONTH 1 (Jan-Feb 2026):
├─ Week 1-2: Bug fixes from beta feedback, stability improvements
├─ Week 3-4: Advanced rubric templates launch
├─ Milestones:
│  ├─ 100 beta schools → 300 schools
│  ├─ MRR: ₹2 lakhs
│  └─ Free users: 20,000
└─ Focus: Stability, teacher adoption

MONTH 2 (Feb-Mar 2026):
├─ Week 5-6: Mobile app v1 (iOS/Android)
├─ Week 7-8: Team collaboration features
├─ Week 9-10: PowerSchool SIS integration
├─ Milestones:
│  ├─ Schools: 1,000
│  ├─ MRR: ₹10 lakhs
│  └─ Teachers: 10,000
└─ Focus: Growth, integrations

MONTH 3 (Mar-Apr 2026):
├─ Week 11-12: Parent portal launch
├─ Week 13-14: Advanced analytics + AI-generated practice problems
├─ Week 15-16: Expand to 8 languages
├─ Milestones:
│  ├─ Schools: 2,000
│  ├─ MRR: ₹20 lakhs
│  └─ Students: 500,000
└─ Focus: Feature richness, expansion

MONTH 4 (Apr-May 2026):
├─ Week 17-18: API launch (REST, webhooks, batch processing)
├─ Week 19-20: White-label infrastructure
├─ Week 21-22: Enterprise security (SSO, encryption)
├─ Milestones:
│  ├─ Schools: 3,500
│  ├─ MRR: ₹35 lakhs
│  ├─ Enterprise customers: 10+
│  └─ API calls: 1M/day
└─ Focus: Enterprise sales, partnerships

MONTH 5 (May-Jun 2026):
├─ Week 23-24: Live captioning (for oral exams)
├─ Week 25-26: Compliance certifications (SOC 2 Type II audit)
├─ Week 27-28: Advanced plagiarism (cross-institutional)
├─ Milestones:
│  ├─ Schools: 5,000
│  ├─ MRR: ₹50 lakhs
│  ├─ ARR: ₹600 lakhs+ (annualized)
│  └─ Enterprise contracts: ₹5+ lakhs/month
└─ Focus: Enterprise maturity, compliance

MONTH 6 (Jun-Jul 2026):
├─ Week 29-30: Government partnerships (CBSE pilot)
├─ Week 31-32: International expansion planning (UK, India expansion)
├─ Week 33-34: Voice-based feedback feature
├─ Milestones:
│  ├─ Schools: 6,000
│  ├─ MRR: ₹60-80 lakhs
│  ├─ Students: 1.5M+
│  └─ Teacher satisfaction: NPS 50+
└─ Focus: Market leadership, expansion
```

---

## 11. GO-TO-MARKET STRATEGY

### Product Launch (Phase 0)

**Launch Announcement**:
- Press release (TechCrunch, EdTech Magazine, Indian EdNews)
- Product Hunt launch (target top 5)
- LinkedIn announcement (founder + company page)
- Email to founder network
- Twitter/X campaign with behind-the-scenes content

**Launch Partner Schools**:
- 20-30 beta schools pre-seeded (early access)
- Video case studies (teacher testimonials)
- 3 detailed case studies (time saved, grade improvement, feedback quality)

**Initial Marketing** (Months 1-3):
```
Organic:
├─ Blog: "How AI Is Revolutionizing Assessment in India" (SEO-optimized)
├─ YouTube: Teacher walkthrough (5-10 min tutorials)
├─ Twitter: Daily tips for teachers about assessment
├─ LinkedIn: Long-form content about EdTech trends
└─ Guest articles: Contribute to EdTech publications

Paid (Small Budget - ₹2-5 lakhs):
├─ Google Ads: "AI grading tool India", "automatic essay grader"
├─ Facebook/Instagram: Retarget website visitors + teacher audience
├─ LinkedIn: B2B ads targeting education decision-makers
└─ Influencer partnerships: EdTech YouTubers, teacher TikTok creators

Partnerships:
├─ CBSE associations (pitch as assessment partner)
├─ Teacher training institutes (demo at workshops)
├─ Education NGOs (subsidized access for nonprofit schools)
└─ EdTech platforms (white-label partnerships)
```

### Sales Strategy (By Segment)

**Segment 1: Urban Private Schools (DIY Sales)**
```
Inbound (Organic):
├─ Free trial: 14-day full access (no CC required)
├─ Onboarding: 30-min call with school admin
├─ Case study sharing: Show similar school results
└─ Conversion target: 5-10% trial → paid

Outbound:
├─ Email list: Build list of 5K+ schools (via public databases)
├─ Personalized email: "We saved 20 hours/week for teachers at X School"
├─ LinkedIn: Cold message principals/vice principals
├─ Phone calls: Outbound sales team (₹10 lakhs salary)
└─ Conversion target: 1-2% outreach → trial → paid
```

**Segment 2: EdTech Platforms (Enterprise Sales)**
```
Approach:
├─ Research: 50 major platforms (BYJU's, Unacademy, Physics Wallah, etc.)
├─ Outreach: VP Product / CTO at each platform
├─ Pitch: "We grade essays at scale, you focus on teaching"
├─ Demo: 30-min technical demo (grading quality, speed, API)
├─ Negotiation: Custom contract (₹50 lakh - ₹5 crore/year)
└─ Timeline: 3-6 months sales cycle

Value Prop:
├─ Cost per student reduced 70%
├─ Grading accuracy 95%+
├─ Instant feedback improves retention
└─ API integration with their platform
```

**Segment 3: Coaching Institutes (Direct Sales)**
```
Approach:
├─ Email: Pitch as "NEET/JEE prep efficiency tool"
├─ Meeting: 15-min demo (show 50 papers graded in 5 min)
├─ Pricing: Simple per-center pricing (₹500-2,000/month)
└─ Conversion: Fast (decision-makers are founders, not committees)

Partnership:
├─ Referral: "Bring 3 friends, get 20% discount"
├─ Affiliate: Coaching chains resell as their own (white-label)
└─ Volume discount: Bigger discounts for 100+ centers
```

### Sales Metrics & Targets

```
Month 1: Awareness & Validation
├─ Free signups: 5,000
├─ Paid schools: 50
├─ MRR: ₹2-3 lakhs
└─ Cost: ₹50 lakhs (mostly infrastructure, minimal marketing)

Month 3: Growth Phase
├─ Free signups: 20,000 cumulative
├─ Paid schools: 500
├─ MRR: ₹10 lakhs
├─ CAC: ₹3,000 per school
└─ Cost: ₹75 lakhs

Month 6: Scale Phase
├─ Free signups: 50,000 cumulative
├─ Paid schools: 2,000
├─ MRR: ₹50-80 lakhs
├─ CAC: ₹2,500 per school
├─ LTV: ₹50,000+ per school
└─ Cost: ₹100 lakhs (higher marketing spend)
```

---

## 12. RISK MANAGEMENT & MITIGATION

### Technical Risks

```
Risk 1: AI Grading Accuracy Lower Than 90%
├─ Impact: Teachers don't trust AI, adoption fails
├─ Mitigation:
│  ├─ Extensive testing with teacher rubrics (100+ exams)
│  ├─ Human-in-loop: Teacher approves all grades before student release
│  ├─ Fallback: If accuracy <90%, don't auto-suggest scores
│  └─ Continuous improvement: Learn from teacher corrections
└─ Likelihood: LOW (Gemini 2.5 is strong, we've tested with real rubrics)

Risk 2: OCR Fails for Handwritten Answers (< 90% accuracy)
├─ Impact: Can't process scanned exams, market fit breaks
├─ Mitigation:
│  ├─ Hybrid approach: OCR + manual teacher correction option
│  ├─ Fallback to Google Vision API (best-in-class)
│  ├─ Manual mode: Teacher can type/paste if OCR fails
│  └─ Training data: Fine-tune OCR on regional scripts
└─ Likelihood: MEDIUM (but mitigated with fallbacks)

Risk 3: Data Loss or Corruption
├─ Impact: Student data lost, trust destroyed, legal liability
├─ Mitigation:
│  ├─ Multi-region backups (AWS + Google Cloud)
│  ├─ Hourly backups with point-in-time recovery
│  ├─ Monthly restore testing (ensure backups work)
│  ├─ Encrypted backups (AES-256)
│  └─ Insurance: Cyber liability insurance
└─ Likelihood: LOW (with proper architecture)

Risk 4: Security Breach or Data Leak
├─ Impact: PII exposed, regulatory fines, reputation damage
├─ Mitigation:
│  ├─ Penetration testing (quarterly)
│  ├─ Bug bounty program (HackerOne)
│  ├─ Compliance certifications (SOC 2, GDPR-ready)
│  ├─ Encrypted data at rest + in transit
│  ├─ Incident response plan (24-hour response)
│  └─ Insurance: Cyber liability + E&O insurance
└─ Likelihood: LOW (with security best practices)
```

### Business Risks

```
Risk 5: Teacher Adoption Lower Than 50%
├─ Impact: Can't demonstrate ROI, churn increases, growth stalls
├─ Mitigation:
│  ├─ Extensive user testing with real teachers (iterative)
│  ├─ Free trial (14 days, no barriers)
│  ├─ Onboarding calls (ensure teacher success)
│  ├─ Dedicated support (quick response to issues)
│  ├─ Community & best practices sharing (build network)
│  └─ Measure NPS (target 50+) and act on feedback
└─ Likelihood: MEDIUM (EdTech adoption is notoriously slow)

Risk 6: Competitive Threat (Gradescope, Turnitin launch India features)
├─ Impact: Price war, margin compression, market share loss
├─ Mitigation:
│  ├─ Move fast: Build unique features (speaker ID, live captioning) first
│  ├─ Network effects: Build teacher community, rubric marketplace
│  ├─ Lock-in: Integrate deeply with schools (SIS, LMS)
│  ├─ Pricing: Offer 30-50% discount if switching from competitors
│  └─ Partner: Partner with EdTech platforms (make hard to replace)
└─ Likelihood: HIGH (inevitable as market grows)

Risk 7: Regulatory Changes (GDPR, FERPA, Indian privacy laws)
├─ Impact: Compliance costs increase, deployment delays
├─ Mitigation:
│  ├─ Privacy by design: Build compliance into architecture from day 1
│  ├─ Legal review: Quarterly legal audit by data privacy lawyers
│  ├─ Compliance roadmap: Plan ahead for FERPA, COPPA (if US expansion)
│  ├─ Insurance: Cyber liability covers regulatory fines
│  └─ Transparency: Clear privacy policy + data processing agreements
└─ Likelihood: MEDIUM (privacy laws evolving globally)

Risk 8: Teacher Burnout / Resistance (Fear of AI replacing jobs)
├─ Impact: Negative sentiment, slower adoption, teacher unions pressure
├─ Mitigation:
│  ├─ Marketing: Position as "teacher superpower" not "teacher replacement"
│  ├─ Transparency: Show AI improves teaching quality (better feedback)
│  ├─ Involvement: Let teachers customize AI (rubrics, feedback tone)
│  ├─ Support: Provide training + ongoing support (not abandoned)
│  └─ Data: Share research on learning improvements (teacher impact)
└─ Likelihood: MEDIUM (real concern in education sector)

Risk 9: Funding Shortfall or Inability to Raise Series A
├─ Impact: Can't hire team, product stalls, company fails
├─ Mitigation:
│  ├─ Bootstrap: Achieve profitability before Series A (if possible)
│  ├─ Conservative burn: <₹50 lakhs/month until revenue covers
│  ├─ Revenue focus: Prioritize early paying customers (not just free users)
│  ├─ Multiple sources: Angel investors + VC + government grants
│  └─ Pivot option: White-label to EdTech (if direct school sales slow)
└─ Likelihood: MEDIUM (startup funding is uncertain)
```

### Operational Risks

```
Risk 10: Hiring & Team Growth Slower Than Planned
├─ Impact: Features delayed, product stagnates, opportunities missed
├─ Mitigation:
│  ├─ Lean team: Outsource non-core (design, QA, customer support initially)
│  ├─ Competitive comp: Pay market rates (equity + salary)
│  ├─ Culture: Build strong culture (transparent, mission-driven)
│  └─ Advisors: Leverage advisor network for guidance (not just employees)
└─ Likelihood: MEDIUM (India EdTech has talent shortage)

Risk 11: Quality of Feedback Degrades (Students don't find it helpful)
├─ Impact: Adoption decreases, learning outcomes don't improve
├─ Mitigation:
│  ├─ Feedback templates: Pre-built prompts (not just raw AI)
│  ├─ Teacher customization: Teachers refine feedback (not auto-send)
│  ├─ Student feedback loop: Ask students "Was feedback helpful?" (refine model)
│  ├─ Research: Partner with university (measure learning impact)
│  └─ Iteration: A/B test feedback styles (find optimal approach)
└─ Likelihood: LOW (with iterative improvement)
```

---

## CONCLUSION

This PRD provides a **complete product, business, and technical specification for MARK AI**. It serves as the:
- **Source of truth** for product decisions
- **Communication tool** for stakeholders (investors, team, users)
- **Roadmap** for next 12-18 months of development

**Key Takeaways**:
1. **Problem**: Teachers spend 15-25 hours/week grading (major pain)
2. **Solution**: AI grades 90% accurately, 90% faster
3. **Market**: ₹300+ crores TAM in India alone
4. **Differentiation**: Handwritten support + multilingual + affordable
5. **Timeline**: MVP launched, Phase 1 (pro features) in 3 months
6. **Revenue**: ₹175+ lakhs ARR Year 1, ₹600+ lakhs Year 2
7. **Vision**: Become default assessment platform in India & globally

**Next Steps** (Week 1-2):
1. Incorporate this PRD into all team docs
2. Start Phase 1 feature development
3. Recruit beta customer feedback (20+ schools)
4. Finalize pricing + go-to-market messaging
5. Begin fundraising conversations (if needed)

---

**Document Owner**: Product Lead (you)  
**Last Updated**: January 23, 2026  
**Next Review**: Monthly (updated as features ship)
