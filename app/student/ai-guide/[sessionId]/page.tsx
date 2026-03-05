import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { SessionView } from "@/components/ai-guide/session-view"
import { Brain, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/auth/sign-in")

    const admin = createAdminClient()

    const { data: student } = await admin
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

    if (!student) redirect("/auth/sign-in")

    const { data: session } = await admin
        .from("ai_guide_sessions")
        .select("*")
        .eq("id", params.sessionId)
        .single()

    if (!session || session.student_id !== student.id) notFound()

    const { data: allSources } = await admin
        .from("student_sources")
        .select("id, title, type, ocr_text, created_at")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })

    // Build exam context if this is an exam_prep session
    let examContext = undefined
    if (session.exam_context_id) {
        const { data: sheet } = await admin
            .from("answer_sheets")
            .select("total_score, exams(*), feedback_analysis(*)")
            .eq("id", session.exam_context_id)
            .maybeSingle()

        if (sheet) {
            const exam = sheet.exams as any
            const fb = (sheet.feedback_analysis as any[])?.[0]
            const rca = (fb?.root_cause_analysis as Record<string, number>) || {}
            examContext = {
                examName: fb?.exam_name || exam?.exam_name || "Exam",
                subject: fb?.exam_subject || exam?.subject || "General",
                score: sheet.total_score || 0,
                totalMarks: fb?.exam_total_marks || exam?.total_marks || 100,
                errorStats: {
                    concept: Number(rca.concept || 0),
                    calculation: Number(rca.calculation || 0),
                    keyword: Number(rca.keyword || 0),
                },
            }
        }
    }

    // Serialize for client boundary
    const serializedSession = {
        ...session,
        exam_context_id: session.exam_context_id ?? null,
        error_focus: session.error_focus ?? null,
        sources_json: (session.sources_json as string[]) || [],
        chat_history: (session.chat_history as any[]) || [],
        generated_outputs: (session.generated_outputs as any[]) || [],
        mastery_checkpoints: (session.mastery_checkpoints as any[]) || [],
    }

    const serializedSources = (allSources || []).map((s) => ({
        ...s,
        created_at: s.created_at ?? new Date().toISOString(),
    }))

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 max-w-[1400px] mx-auto">
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
                <Link href="/student/ai-guide" className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
                    <ArrowLeft size={18} />
                </Link>
                <Brain size={20} className="text-indigo-500" />
                <h1 className="text-xl font-display font-bold text-foreground line-clamp-1">{session.title}</h1>
                {session.session_type === "exam_prep" && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full font-semibold">
                        Exam Debrief
                    </span>
                )}
            </div>
            <SessionView
                session={serializedSession}
                allSources={serializedSources}
                studentId={student.id}
                examContext={examContext}
            />
        </div>
    )
}
