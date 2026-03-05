import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST /api/student/self-assessment
// Body: { studentId, examId, topics: [{ name, confidence: 1-5 }] }
export async function POST(req: Request) {
    try {
        const { studentId, examId, topics } = await req.json()

        if (!studentId || !examId || !topics?.length) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Idempotent — one assessment per student per exam
        const { data: existing } = await supabase
            .from("self_assessments")
            .select("*")
            .eq("student_id", studentId)
            .eq("exam_id", examId)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ assessment: existing })
        }

        const { data: assessment, error } = await supabase
            .from("self_assessments")
            .insert({ student_id: studentId, exam_id: examId, topics })
            .select()
            .single()

        if (error) {
            throw error
        }

        return NextResponse.json({ assessment })
    } catch (err) {
        console.error("[self-assessment] error:", err)
        return NextResponse.json({ error: "Failed to save" }, { status: 500 })
    }
}

// GET /api/student/self-assessment?studentId=xxx&examId=yyy
// Check if an assessment already exists (so UI knows whether to show the prompt)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    const examId = searchParams.get("examId")

    if (!studentId || !examId) {
        return NextResponse.json({ error: "studentId and examId required" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: assessment } = await supabase
        .from("self_assessments")
        .select("*")
        .eq("student_id", studentId)
        .eq("exam_id", examId)
        .maybeSingle()

    return NextResponse.json({ assessment })
}
