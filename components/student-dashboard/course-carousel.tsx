import { ChevronLeft, ChevronRight } from "lucide-react"
import { CourseCard } from "@/components/student-dashboard/course-card"

interface CourseItem {
  id: string
  title: string
  level: string
  completion: number
  instructor: string
  stats: string
  href: string
}

interface CourseCarouselProps {
  courses: CourseItem[]
}

export function CourseCarousel({ courses }: CourseCarouselProps) {
  return (
    <div className="rounded-2xl bg-primary p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-3xl font-semibold text-white">Your courses</h3>
        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground">
            <ChevronLeft size={15} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground">
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} {...course} />
        ))}
      </div>
    </div>
  )
}
