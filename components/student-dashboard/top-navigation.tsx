import { Bell, CircleHelp, LayoutDashboard, Sparkles, UserCircle2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface TopNavigationProps {
  studentName: string
}

const tabs = [
  { href: "/student/vault", label: "All Courses" },
  { href: "/student/dashboard", label: "Dashboard", active: true },
  { href: "/student/performance", label: "Statistic" },
  { href: "/student/ai-guide", label: "AI Assistant" },
]

export function TopNavigation({ studentName }: TopNavigationProps) {
  return (
    <header className="flex min-h-[72px] items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.06)] md:px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <LayoutDashboard size={18} />
          </div>
          <p className="text-lg font-semibold text-foreground">EasyLearn</p>
        </div>

        <nav className="hidden items-center rounded-full border border-border bg-background p-1 md:flex">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors",
                tab.active && "bg-foreground text-background",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
          <CircleHelp size={16} />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
          <Bell size={16} />
        </button>
        <div className="ml-1 flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1">
          <UserCircle2 size={22} className="text-primary" />
          <span className="hidden text-sm font-medium text-foreground sm:inline">{studentName}</span>
          <Sparkles size={14} className="text-primary" />
        </div>
      </div>
    </header>
  )
}
