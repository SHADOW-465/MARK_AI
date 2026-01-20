import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/dashboard/navbar"
import { BackButton } from "@/components/ui/back-button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check user role
  const { data: teacher } = await supabase.from("teachers").select("*").eq("id", user.id).single()

  const isTeacher = !!teacher
  const userName = teacher?.name || "User"
  const userEmail = user.email || ""
  const userInitials = userEmail[0].toUpperCase()

  return (
    <div className="min-h-screen bg-background light">
      {/* Top Navigation Bar */}
      <Navbar isTeacher={isTeacher} userName={userName} userEmail={userEmail} userInitials={userInitials} />

      {/* Main Content */}
      <main className="pt-24 pb-8 relative">
        <div className="px-4 lg:px-8 max-w-[1600px] mx-auto">
          <BackButton />
          {children}
        </div>
      </main>
    </div>
  )
}
