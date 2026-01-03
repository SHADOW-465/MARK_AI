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
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-neon-purple/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-neon-purple/5 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-cyan/5 blur-[120px]" />
                <div className="absolute inset-0 grid-bg pointer-events-none opacity-20" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Top Navigation Bar */}
                <NavbarStudent
                    userName={userName}
                    userEmail={userEmail}
                    userInitials={userInitials}
                />

                {/* Main Content */}
                <main className="flex-1 pt-28 p-6 md:p-10 max-w-[1600px] mx-auto w-full">
                    <BackButton />
                    {children}
                </main>
            </div>
        </div>
    )
}
