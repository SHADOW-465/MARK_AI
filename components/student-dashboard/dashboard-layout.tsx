import { ReactNode } from "react"

interface DashboardLayoutProps {
  topNavigation: ReactNode
  profile: ReactNode
  courses: ReactNode
  progress: ReactNode
  assistant: ReactNode
  extras?: ReactNode
}

export function DashboardLayout({ topNavigation, profile, courses, progress, assistant, extras }: DashboardLayoutProps) {
  return (
    <div className="student-ui rounded-[20px] border border-border bg-background p-4 md:p-6">
      <div className="space-y-6">
        {topNavigation}

        <div className="grid grid-cols-4 gap-6 lg:grid-cols-12">
          <section className="col-span-4 lg:col-span-3">{profile}</section>
          <section className="col-span-4 lg:col-span-6">{courses}</section>
          <section className="col-span-4 lg:col-span-3">{progress}</section>

          <section className="col-span-4 lg:col-span-3">{assistant}</section>
          {extras ? <section className="col-span-4 lg:col-span-9">{extras}</section> : null}
        </div>
      </div>
    </div>
  )
}
