# UI/UX Audit & Stabilization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix AI Guide 404 errors, stabilize the light/dark theme system, mount a consistent global TopBar across all student pages, and remove dead/duplicate components.

**Architecture:** Big Bang refactor — all changes planned upfront. Student layout uses `StudentShell` (server component) that renders `StudentTopbar` (client component, self-contained auth). Theme tokens live exclusively in `globals.css`. No new features, no tests.

**Tech Stack:** Next.js 15 App Router, Supabase JS client, Tailwind CSS v4, next-themes, shadcn/ui, lucide-react.

> **Note:** No test infrastructure exists. Verification is manual — run `npm run dev` and check in browser after each commit.

---

## Task 1: Fix all broken auth redirects

**Problem:** Login page is at `/` but 14 redirects across the app point to `/auth/login` or `/auth/sign-in` (both non-existent → 404).

**Files to modify:**
- `app/student/layout.tsx:15`
- `app/student/ai-guide/page.tsx:12`
- `app/student/ai-guide/[sessionId]/page.tsx:13` and `:23`
- `app/student/analytics/page.tsx:11`
- `app/dashboard/layout.tsx:17`
- `app/dashboard/admin/page.tsx:12`
- `app/parent/layout.tsx:17`
- `app/parent/page.tsx:14` and `:25`
- `app/parent/[studentId]/page.tsx:19` and `:30`
- `app/auth/sign-up-success/page.tsx:24` (Link href)
- `app/auth/error/page.tsx:30` (Link href)

**Step 1: Replace every `/auth/login` and `/auth/sign-in` with `/`**

In each file listed above, change:
```ts
redirect("/auth/login")   →   redirect("/")
redirect("/auth/sign-in") →   redirect("/")
```
For Link hrefs:
```tsx
href="/auth/login"  →  href="/"
```

**Step 2: Verify**

```bash
npm run build
```
Expected: No TypeScript errors. No "page not found" for any redirect target.

**Step 3: Commit**

```bash
git add app/student/layout.tsx app/student/ai-guide/page.tsx "app/student/ai-guide/[sessionId]/page.tsx" app/student/analytics/page.tsx app/dashboard/layout.tsx app/dashboard/admin/page.tsx app/parent/layout.tsx app/parent/page.tsx "app/parent/[studentId]/page.tsx" app/auth/sign-up-success/page.tsx app/auth/error/page.tsx
git commit -m "fix: correct all broken auth redirects to point to root login page"
```

---

## Task 2: Update light theme tokens in globals.css

**Problem:** Light mode uses slightly off values that reduce contrast. Dark mode tokens are already correct.

**File to modify:** `app/globals.css`

**Step 1: Update `:root` block**

In `app/globals.css`, inside `:root { ... }`, change these values:

```css
/* Change: */
--background: #fafafa;       → --background: #f6f8fb;
--foreground: #09090b;       → --foreground: #0f172a;
--card-foreground: #09090b;  → --card-foreground: #0f172a;
--popover-foreground: #09090b; → --popover-foreground: #0f172a;
--secondary-foreground: #09090b; → --secondary-foreground: #0f172a;
--accent-foreground: #09090b;  → --accent-foreground: #0f172a;
--muted-foreground: #71717a;  → --muted-foreground: #64748b;
--border: #e4e4e7;            → --border: #e2e8f0;
--input: #e4e4e7;             → --input: #e2e8f0;
```

Leave all other values (primary, destructive, chart colors, student-primary, radius, shadows) unchanged.

**Step 2: Verify**

Run `npm run dev`, open the app in browser without dark mode → text should be `#0f172a` (near-black) on `#f6f8fb` (near-white). Check contrast is clearly readable.

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "fix: update light mode theme tokens for correct contrast ratios"
```

---

## Task 3: Enable system theme preference detection

**Problem:** `ThemeProvider` in `app/layout.tsx` has `defaultTheme="dark"` and `enableSystem={false}`, forcing dark mode for all users with no system preference detection.

**File to modify:** `app/layout.tsx`

**Step 1: Update ThemeProvider props**

Change:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem={false}
  disableTransitionOnChange
>
```

To:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
```

**Step 2: Verify**

Run `npm run dev`. Open app in browser. System-dark OS → app should be dark. System-light OS → app should be light. Theme toggle (once added in Task 5) will override.

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: enable system theme preference detection in ThemeProvider"
```

---

## Task 4: Fix StudentShell — mount StudentTopbar globally

**Problem:** `StudentShell` has a TypeScript interface defining `userName`/`userEmail`/`userInitials` props that are never passed from `app/student/layout.tsx`. The `StudentTopbar` is never rendered anywhere in the student zone.

**Files to modify:**
- `components/layout/student-shell.tsx`
- `app/student/layout.tsx`

**Step 1: Rewrite StudentShell**

Replace the entire content of `components/layout/student-shell.tsx`:

```tsx
import { ReactNode } from "react"
import { StudentTopbar } from "@/components/layout/student-topbar"

export function StudentShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <StudentTopbar />
            <main className="pt-[88px] px-4 md:px-6 lg:px-8">
                <div className="mx-auto max-w-[1440px]">
                    {children}
                </div>
            </main>
        </div>
    )
}
```

Note: `pt-[88px]` matches the topbar height of `h-[88px]` defined in `student-topbar.tsx`.

**Step 2: Verify layout.tsx passes no props**

`app/student/layout.tsx` currently renders `<StudentShell>{children}</StudentShell>` with no props — this is already correct. No change needed there.

**Step 3: Verify**

Run `npm run dev`, navigate to `/student/dashboard` → a header bar should appear at the top of every student page.

**Step 4: Commit**

```bash
git add components/layout/student-shell.tsx
git commit -m "feat: mount StudentTopbar globally in StudentShell"
```

---

## Task 5: Complete StudentTopbar — self-contained, all nav links, theme toggle, profile dropdown

**Problem:** `StudentTopbar` requires `userName`/`userInitials` props (not provided), has nav items missing (Flashcards, Planner), has ThemeToggle commented out, and has no sign-out capability.

**File to modify:** `components/layout/student-topbar.tsx`

**Step 1: Rewrite StudentTopbar**

Replace the entire content of `components/layout/student-topbar.tsx`:

```tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Network, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_ITEMS = [
    { href: "/student/dashboard", label: "Dashboard" },
    { href: "/student/ai-guide", label: "AI Guide" },
    { href: "/student/performance", label: "Performance" },
    { href: "/student/flashcards", label: "Flashcards" },
    { href: "/student/planner", label: "Planner" },
    { href: "/student/vault", label: "Vault" },
]

export function StudentTopbar() {
    const pathname = usePathname()
    const router = useRouter()

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/")
        router.refresh()
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 w-full h-[88px] flex items-center justify-between px-6 lg:px-10 border-b border-border/40 bg-background/95 backdrop-blur-sm">

            {/* Logo */}
            <Link href="/student/dashboard" className="flex items-center gap-3 group flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--student-primary)] text-white shadow-md shadow-[var(--student-primary)]/20 group-hover:scale-105 transition-transform">
                    <Network size={22} />
                </div>
                <span className="font-display text-xl font-bold text-foreground hidden sm:block">
                    MARK AI
                </span>
            </Link>

            {/* Center Nav Pills */}
            <nav className="hidden md:flex items-center gap-1 p-1.5 bg-secondary/50 rounded-full border border-border/50">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                                isActive
                                    ? "bg-foreground text-background shadow-md"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
                <ThemeToggle />

                <div className="h-8 w-px bg-border hidden sm:block" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm hover:opacity-90 transition-opacity">
                            <User size={18} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleSignOut}
                            className="text-destructive focus:text-destructive cursor-pointer"
                        >
                            <LogOut size={16} className="mr-2" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
```

**Step 2: Verify**

Run `npm run dev`:
- Navigate across student pages → TopBar stays fixed, never re-renders
- Active nav link shows `bg-foreground text-background` highlight
- Theme toggle cycles light/dark
- Profile dropdown → Sign out → redirects to `/`

**Step 3: Commit**

```bash
git add components/layout/student-topbar.tsx
git commit -m "feat: complete StudentTopbar with nav links, theme toggle, and sign out"
```

---

## Task 6: Fix AI Guide session page layout bug

**Problem:** `app/student/ai-guide/[sessionId]/page.tsx:83` uses `max-w-16` (64px wide!) on the session container, making the 3-column layout impossibly narrow.

**File to modify:** `app/student/ai-guide/[sessionId]/page.tsx`

**Step 1: Fix the container class**

On line 83, change:
```tsx
<div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-16 mx-auto">
```
To:
```tsx
<div className="flex flex-col h-[calc(100vh-88px)] p-4 w-full">
```

Note: Height updated from `4rem` (64px) to `88px` to account for the new fixed TopBar height.

**Step 2: Verify**

Navigate to any AI Guide session → the 3-column layout (Sources / Chat / Context) should be full width and usable.

**Step 3: Commit**

```bash
git add "app/student/ai-guide/[sessionId]/page.tsx"
git commit -m "fix: correct session page container width from max-w-16 to full width"
```

---

## Task 7: Remove inline TopNavigation from student dashboard

**Problem:** `app/student/dashboard/page.tsx` renders `<TopNavigation>` as a prop to `DashboardLayout`. This is now a duplicate of the global `StudentTopbar` mounted in `StudentShell`.

**Files to modify:** `app/student/dashboard/page.tsx`

**Step 1: Remove TopNavigation import and usage**

In `app/student/dashboard/page.tsx`:

Remove this import:
```tsx
import { TopNavigation } from "@/components/student-dashboard/top-navigation"
```

Remove the `topNavigation` prop from `DashboardLayout`:
```tsx
// Remove this prop:
topNavigation={<TopNavigation studentName={student.name?.split(" ")[0] || "Student"} />}
```

**Step 2: Check DashboardLayout accepts optional topNavigation**

Open `components/student-dashboard/dashboard-layout.tsx` and verify the `topNavigation` prop is optional (has `?`). If it's required, make it optional:
```tsx
// If you see: topNavigation: React.ReactNode
// Change to:  topNavigation?: React.ReactNode
```
And in the JSX, only render it if provided:
```tsx
{topNavigation && topNavigation}
```

**Step 3: Verify**

Navigate to `/student/dashboard` → only one TopBar visible (the global one), not two stacked bars.

**Step 4: Commit**

```bash
git add app/student/dashboard/page.tsx components/student-dashboard/dashboard-layout.tsx
git commit -m "fix: remove duplicate inline TopNavigation from student dashboard"
```

---

## Task 8: Replace hardcoded colors in student-facing components

**Problem:** Several student components use hardcoded Tailwind color classes that don't respect the theme, causing contrast failures in light mode.

**Files to scan and fix:**

Run this to find all hardcoded color usages in student components:
```bash
grep -rn "bg-indigo-\|bg-red-\|bg-emerald-\|bg-amber-\|bg-purple-\|bg-blue-\|text-indigo-\|text-red-\|text-emerald-\|text-amber-\|text-purple-\|text-blue-" components/student-dashboard/ components/dashboard/ai-daily-brief.tsx components/dashboard/active-sessions-widget.tsx components/dashboard/mark-recovery-widget.tsx app/student/dashboard/page.tsx
```

**Replacement rules** (only fix cases where hardcoded color is used for text on background — NOT for decorative/badge colors which are intentional):

| Pattern | Replace with | When |
|---|---|---|
| `text-foreground` already used | no change needed | |
| `className="... text-slate-900 ..."` on any element | `text-foreground` | always |
| `className="... text-white ..."` inside dark-only blocks | `text-foreground` | if not guaranteed dark bg |
| Card/container `bg-white` without dark variant | `bg-card` | always |
| `bg-slate-100` without dark variant | `bg-secondary` | always |

**Exception:** Badge colors (`bg-emerald-100 text-emerald-700`, `bg-amber-100 text-amber-700`, etc.) in `app/student/dashboard/page.tsx:185` are intentional decorative colors — **leave these unchanged**.

**Step 1: Fix `app/student/ai-guide/page.tsx`**

Line 51: `bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400` — this is a decorative badge, leave unchanged.

**Step 2: Fix `app/student/ai-guide/[sessionId]/page.tsx`**

Line 91: `bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400` — decorative badge, leave unchanged.

**Step 3: Fix components/dashboard/ai-daily-brief.tsx, active-sessions-widget.tsx, mark-recovery-widget.tsx**

Open each file. For any `bg-white` or `text-slate-*` or `text-gray-*` without a matching `dark:` variant, replace with semantic token. Examples:
- `bg-white` → `bg-card`
- `text-slate-900` → `text-foreground`
- `text-slate-500` → `text-muted-foreground`
- `border-slate-200` → `border-border`

**Step 4: Verify**

Toggle between light and dark mode on `/student/dashboard` and `/student/ai-guide`. All text should be clearly readable in both modes.

**Step 5: Commit**

```bash
git add components/dashboard/ app/student/dashboard/page.tsx app/student/ai-guide/
git commit -m "fix: replace hardcoded colors with semantic theme tokens in student components"
```

---

## Task 9: Delete unused layout components

**Confirmed unused** (no imports found anywhere in `app/` or `components/` except their own file):
- `components/layout/AppLayout.tsx`
- `components/layout/DashboardLayout.tsx`
- `components/layout/SectionContainer.tsx`
- `components/layout/CardContainer.tsx`
- `components/layout/PageContainer.tsx`
- `components/student-dashboard/top-navigation.tsx` (after Task 7)

**Step 1: Verify each is truly unused before deleting**

```bash
grep -rn "AppLayout\|from.*layout/DashboardLayout\|SectionContainer\|CardContainer\|PageContainer" app/ components/ --include="*.tsx" --include="*.ts"
grep -rn "top-navigation\|TopNavigation" app/ components/ --include="*.tsx" --include="*.ts"
```

Expected: Zero results (or only results from the files themselves).

**Step 2: Delete the files**

```bash
rm components/layout/AppLayout.tsx
rm components/layout/DashboardLayout.tsx
rm components/layout/SectionContainer.tsx
rm components/layout/CardContainer.tsx
rm components/layout/PageContainer.tsx
rm components/student-dashboard/top-navigation.tsx
```

**Step 3: Verify build still passes**

```bash
npm run build
```

Expected: Clean build with no "module not found" errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete unused layout components after refactor"
```

---

## Verification Checklist

After all tasks complete, manually verify in browser:

- [ ] `/student/ai-guide` loads without 404 (logged out → redirects to `/`)
- [ ] `/student/ai-guide/[any-session-id]` loads full-width 3-column layout
- [ ] TopBar is visible and fixed on ALL student pages (dashboard, ai-guide, performance, flashcards, planner, vault)
- [ ] TopBar does NOT re-render / flash on navigation
- [ ] Active nav link is highlighted correctly per page
- [ ] Theme toggle cycles light ↔ dark
- [ ] Light mode: all text clearly readable (no invisible text)
- [ ] Dark mode: all text clearly readable (no invisible text)
- [ ] Sign out from profile dropdown → redirects to `/`
- [ ] `npm run build` completes clean
