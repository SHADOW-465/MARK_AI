import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

export async function POST(req: Request) {
    try {
        const { type, sourceIds, studentId } = await req.json()
        // type: 'summary' | 'quiz' | 'faq' | 'study_plan'

        // 1. Fetch Sources
        const sources = await prisma.studentSource.findMany({
            where: {
                id: { in: sourceIds },
                student_id: studentId
            }
        })

        if (!sources || sources.length === 0) {
            return NextResponse.json({ error: 'No sources found' }, { status: 404 })
        }

        // 2. Prepare Context for Gemini
        // Allow text from OCR or just file refs if Gemini supports URL (it doesn't directly via URL usually without File API).
        // Assuming we have text content (ocr_text) or we simulate it.
        // Ideally we use the File API for multimodal invokation, but for this snippet we'll use ocr_text or just title/description placeholder.

        // NOTE: Simulating text content fetch if OCR is missing (in real app, use PDF parser)
        let context = sources.map(s => `Source: ${s.title}\nContent: ${s.ocr_text || "(No text extracted)"}`).join("\n\n")

        // 3. Construct Prompt
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) // Using flash for speed/cost as per SRS (Gemini 2.5 implied/latest 1.5)

        let prompt = ""
        if (type === 'summary') {
            prompt = `Summarize the following study materials for a student. Focus on key concepts and definitions.\n\n${context}`
        } else if (type === 'quiz') {
            prompt = `Generate a 5-question multiple choice quiz based on these materials. Return JSON format with question, options, answer.\n\n${context}`
        } else if (type === 'study_plan') {
            prompt = `Create a bullet-point study plan based on these materials.\n\n${context}`
        } else {
            prompt = `Analyze these materials and provide helpful insights.\n\n${context}`
        }

        // 4. Generate
        const result = await model.generateContent(prompt)
        const text = result.response.text()

        // 5. Save Session/Log
        // (Optional: update session if exists, or just return)
        // For now returning directly.

        return NextResponse.json({ result: text })
    } catch (error) {
        console.error('AI Gen Error:', error)
        return NextResponse.json({ error: 'AI Generation Failed' }, { status: 500 })
    }
}
