import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { ProgressBar } from "@/components/dashboard/progress-bar"

interface CourseCardProps {
  id: string
  title: string
  description: string
  progress: number
  href: string
}

export function CourseCard({ id, title, description, progress, href }: CourseCardProps) {
  return (
    <Link href={href} key={id}>
      <GlassCard hoverEffect className="h-full p-5">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="line-clamp-1 text-base font-semibold text-foreground">{title}</h4>
          <ArrowRight size={14} className="text-muted-foreground" />
        </div>
        <p className="mb-5 line-clamp-2 text-sm text-muted-foreground">{description}</p>
        <ProgressBar label="Progress" value={progress} />
      </GlassCard>
    </Link>
  )
}
