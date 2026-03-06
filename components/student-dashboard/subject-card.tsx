import Link from "next/link"

interface SubjectCardProps {
  id: string
  name: string
  color: string
  avgScore: number
  totalTasks: number
  completedTasks: number
  sessionCount: number
}

export function SubjectCard({
  id,
  name,
  color,
  avgScore,
  totalTasks,
  completedTasks,
  sessionCount,
}: SubjectCardProps) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (avgScore / 100) * circumference

  return (
    <Link
      href={`/student/subjects/${id}`}
      className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)] transition-all min-w-[140px] flex-shrink-0"
    >
      {/* Progress Ring */}
      <div className="relative flex items-center justify-center">
        <svg width="88" height="88" className="-rotate-90">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-border"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={avgScore === 0 ? circumference : progress}
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute text-sm font-bold text-foreground">
          {avgScore > 0 ? `${avgScore}%` : "—"}
        </span>
      </div>

      {/* Subject name */}
      <p className="text-sm font-semibold text-foreground text-center line-clamp-2 leading-tight">
        {name}
      </p>

      {/* Stats */}
      <p className="text-xs text-muted-foreground text-center">
        {completedTasks}/{totalTasks} tasks · {sessionCount} sessions
      </p>
    </Link>
  )
}
