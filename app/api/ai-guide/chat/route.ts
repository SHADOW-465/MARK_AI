import { GoogleGenerativeAI } from "@google/generative-ai"
import { smoothStream, streamText } from "ai" // Utilizing Vercel AI SDK if possible, or manual streaming
// The user has "ai": "latest" and "@ai-sdk/google": "latest" in package.json (Step 10).
import { google } from "@ai-sdk/google"
import { prisma } from "@/lib/prisma"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, sourceIds, studentId } = await req.json()

        // 1. Fetch context from sources
        const sources = await prisma.studentSource.findMany({
            where: {
                id: { in: sourceIds },
                student_id: studentId
            }
        })

        const context = sources.map((s: { title: string | null; ocr_text: string | null }) => `Source: ${s.title}\nContent: ${s.ocr_text || "(No text)"}`).join("\n\n")

        const systemPrompt = `You are an AI Study Guide. Assist the student based on the following materials:\n\n${context}\n\nAnswer their questions accurately and concisely.`

        // 2. Stream Response
        const result = streamText({
            model: google("gemini-1.5-flash"),
            system: systemPrompt,
            messages,
        })

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('Chat Error:', error)
        return new Response('Chat Failed', { status: 500 })
    }
}
