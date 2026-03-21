// components/student-dashboard/today-focus-card.tsx
import Link from "next/link"
import { ArrowRight, BookOpen, AlertCircle, Clock, TrendingUp } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"

export type FocusType = "exam-prep" | "recovery" | "overdue-task" | "momentum" | "empty"

export interface TodayFocus {
  type: FocusType
  title: string
  description: string
  cta: string
  href: string
  subjectName?: string
  subjectColor?: string
}

const ICONS: Record<FocusType, React.ElementType> = {
  "exam-prep": Clock,
  "recovery": AlertCircle,
  "overdue-task": BookOpen,
  "momentum": TrendingUp,
  "empty": BookOpen,
}

interface TodayFocusCardProps {
  focus: TodayFocus
}

export function TodayFocusCard({ focus }: TodayFocusCardProps) {
  if (focus.type === "empty") {
    return (
      <GlassCard className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
          Today&apos;s Focus
        </p>
        <p className="text-sm text-muted-foreground">
          Complete your first exam to unlock personalised recommendations.
        </p>
      </GlassCard>
    )
  }

  const Icon = ICONS[focus.type]

  return (
    <GlassCard className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary mb-1">
            Today&apos;s Focus
          </p>
          {focus.subjectName && (
            <p className="text-xs text-muted-foreground uppercase tracking-[0.08em] mb-1">
              {focus.subjectName}
            </p>
          )}
          <h3 className="text-base font-bold text-foreground leading-snug mb-1.5">
            {focus.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {focus.description}
          </p>
        </div>
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: focus.subjectColor
              ? `${focus.subjectColor}22`
              : "rgba(155,140,255,0.15)",
          }}
        >
          <Icon
            size={18}
            style={{ color: focus.subjectColor ?? "#9b8cff" }}
          />
        </div>
      </div>

      <Link
        href={focus.href}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        {focus.cta}
        <ArrowRight size={14} />
      </Link>
    </GlassCard>
  )
}
