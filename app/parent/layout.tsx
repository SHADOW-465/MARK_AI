import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, Users } from "lucide-react"

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get or create parent profile
  let { data: parent } = await supabase
    .from("parents")
    .select("*")
    .eq("user_id", user.id)
    .single()

  // Auto-create parent profile if doesn't exist
  if (!parent) {
    const { data: newParent } = await supabase
      .from("parents")
      .insert({
        user_id: user.id,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "Parent",
        email: user.email,
      })
      .select()
      .single()
    parent = newParent
  }

  const userName = parent?.name || "Parent"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <Link href="/parent" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white">MARK AI</h1>
              <p className="text-xs text-slate-400">Parent Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">Welcome, {userName}</span>
            <form action="/auth/sign-out" method="post">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-8 px-4 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
