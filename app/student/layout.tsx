import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NavbarStudent } from "@/components/dashboard/navbar-student"
import { BackButton } from "@/components/ui/back-button"

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
        <div className="min-h-screen bg-background dark">
            {/* Top Navigation Bar */}
            <NavbarStudent
                userName={userName}
                userEmail={userEmail}
                userInitials={userInitials}
            />

            {/* Main Content */}
            <main className="pt-24 pb-8 px-4 md:px-8 max-w-[1600px] mx-auto w-full">
                <BackButton />
                {children}
            </main>
        </div>
    )
}
