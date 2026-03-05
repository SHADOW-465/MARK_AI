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
