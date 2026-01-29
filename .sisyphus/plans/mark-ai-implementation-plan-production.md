# MARK AI - Production Implementation Plan
**Version**: 1.0  
**Created**: January 27, 2026  
**Strategy**: Merge Both PRDs (Keep 70% existing + Add missing features)  
**Timeline**: 12 weeks to production

---

## 🎯 EXECUTIVE SUMMARY

**Current State**: 70% complete MVP with working grading + student features  
**Goal**: 100% production-ready platform for Tamil Nadu schools  
**Approach**: Fix UI/UX issues → Add missing features → Test → Deploy

**Key Priorities**:
1. **Week 1-2**: UI/UX consistency (brand, accessibility, components)
2. **Week 3-6**: Core missing features (plagiarism, parent dashboard, admin)
3. **Week 7-10**: Advanced features (multi-language, integrations, NEP compliance)
4. **Week 11-12**: Testing, documentation, production deployment

---

## 📋 PHASE 1: UI/UX FIXES & CONSISTENCY (Week 1-2)

**Goal**: Fix all design system inconsistencies, make visually production-ready

### Task 1.1: Fix Branding & Color System
**Category**: `visual-engineering`  
**Load Skills**: `["frontend-ui-ux"]`

**Files**:
- `app/globals.css`
- `tailwind.config.ts`
- `design-system/mark-ai/MASTER.md`

**Description**:
1. **DECISION REQUIRED**: Choose Teal (#208090) OR Blue (#3B82F6)
   - Recommendation: **Keep Blue** (already implemented, consistent across codebase)
   - Update MARK_AI_PRD.md to reflect Blue as official brand color
2. Update `globals.css` to use semantic color tokens
3. Replace hardcoded Tailwind colors with CSS variables
4. Fix `tailwind.config.ts` type error (line 9)

**Success Criteria**:
- [ ] All color references use CSS variables (--color-primary, etc.)
- [ ] No hardcoded `#3B82F6` or `bg-blue-500` in components
- [ ] Build succeeds with no TypeScript errors
- [ ] MASTER.md matches implemented colors

**Effort**: 4 hours

---

### Task 1.2: Refactor Button Components
**Category**: `visual-engineering`  
**Load Skills**: `["frontend-ui-ux"]`

**Files**:
- `app/dashboard/page.tsx` (lines 119, 125)
- `app/student/dashboard/page.tsx` (line 43)
- `components/ui/button.tsx`

**Description**:
1. Replace all raw `<div>` or `<Link>` styled as buttons with `<Button>` component
2. Ensure all buttons have proper keyboard navigation (`tabIndex` if custom)
3. Add `aria-label` to icon-only buttons
4. Standardize button variants (use existing `liquid`, `neu` from button.tsx)

**Success Criteria**:
- [ ] Zero raw `div` elements with button styling in dashboard pages
- [ ] All buttons focusable via Tab key
- [ ] All icon buttons have aria-label
- [ ] WAVE accessibility tool shows no button errors

**Effort**: 3 hours

---

### Task 1.3: Harmonize Border Radius
**Category**: `quick`  
**Load Skills**: `["frontend-ui-ux"]`

**Files**:
- `components/ui/input.tsx`
- `components/ui/select.tsx`
- `components/ui/textarea.tsx`

**Description**:
1. Change input fields from `rounded-md` (8px) to `rounded-2xl` (24px)
2. Update select dropdowns to match
3. Ensure consistency with Button/Card components

**Success Criteria**:
- [ ] All form inputs use `rounded-2xl`
- [ ] Visual consistency across dashboard

**Effort**: 1 hour

---

### Task 1.4: Add Missing Accessibility Labels
**Category**: `quick`  
**Load Skills**: `[]`

**Files**:
- `app/dashboard/page.tsx` (line 238 - ArrowUpRight icon)
- `app/student/dashboard/page.tsx`
- All components with icon-only buttons

**Description**:
1. Audit all interactive elements for missing `aria-label`
2. Add descriptive labels (e.g., `aria-label="View grading details"`)
3. Ensure screen reader compatibility

**Success Criteria**:
- [ ] WAVE tool shows zero missing label errors
- [ ] Screen reader can navigate all interactive elements

**Effort**: 2 hours

---

## 📋 PHASE 2: MISSING CORE FEATURES (Week 3-6)

**Goal**: Implement critical missing features from both PRDs

### Task 2.1: Plagiarism Detection System
**Category**: `ultrabrain`  
**Load Skills**: `[]`

**Files**:
- `app/api/plagiarism/check/route.ts` (NEW)
- `supabase/schema.sql` (add plagiarism_scores table)
- `supabase/migrations/` (create migration)
- `app/dashboard/grading/[examId]/[sheetId]/grading-interface.tsx` (add UI)

**Description**:
1. **Database**: Create `plagiarism_scores` table
   ```sql
   CREATE TABLE plagiarism_scores (
     id UUID PRIMARY KEY,
     answer_sheet_id UUID REFERENCES answer_sheets(id),
     similarity_score INT, -- 0-100
     model_answer_similarity INT,
     historical_similarity INT,
     web_similarity INT,
     matched_sources JSONB,
     flagged BOOLEAN,
     checked_at TIMESTAMP
   );
   ```

2. **API Endpoint**: `/api/plagiarism/check`
   - Method 1: Similarity to model answer (Sentence Transformers)
   - Method 2: Similarity to previous submissions (DB query)
   - Method 3: Web content (optional, Phase 3)
   - Return: Combined score (0-100%), sources matched

3. **Implementation**:
   - Install `sentence-transformers` (Python microservice OR use Gemini embeddings)
   - Compute cosine similarity between embeddings
   - Store results in database

4. **UI Integration**:
   - Add plagiarism badge to grading interface
   - Color-code: Green (0-30%), Yellow (31-60%), Orange (61-80%), Red (81-100%)
   - Show matched sources
   - Allow teacher to flag/unflag

**Success Criteria**:
- [ ] Database table created and migrated
- [ ] API endpoint returns similarity scores
- [ ] Grading interface shows plagiarism badge
- [ ] Teacher can flag submissions
- [ ] Test with sample answers (known plagiarism case)

**Effort**: 16 hours

---

### Task 2.2: Parent Dashboard
**Category**: `visual-engineering`  
**Load Skills**: `["frontend-ui-ux"]`

**Files**:
- `app/parent/**/*` (NEW - create directory)
- `app/parent/page.tsx` (Overview dashboard)
- `app/parent/[childId]/page.tsx` (Child-specific view)
- `supabase/schema.sql` (add parent_student_mapping table if missing)
- `app/parent/layout.tsx` (Parent-specific layout)

**Description**:
1. **Database**: Ensure `parent_student_mapping` table exists
   ```sql
   CREATE TABLE parent_student_mapping (
     parent_id UUID REFERENCES parents(id),
     student_id UUID REFERENCES students(id),
     relation TEXT CHECK (relation IN ('father', 'mother', 'guardian')),
     PRIMARY KEY (parent_id, student_id)
   );
   ```

2. **Routes**:
   - `/parent` - Overview (list of children)
   - `/parent/[childId]` - Child performance dashboard

3. **Features**:
   - **Overview**: List children with overall average scores
   - **Child View**:
     - Recent exams (last 5)
     - Performance trends (line chart)
     - Strengths/weaknesses
     - AI tutor usage statistics
     - Export report as PDF
   
4. **UI Components** (reuse existing):
   - GlassCard for stats
   - AnalyticsChart for trends
   - Copy styling from student dashboard

**Success Criteria**:
- [ ] Parent can log in and see children
- [ ] Performance data displays correctly
- [ ] PDF export works
- [ ] RLS policies prevent parents from seeing other children

**Effort**: 12 hours

---

### Task 2.3: Admin Analytics Dashboard
**Category**: `visual-engineering`  
**Load Skills**: `["frontend-ui-ux"]`

**Files**:
- `app/dashboard/analytics/page.tsx` (NEW)
- `components/admin/school-stats.tsx` (NEW)
- `components/admin/teacher-metrics.tsx` (NEW)
- `app/api/admin/stats/route.ts` (NEW - aggregate queries)

**Description**:
1. **School-Wide Stats**:
   - Total students, active students
   - Total exams processed this month
   - Average performance (school-wide)
   - At-risk students count

2. **Teacher Metrics**:
   - Exams graded per teacher
   - Average grading time
   - Consistency score (grade distribution fairness)

3. **Class Analytics**:
   - Subject-wise performance
   - Class-wise averages
   - Trend analysis

4. **Export**:
   - Excel export for board reporting
   - CSV for data analysis

**Success Criteria**:
- [ ] Dashboard shows accurate aggregated stats
- [ ] Teacher metrics calculated correctly
- [ ] Excel export generates formatted report
- [ ] Only school admins can access (RLS check)

**Effort**: 10 hours

---

### Task 2.4: Export Formats (Excel, CSV)
**Category**: `unspecified-low`  
**Load Skills**: `[]`

**Files**:
- `app/api/export/excel/route.ts` (NEW)
- `app/api/export/csv/route.ts` (NEW)
- `lib/export-utils.ts` (NEW - helper functions)

**Description**:
1. **Excel Export** (using `xlsx` library):
   - Exam results with formatting
   - Charts (performance distribution)
   - Multiple sheets (overview, student details)

2. **CSV Export**:
   - Simple CSV for LMS import
   - Headers: student_id, name, exam_name, score, max_score, date

3. **Endpoints**:
   - `GET /api/export/excel?exam_id=xxx`
   - `GET /api/export/csv?exam_id=xxx`

**Success Criteria**:
- [ ] Excel file downloads with proper formatting
- [ ] CSV file compatible with Google Classroom import
- [ ] Both formats include all required fields

**Effort**: 6 hours

---

## 📋 PHASE 3: ADVANCED FEATURES (Week 7-10)

**Goal**: Implement differentiation features

### Task 3.1: Multi-Language Support (i18n) ✅ COMPLETED
**Category**: `ultrabrain`  
**Load Skills**: `[]`
**Status**: ✅ COMPLETED (January 29, 2026)

**Files Created**:
- `i18n/routing.ts` - Locale configuration
- `i18n/request.ts` - Server-side locale resolution
- `messages/en.json`, `messages/hi.json`, `messages/ta.json` - Translation files
- `components/language-switcher.tsx` - Language dropdown component

**What Was Implemented**:
1. Installed `next-intl` for Next.js App Router
2. Created comprehensive translations for English, Hindi, Tamil (150+ keys each)
3. Cookie-based locale persistence (no URL prefixes)
4. Language switcher in both teacher and student navbars
5. NextIntlClientProvider in root layout

---

### Task 3.2: Google Classroom Integration 🔮 DEFERRED TO V2
**Category**: `ultrabrain`  
**Load Skills**: `[]`
**Status**: 🔮 DEFERRED TO LATER VERSION

> **DECISION (January 29, 2026)**: This feature is deferred to Version 2.0. 
> The core grading platform is production-ready without LMS integration.
> This can be added post-launch based on user demand.

**Files** (Future):
- `app/api/integrations/google-classroom/route.ts`
- `lib/google-classroom-client.ts`
- `app/dashboard/settings/integrations/page.tsx`

---

### Task 3.3: NEP 2020 Compliance 🔮 DEFERRED TO V2
**Category**: `ultrabrain`  
**Load Skills**: `[]`
**Status**: 🔮 DEFERRED TO LATER VERSION

> **DECISION (January 29, 2026)**: This feature is deferred to Version 2.0.
> NEP 2020 compliance requires significant domain expertise and regulatory validation.
> The platform can launch without this and add compliance features iteratively.

**Success Criteria**:
- [ ] Competency mapping functional
- [ ] 360-degree report generated
- [ ] Compliance with NEP guidelines (verified)

**Effort**: 24 hours (complex domain logic)

---

## 📋 PHASE 4: TESTING & DEPLOYMENT (Week 11-12)

**Goal**: Production-ready with tests, docs, monitoring

### Task 4.1: Unit Tests
**Category**: `unspecified-high`  
**Load Skills**: `[]`

**Files**:
- `__tests__/**/*.test.ts` (NEW)
- `__tests__/api/plagiarism.test.ts`
- `__tests__/components/button.test.tsx`
- `jest.config.js` (NEW)

**Description**:
1. **Setup**: Jest + React Testing Library

2. **Test Coverage**:
   - API routes (plagiarism, export, integrations)
   - Components (Button, Input, GlassCard)
   - Utility functions (export helpers, i18n)

3. **Target**: 70%+ code coverage

**Success Criteria**:
- [ ] All critical paths tested
- [ ] Tests pass (`npm test`)
- [ ] Coverage ≥70%

**Effort**: 16 hours

---

### Task 4.2: E2E Tests
**Category**: `unspecified-high`  
**Load Skills**: `["playwright"]`

**Files**:
- `e2e/**/*.spec.ts` (NEW)
- `e2e/teacher-grading-flow.spec.ts`
- `e2e/student-dashboard.spec.ts`
- `playwright.config.ts`

**Description**:
1. **Critical Flows**:
   - Teacher grading workflow (create exam → upload → grade → send)
   - Student viewing feedback
   - Parent dashboard access

2. **Assertions**:
   - UI elements visible
   - Data persists correctly
   - No console errors

**Success Criteria**:
- [ ] 5+ E2E tests covering critical paths
- [ ] Tests pass in CI/CD

**Effort**: 12 hours

---

### Task 4.3: Documentation
**Category**: `writing`  
**Load Skills**: `[]`

**Files**:
- `docs/API.md` (NEW)
- `docs/USER_GUIDE_TEACHER.md` (NEW)
- `docs/USER_GUIDE_STUDENT.md` (NEW)
- `docs/SETUP.md` (NEW)
- `README.md` (UPDATE)

**Description**:
1. **API Documentation**:
   - All endpoints with examples
   - Request/response schemas
   - Error codes

2. **User Guides**:
   - Teacher: How to create exams, grade, review
   - Student: How to view feedback, use AI tutor
   - Parent: How to monitor children

3. **Setup Guide**:
   - Environment variables
   - Database migration steps
   - Deployment instructions

**Success Criteria**:
- [ ] All documentation complete
- [ ] Screenshots included
- [ ] Reviewed for clarity

**Effort**: 12 hours

---

### Task 4.4: Production Deployment
**Category**: `unspecified-low`  
**Load Skills**: `["git-master"]`

**Files**:
- `.env.production` (NEW)
- `vercel.json` (configure)
- Supabase production project

**Description**:
1. **Environment Setup**:
   - Vercel production project
   - Supabase production tier
   - Environment variables secured

2. **Database Migration**:
   - Run all migrations on production
   - Seed initial data (teachers, sample exams)

3. **Monitoring**:
   - Sentry error tracking
   - LogRocket session replay
   - Uptime monitoring (UptimeRobot)

4. **CI/CD**:
   - GitHub Actions (test → build → deploy)
   - Auto-deploy on main branch

**Success Criteria**:
- [ ] Production site live
- [ ] Database migrated
- [ ] Monitoring active
- [ ] CI/CD pipeline working

**Effort**: 8 hours

---

## 🎯 CRITICAL PATH & DEPENDENCIES

### Critical Path (Must be sequential)
```
Phase 1 (UI Fixes) → Phase 2 (Features) → Phase 4 (Testing) → Deploy
```

### Parallel Opportunities
- **Week 3-6**: Plagiarism (Task 2.1) + Parent Dashboard (Task 2.2) can run in parallel
- **Week 7-10**: Multi-language (Task 3.1) + Integrations (Task 3.2) can run in parallel
- **Week 11**: Unit tests (Task 4.1) + E2E tests (Task 4.2) can run in parallel

### Blockers
- **Phase 2** cannot start until **Phase 1** is complete (UI must be consistent first)
- **Task 2.1 (Plagiarism)** blocks grading interface changes (UI depends on API)
- **Task 4.4 (Deployment)** blocks on all tests passing

---

## ⚠️ RISK MITIGATION

### Risk 1: Breaking Existing Features
**Mitigation**:
- Run `npm run build` after EVERY change
- Use `lsp_diagnostics` before committing
- Test grading workflow manually after UI changes
- Keep database migrations reversible

### Risk 2: Subagent Failures
**Mitigation**:
- Verify EVERY delegated task with own tool calls
- Don't trust "done" claims - check build/test status
- Use `session_id` to resume failed tasks (context preservation)

### Risk 3: Scope Creep
**Mitigation**:
- Stick to merged PRD features only
- Defer "nice-to-have" to Phase 5 (post-launch)
- Time-box tasks (if >20 hours, break into subtasks)

### Risk 4: UI/UX Regressions
**Mitigation**:
- Screenshot before/after for visual changes
- Use Playwright for visual regression testing
- Manual QA of critical flows

---

## 📊 EFFORT SUMMARY

| Phase | Tasks | Total Hours | Weeks |
|-------|-------|-------------|-------|
| **Phase 1: UI/UX** | 4 tasks | 10 hours | 2 weeks |
| **Phase 2: Features** | 4 tasks | 44 hours | 4 weeks |
| **Phase 3: Advanced** | 3 tasks | 60 hours | 4 weeks |
| **Phase 4: Testing** | 4 tasks | 48 hours | 2 weeks |
| **TOTAL** | 15 tasks | **162 hours** | **12 weeks** |

**Assumptions**:
- 1 developer working full-time (40 hours/week)
- Includes buffer for debugging, revisions
- Excludes project management overhead

---

## 🚀 IMMEDIATE NEXT STEPS

1. **User Confirmation**: Approve this plan
2. **Start Phase 1, Task 1.1**: Fix branding (choose Blue, update colors)
3. **Delegate to `visual-engineering` agent** with `frontend-ui-ux` skill
4. **Verify**: Build succeeds, colors consistent
5. **Proceed sequentially** through Phase 1 tasks

---

**Plan Status**: ✅ READY FOR EXECUTION  
**Created by**: Atlas (Orchestrator)  
**Next Action**: Await user approval, then delegate Task 1.1
