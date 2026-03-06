import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

type GenType =
    | "summary" | "quiz" | "faq" | "study_plan"
    | "concept_explainer" | "drill_practice" | "keyword_builder" | "exam_debrief"

function buildPrompt(type: GenType, sourceContext: string, examContext: string): string {
    const base = `You are an expert tutor for Indian school students (CBSE/ICSE/State Board). Be specific, clear, and encouraging.\n\n`

    switch (type) {
        case "summary":
            return `${base}Summarize these study materials. Focus on key concepts and important points.\n\n${sourceContext}`
        case "quiz":
            return `${base}Generate a 5-question multiple choice quiz. Return as JSON array:
[{ "question": "...", "options": ["A","B","C","D"], "answer": "A", "explanation": "..." }]\n\nMaterials:\n${sourceContext}`
        case "faq":
            return `${base}Generate 5 common exam questions with detailed model answers.\n\nMaterials:\n${sourceContext}`
        case "study_plan":
            return `${base}Create a structured 3-day study plan with daily topics, activities, and revision checkpoints.\n\nMaterials:\n${sourceContext}`
        case "concept_explainer":
            return `${base}The student made CONCEPT ERRORS — they don't fully understand the underlying ideas.
- Explain core concepts clearly using analogies and real-world examples
- Break down each complex idea step by step
- End with 3 "check your understanding" questions
${examContext ? `\nExam context:\n${examContext}\n` : ""}
Materials:\n${sourceContext}`
        case "drill_practice":
            return `${base}The student made CALCULATION/PROCEDURAL ERRORS.
Generate 8 practice problems with full step-by-step worked solutions.
- Each problem isolates one procedural step
- Show every step explicitly
- Mark the step most students get wrong
${examContext ? `\nExam context:\n${examContext}\n` : ""}
Materials:\n${sourceContext}`
        case "keyword_builder":
            return `${base}The student made KEYWORD/EXPRESSION ERRORS.
1. List 10 key terms with clear definitions
2. Show 3 examples: weak student answer → strong model answer
3. Provide a "power phrases" list for this topic
${examContext ? `\nExam context:\n${examContext}\n` : ""}
Materials:\n${sourceContext}`
        case "exam_debrief":
            return `${base}Review this student's graded exam and write a structured debrief.

EXAM PERFORMANCE:
${examContext}

STUDY MATERIALS (if any):
${sourceContext || "(None provided)"}

Write:
1. **What you did well** — specific, cite actual correct areas
2. **Where you lost marks** — each gap with error type (concept / calculation / keyword)
3. **The fix for each gap** — concrete and actionable
4. **Your study priority** — rank gaps from most to least impactful
5. **One encouraging note** — genuine, not generic`
        default:
            return `${base}Provide helpful study insights.\n\n${sourceContext}`
    }
}

export async function POST(req: Request) {
    try {
        const { type, sourceIds, studentId, sessionId, examContextId } = await req.json()
        const supabase = createAdminClient()

        // 1. Fetch source materials
        let sourceContext = ""
        if (sourceIds && sourceIds.length > 0) {
            const { data: sources } = await supabase
                .from("student_sources")
                .select("title, ocr_text")
                .in("id", sourceIds)
                .eq("student_id", studentId)

            if (sources) {
                sourceContext = sources
                    .map((s) => `[${s.title}]\n${s.ocr_text || "(No text extracted)"}`)
                    .join("\n\n---\n\n")
            }
        }

        // 2. Fetch exam context
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
                const rca = (fb?.root_cause_analysis as Record<string, number>) || {}
                const examName = fb?.exam_name || exam?.exam_name || "Exam"
                const subject = fb?.exam_subject || exam?.subject || "General"
                const totalMarks = fb?.exam_total_marks || exam?.total_marks || 100
                examContext = `Exam: ${examName} (${subject})
Score: ${sheet.total_score}/${totalMarks} (${Math.round(((sheet.total_score || 0) / totalMarks) * 100)}%)
Error breakdown:
  Concept errors: ${rca.concept || 0}
  Calculation errors: ${rca.calculation || 0}
  Keyword/expression errors: ${rca.keyword || 0}`
            }
        }

        // No source or exam context — use a general study helper prompt
        if (!sourceContext && !examContext) {
            sourceContext = "(No specific materials uploaded yet. Generate helpful general study content for this topic.)"
        }

        // 3. Generate
        const prompt = buildPrompt(type as GenType, sourceContext, examContext)
        const result = await model.generateContent(prompt)
        const text = result.response.text()

        // 4. Persist output to session if sessionId provided
        if (sessionId) {
            const { data: session } = await supabase
                .from("ai_guide_sessions")
                .select("generated_outputs")
                .eq("id", sessionId)
                .single()

            const existing = (session?.generated_outputs as any[]) || []
            await supabase
                .from("ai_guide_sessions")
                .update({
                    generated_outputs: [
                        ...existing,
                        { type, content: text, saved: false, created_at: new Date().toISOString() },
                    ],
                    last_active_at: new Date().toISOString(),
                })
                .eq("id", sessionId)
        }

        return NextResponse.json({ result: text })
    } catch (error) {
        console.error("AI Gen Error:", error)
        return NextResponse.json({ error: "AI Generation Failed" }, { status: 500 })
    }
}
