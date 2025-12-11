import type React from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Logo } from "@/components/ui/logo"
import { Home, BookOpen, BarChart2, Calendar, LogOut } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

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

  // Optional: Check if user is linked to a student record
  // If not, maybe show a "Connect Profile" banner?

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-neon-purple/30">
        {/* Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-neon-purple/5 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-neon-cyan/5 blur-[120px]" />
        </div>

        <div className="relative z-10 flex min-h-screen">
            {/* Sidebar Navigation */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 hidden md:flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl p-6">
                <div className="mb-10 pl-2">
                    <Logo />
                    <div className="mt-2 text-xs font-mono text-neon-purple/80 px-2 py-0.5 rounded border border-neon-purple/20 w-fit">
                        STUDENT OS v1.0
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <NavLink href="/student/dashboard" icon={Home} label="Command Center" />
                    <NavLink href="/student/study" icon={BookOpen} label="Deep Work Studio" />
                    <NavLink href="/student/performance" icon={BarChart2} label="Performance Lab" />
                    <NavLink href="/student/planner" icon={Calendar} label="Autopilot" />
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <form action="/auth/sign-out" method="post">
                        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Mobile Nav (Simple placeholder) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t border-white/10 flex items-center justify-around z-50">
                <Link href="/student/dashboard" className="p-2 text-muted-foreground hover:text-neon-cyan"><Home size={20}/></Link>
                <Link href="/student/study" className="p-2 text-muted-foreground hover:text-neon-cyan"><BookOpen size={20}/></Link>
                <Link href="/student/performance" className="p-2 text-muted-foreground hover:text-neon-cyan"><BarChart2 size={20}/></Link>
                <Link href="/student/planner" className="p-2 text-muted-foreground hover:text-neon-cyan"><Calendar size={20}/></Link>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 md:p-10 pb-24 md:pb-10 overflow-y-auto">
                {children}
            </main>
        </div>
    </div>
  )
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    return (
        <Link href={href} className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5 text-muted-foreground hover:text-foreground">
            <Icon size={18} className="group-hover:text-neon-cyan transition-colors" />
            <span className="font-medium">{label}</span>
        </Link>
    )
}
