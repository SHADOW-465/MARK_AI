// components/student-dashboard/subject-status-list.tsx
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

interface Subject {
  id: string
  name: string
  color: string
  avgScore: number
  totalTasks: number
  completedTasks: number
  sessionCount: number
  previousAvgScore?: number
}

interface SubjectStatusListProps {
  subjects: Subject[]
}

function getStatus(subject: Subject): {
  label: string
  colour: string
  icon: string
} {
  if (subject.avgScore === 0 && subject.totalTasks === 0) {
    return { label: "No exams yet", colour: "text-muted-foreground", icon: "" }
  }
  const improved =
    subject.previousAvgScore !== undefined &&
    subject.avgScore - subject.previousAvgScore > 5
  if (improved) {
    return {
      label: `${subject.avgScore}% · improving`,
      colour: "text-amber-500",
      icon: "↗",
    }
  }
  if (subject.avgScore < 65 && subject.avgScore > 0) {
    return {
      label: `${subject.avgScore}% · needs focus`,
      colour: "text-red-500",
      icon: "⚠",
    }
  }
  if (subject.avgScore >= 70) {
    return {
      label: `${subject.avgScore}% · on track`,
      colour: "text-emerald-500",
      icon: "✓",
    }
  }
  return {
    label: `${subject.avgScore}%`,
    colour: "text-muted-foreground",
    icon: "",
  }
}

export function SubjectStatusList({ subjects }: SubjectStatusListProps) {
  if (subjects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        You&apos;ll see subjects here once your teacher grades your first exam.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {subjects.map((subject) => {
        const status = getStatus(subject)
        return (
          <Link
            key={subject.id}
            href={`/student/subjects/${subject.id}`}
            className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-3 py-2.5 hover:bg-background transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {subject.name}
              </span>
            </div>
            <span className={cn("text-xs font-medium", status.colour)}>
              {status.icon && <span className="mr-1">{status.icon}</span>}
              {status.label}
            </span>
          </Link>
        )
      })}

      <Link
        href="/student/subjects"
        className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
      >
        <Plus size={14} />
        Add Subject
      </Link>
    </div>
  )
}
