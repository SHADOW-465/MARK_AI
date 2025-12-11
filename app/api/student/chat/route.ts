import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: Request) {
  try {
    const { message, fileId } = await request.json()
    const supabase = await createClient()

    // 1. Fetch File Content (Context)
    // In a full implementation, we would download the file from Storage or use a vector DB.
    // For this implementation, we use the `extracted_text` column if available,
    // or fallback to a generic response if the file is a PDF/Image that we haven't processed yet.

    let context = ""
    if (fileId) {
        const { data: file } = await supabase
            .from("study_materials")
            .select("title, extracted_text")
            .eq("id", fileId)
            .single()

        if (file) {
            context = `
            CONTEXT FROM USER FILE "${file.title}":
            ${file.extracted_text ? file.extracted_text.substring(0, 10000) : "[No text extracted. Respond based on general knowledge but mention you can't read the file yet.]"}
            `
        }
    }

    // 2. Call Gemini
    const { text } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      messages: [
        {
          role: "system",
          content: `You are an AI Tutor in the "Deep Work Studio".
          Your goal is to explain concepts simply ("Like I'm 5") or using the student's interests if specified.
          Use the provided context from the student's notes to answer their question.
          If the context is missing, apologize and answer generally.

          ${context}`
        },
        {
          role: "user",
          content: message,
        },
      ],
    })

    return NextResponse.json({ reply: text })

  } catch (error: any) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
