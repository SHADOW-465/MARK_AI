import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { SessionsList } from "@/components/ai-guide/sessions-list"
import { Brain, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AiGuidePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/")

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return <div className="p-8 text-center"><p className="text-destructive font-bold">Server configuration error: missing service key. Contact administrator.</p></div>
    }

    const admin = createAdminClient()

    const { data: student, error: studentError } = await admin
        .from("students")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle()

    if (!student) return <div className="p-8 text-center"><p className="text-destructive font-bold">Profile not found. Contact your administrator.</p></div>

    const { data: sessions } = await admin
        .from("ai_guide_sessions")
        .select("id, title, session_type, error_focus, last_active_at")
        .eq("student_id", student.id)
        .order("last_active_at", { ascending: false })

    const serialized = (sessions || []).map((s) => ({
        ...s,
        last_active_at: s.last_active_at ?? new Date().toISOString(),
    }))

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-8 animate-fade-in-up">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
                        <Brain className="text-indigo-500 h-10 w-10" />
                        AI Study Guide
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Your personal learning sessions — pick up where you left off.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-xs font-bold">
                    <Sparkles size={12} /> V2
                </div>
            </div>
            <SessionsList initialSessions={serialized} studentId={student.id} />
        </div>
    )
}
