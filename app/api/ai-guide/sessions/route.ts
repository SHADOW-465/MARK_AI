import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/ai-guide/sessions?studentId=xxx
// Returns all sessions for a student, newest first
// Excludes heavy chat_history / generated_outputs for the list view
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")

    if (!studentId) {
        return NextResponse.json({ error: "studentId required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: sessions, error } = await supabase
        .from("ai_guide_sessions")
        .select("id, title, session_type, exam_context_id, error_focus, sources_json, last_active_at, created_at, rating")
        .eq("student_id", studentId)
        .order("last_active_at", { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions })
}

// POST /api/ai-guide/sessions
// Body: { studentId, sessionType?, examContextId?, errorFocus?, title?, sourceIds? }
export async function POST(req: Request) {
    try {
        const {
            studentId,
            sessionType = "free_study",
            examContextId,
            errorFocus,
            title,
            sourceIds,
        } = await req.json()

        if (!studentId) {
            return NextResponse.json({ error: "studentId required" }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Auto-generate a meaningful title for exam_prep sessions
        let sessionTitle = title || "New Study Session"
        if (sessionType === "exam_prep" && examContextId) {
            const { data: sheet } = await supabase
                .from("answer_sheets")
                .select("exams(*), feedback_analysis(*)")
                .eq("id", examContextId)
                .maybeSingle()

            if (sheet) {
                const exam = sheet.exams as any
                const fb = (sheet.feedback_analysis as any[])?.[0]
                const examName = fb?.exam_name || exam?.exam_name || "Exam"
                sessionTitle = title || `${examName} — Debrief`
            }
        }

        const { data: session, error } = await supabase
            .from("ai_guide_sessions")
            .insert({
                student_id: studentId,
                title: sessionTitle,
                session_type: sessionType,
                exam_context_id: examContextId || null,
                error_focus: errorFocus || null,
                sources_json: sourceIds ?? [],
                chat_history: [],
                generated_outputs: [],
                last_active_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ session })
    } catch (error) {
        console.error("Create session error:", error)
        return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }
}
