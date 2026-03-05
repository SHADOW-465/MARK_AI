import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get("studentId")
    if (!studentId) return NextResponse.json({ brief: null })

    try {
        const supabase = createAdminClient()

        const { data: student } = await supabase
            .from("students")
            .select("name, class, streak")
            .eq("id", studentId)
            .maybeSingle()

        // Last 3 approved exams with feedback
        const { data: recentSheetsData } = await supabase
            .from("answer_sheets")
            .select("*, exams(*), feedback_analysis(*)")
            .eq("student_id", studentId)
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(3)

        const recentSheets = recentSheetsData || []

        if (recentSheets.length === 0) {
            return NextResponse.json({
                brief: "Welcome! Once your teacher grades your first exam, I'll give you a personalised study focus here.",
            })
        }

        // Aggregate error counts across recent exams
        let concept = 0, calculation = 0, keyword = 0
        for (const sheet of recentSheets) {
            const fb = (sheet.feedback_analysis as any[])?.[0]
            const rca = (fb?.root_cause_analysis as Record<string, number>) || {}
            concept += Number(rca.concept || 0)
            calculation += Number(rca.calculation || 0)
            keyword += Number(rca.keyword || 0)
        }

        const dominantError =
            concept >= calculation && concept >= keyword
                ? "concept understanding"
                : calculation >= keyword
                    ? "calculation steps"
                    : "exam expression and keywords"

        // Nearest upcoming exam within 7 days
        let soonExamQuery = supabase
            .from("exams")
            .select("*")
            .gte("exam_date", new Date().toISOString())
            .lte("exam_date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
            .order("exam_date", { ascending: true })
            .limit(1)

        if (student?.class) {
            soonExamQuery = soonExamQuery.eq("class", student.class)
        }

        const { data: soonExamArr } = await soonExamQuery
        const soonExam = soonExamArr?.[0]

        const prompt = `Write a 2-sentence motivating daily study brief for a student.
Facts:
- Their most common error type across recent exams: ${dominantError}
- Current streak: ${student?.streak || 0} days
${soonExam ? `- Upcoming exam in ≤7 days: ${soonExam.exam_name}` : ""}
- Error counts: concept=${concept}, calculation=${calculation}, keyword=${keyword}

Rules:
- Name the specific error type (not generic advice)
- Mention what to do ("open your AI Guide", "try Drill Practice mode", etc.)
- Tone: supportive mentor, not a robot
- Maximum 2 sentences. No bullet points.`

        const result = await model.generateContent(prompt)
        const brief = result.response.text().trim()

        return NextResponse.json({ brief })
    } catch (err) {
        console.error("[daily-brief] error:", err)
        return NextResponse.json({ brief: null })
    }
}
