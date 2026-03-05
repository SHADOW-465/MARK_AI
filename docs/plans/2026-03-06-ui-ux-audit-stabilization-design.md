# MARK AI — UI/UX Audit & Stabilization Design

**Date**: 2026-03-06
**Status**: Approved
**Approach**: Big Bang Refactor — plan entire new structure upfront, execute in one cohesive implementation plan
**Scope**: Student zone only (teacher/parent zones unaffected)

---

## 1. Executive Summary

A full audit and stabilization of the student-facing application. Fixes a hard 404 blocker on AI Guide pages, establishes a stable light/dark theme system with guaranteed text visibility, creates consistent global navigation via a mounted StudentTopbar, patches a session layout bug, and removes dead/duplicate components.

No tests are added in this pass. Test infrastructure (Vitest + RTL) will be implemented in a separate dedicated session when requested.

---

## 2. Root Cause: AI Guide 404

The login page lives at `/` (root). Three files redirect unauthenticated users to non-existent routes:

| File | Broken redirect | Fix |
|---|---|---|
| `app/student/layout.tsx` | `/auth/login` | `/` |
| `app/student/ai-guide/page.tsx` | `/auth/sign-in` | `/` |
| `app/student/ai-guide/[sessionId]/page.tsx` | `/auth/sign-in` | `/` |

All other student pages are audited for the same mismatch during implementation.

---

## 3. Theme System

### Design Tokens

Single source of truth: `app/globals.css` CSS variables.

**Light mode (`:root`):**
```css
--background: #f6f8fb;
--foreground: #0f172a;
--card: #ffffff;
--card-foreground: #0f172a;
--border: #e2e8f0;
--muted-foreground: #64748b;
```

**Dark mode (`.dark`):**
```css
--background: #0f1115;
--foreground: #ffffff;
--card: #1c2128;
--card-foreground: #ffffff;
--border: rgba(255,255,255,0.08);
--muted-foreground: #9aa4b2;
```

### Rules
- Minimum contrast ratio 4.5:1 enforced via semantic tokens
- No hardcoded color values in student-facing components
- All text uses `text-foreground`, `text-muted-foreground`, or explicit contrast-safe classes
- Hardcoded Tailwind color classes (e.g. `bg-indigo-100`, `text-red-700`) replaced with semantic tokens where they affect text/background contrast

### ThemeProvider
- `app/layout.tsx` ThemeProvider gets `enableSystem defaultTheme="system"`
- System preference detected automatically on first load
- User override via theme toggle in StudentTopbar

---

## 4. Navigation — StudentTopbar (Global)

### StudentShell

`components/layout/student-shell.tsx` mounts `StudentTopbar` once above all content:

```tsx
export function StudentShell({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <StudentTopbar />
      <main className="pt-16 px-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          {children}
        </div>
      </main>
    </div>
  )
}
```

### StudentTopbar Contents
- **Left:** MARK AI logo → `/student/dashboard`
- **Center:** Nav links — Dashboard, AI Guide, Performance, Flashcards, Planner, Vault
- **Right:** Theme toggle, notifications bell, profile avatar + dropdown (sign out)
- Fixed position, `z-50`, never re-renders on route change

### Removal
`components/student-dashboard/top-navigation.tsx` is removed from `app/student/dashboard/page.tsx` — the global TopBar replaces it.

---

## 5. Dashboard UX

The dashboard already implements all V2 design doc sections:
- AI Daily Brief
- Recent Results + Study This button
- Active Sessions Widget
- Mark Recovery Widget
- Upcoming Exams
- Self-Assessment Prompt (appears when exam <= 7 days away)

**Gaps to fix:**
- Remove inline `TopNavigation` from dashboard page (replaced by global TopBar)
- Verify `AssistantWidget` renders correctly under new layout
- Fix session page container: `max-w-16` → `max-w-full` in `app/student/ai-guide/[sessionId]/page.tsx:83`

---

## 6. Component Cleanup

### Files to Delete (verify unused via grep first)

| File | Reason |
|---|---|
| `components/layout/AppLayout.tsx` | No app route imports it |
| `components/layout/DashboardLayout.tsx` | Duplicate of dashboard-shell |
| `components/layout/SectionContainer.tsx` | Unused wrapper |
| `components/layout/CardContainer.tsx` | Unused wrapper |
| `components/layout/PageContainer.tsx` | Unused wrapper |
| `components/student-dashboard/top-navigation.tsx` | Replaced by global StudentTopbar |

### Retained Structure
```
components/
├── layout/
│   ├── student-shell.tsx        (updated)
│   ├── student-topbar.tsx       (updated — complete nav)
│   ├── dashboard-shell.tsx      (untouched — teacher zone)
│   └── sidebar-navigation.tsx   (untouched — teacher zone)
├── student-dashboard/           (retained — specialized dashboard widgets)
├── dashboard/                   (retained — teacher + shared widgets)
├── ai-guide/                    (retained)
└── ui/                          (retained — shadcn primitives)
```

---

## 7. Execution Order

1. Fix auth redirects (404 fix) — `app/student/layout.tsx`, AI Guide pages, audit all other student pages
2. Update theme tokens — `app/globals.css` light/dark values
3. Update ThemeProvider — add `enableSystem defaultTheme="system"` in `app/layout.tsx`
4. Fix `StudentShell` — mount `StudentTopbar` globally
5. Complete `StudentTopbar` — nav links, theme toggle, profile dropdown
6. Fix session page `max-w-16` → `max-w-full`
7. Remove inline `TopNavigation` from dashboard page
8. Replace hardcoded colors in student components with semantic tokens
9. Delete unused layout components (grep-verified)

---

## 8. Out of Scope

- Teacher dashboard (`/dashboard/*`) — untouched
- Parent zone (`/parent/*`) — untouched
- New features — no new functionality added
- Test infrastructure — deferred to dedicated session
- OCR pipeline, Sarvam AI integration — covered in separate V2 implementation plan
- Supabase schema changes — no schema modifications in this pass
