import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { createAdminClient } from "@/lib/supabase/admin"

export const maxDuration = 30

export async function POST(req: Request) {
    try {
        const { messages, sourceIds, studentId, examContextId } = await req.json()
        const supabase = createAdminClient()

        // 1. Fetch source materials
        let context = ""
        if (sourceIds && sourceIds.length > 0) {
            const { data: sources } = await supabase
                .from("student_sources")
                .select("title, ocr_text")
                .in("id", sourceIds)
                .eq("student_id", studentId)

            if (sources) {
                context = sources
                    .map((s) => `Source: ${s.title}\nContent: ${s.ocr_text || "(No text)"}`)
                    .join("\n\n")
            }
        }

        // 2. Fetch exam context if provided
        let examContext = ""
        if (examContextId) {
            const { data: sheet } = await supabase
                .from("answer_sheets")
                .select("total_score, exams(*), feedback_analysis(*)")
                .eq("id", examContextId)
                .maybeSingle()

            if (sheet) {
                const exam = sheet.exams as any
                const fb = (sheet.feedback_analysis as any[])?.[0]
                const rca = fb?.root_cause_analysis || {}
                examContext = `\n\nExam context: ${fb?.exam_name || exam?.exam_name} — Score: ${sheet.total_score}/${fb?.exam_total_marks || exam?.total_marks}. Errors: concept=${rca.concept || 0}, calculation=${rca.calculation || 0}, keyword=${rca.keyword || 0}`
            }
        }

        const systemPrompt = `You are an AI Study Guide tutor for Indian school students. Help the student based on their materials and exam performance.\n\n${context}${examContext}\n\nBe specific, encouraging, and reference the actual content when answering.`

        const result = streamText({
            model: google("gemini-1.5-flash"),
            system: systemPrompt,
            messages,
        })

        return result.toTextStreamResponse()
    } catch (error) {
        console.error("Chat Error:", error)
        return new Response("Chat Failed", { status: 500 })
    }
}
