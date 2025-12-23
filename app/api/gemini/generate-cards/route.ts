import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const { sheetId } = await req.json()

        // 1. Fetch Feedback & Evaluations
        const { data: sheet } = await supabase
            .from("answer_sheets")
            .select("id, student_id, exams(exam_name, subject)")
            .eq("id", sheetId)
            .single()

        const { data: evals } = await supabase
            .from("question_evaluations")
            .select("question_num, gaps, strengths, extracted_text")
            .eq("answer_sheet_id", sheetId)
            .not("gaps", "is", null)

        if (!evals || evals.length === 0) {
            return NextResponse.json({ message: "No significant gaps found to generate cards." })
        }

        // 2. Prepare Prompt for Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const prompt = `
            You are an expert tutor. I will provide you with AI-generated feedback on a student's exam answers.
            Your goal is to create high-quality active recall flashcards (Question/Answer/Explanation) to help the student fix these specific gaps.
            
            Subject: ${sheet.exams.subject}
            Exam: ${sheet.exams.exam_name}
            
            Feedback Data:
            ${JSON.stringify(evals.map(e => ({ q: e.question_num, text: e.extracted_text, gap: e.gaps })))}
            
            Return a JSON array of flashcards. Each object must have:
            - question: A concise question targeting the conceptual gap.
            - answer: The correct, clear answer.
            - explanation: A brief "why" or mnemonic.
            - tags: An array of 1-3 relevant keywords (e.g. ["physics", "thermodynamics"]).
            
            Only return the JSON array.
        `

        const result = await model.generateContent(prompt)
        const text = result.response.text()
        // Clean markdown if present
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        const cards = JSON.parse(jsonMatch ? jsonMatch[0] : text)

        // 3. Save to Flashcards Table
        const { error: insertError } = await supabase
            .from("flashcards")
            .insert(cards.map((c: any) => ({
                student_id: sheet.student_id,
                source_answer_sheet_id: sheetId,
                subject: sheet.exams.subject,
                question: c.question,
                answer: c.answer,
                explanation: c.explanation,
                tags: c.tags,
                level: 1,
                next_review_at: new Date().toISOString()
            })))

        if (insertError) throw insertError

        return NextResponse.json({ success: true, count: cards.length })

    } catch (error) {
        console.error("Card Gen Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
