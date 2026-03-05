import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    // Fetch Student Data for Navbar
    const { data: student } = await supabase
        .from("students")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle()

    const userName = student?.name || "Student"
    const userEmail = user.email || ""
    const userInitials = userName[0].toUpperCase()

    return (
        <DashboardShell
            userName={userName}
            userEmail={userEmail}
            userInitials={userInitials}
            role="Student"
        >
            {children}
        </DashboardShell>
    )
}
