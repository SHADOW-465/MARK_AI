import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/layout/dashboard-shell"

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

  const userName = teacher?.name || "User"
  const userEmail = user.email || ""
  const userInitials = userEmail[0].toUpperCase()

  return (
    <DashboardShell
      userName={userName}
      userEmail={userEmail}
      userInitials={userInitials}
      role="Teacher"
    >
      {children}
    </DashboardShell>
  )
}
