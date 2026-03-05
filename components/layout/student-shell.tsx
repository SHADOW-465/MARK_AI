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
    userName,
    userEmail,
    userInitials,
}: StudentShellProps) {
    return (
        <div className="min-h-screen bg-[var(--student-bg-light)] dark:bg-[var(--student-bg-dark)] transition-colors duration-300 flex flex-col items-center justify-start p-4 md:p-6 lg:p-8">
            {/* Main White/Card Container */}
            <div className="w-full max-w-[1400px] bg-background rounded-[2rem] shadow-xl md:shadow-2xl overflow-hidden flex flex-col min-h-[90vh] border border-border/50 transition-colors duration-300">

                {/* Topbar Navigation */}
                {/*
                <StudentTopbar
                    userName={userName}
                    userInitials={userInitials}
                />
                */}

                {/* Page Content Area */}
                <main className="flex-1 w-full p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
