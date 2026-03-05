"use client"

import { ReactNode } from "react"
import { StudentTopbar } from "@/components/layout/student-topbar"

interface StudentShellProps {
    children: ReactNode
    userName: string
    userEmail: string
    userInitials: string
}

export function StudentShell({
    children,
}: {
    children: ReactNode
}) {
    return (
        <div className="student-ui min-h-screen bg-background p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-[1440px]">
                {children}
            </div>
        </div>
    )
}
