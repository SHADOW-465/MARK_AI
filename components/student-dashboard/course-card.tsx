import { ProgressBar } from "@/components/student-dashboard/progress-bar"

interface CourseCardProps {
  title: string
  level: string
  completion: number
  instructor: string
  stats: string
  href: string
}

export function CourseCard({ title, level, completion, instructor, stats, href }: CourseCardProps) {
  return (
    <a href={href} className="block rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(0,0,0,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h4 className="line-clamp-1 text-lg font-semibold text-foreground">{title}</h4>
        <span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold text-primary">{level}</span>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{stats}</p>
      <ProgressBar value={completion} />

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">Mentor</span>
        <span className="font-medium text-foreground">{instructor}</span>
      </div>
    </a>
  )
}
