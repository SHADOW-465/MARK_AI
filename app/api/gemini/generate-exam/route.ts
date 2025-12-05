import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { prompt, mode, context } = await request.json()

    // Schema for the output
    const questionSchema = z.object({
      questions: z.array(
        z.object({
          question_num: z.number(),
          question_text: z.string(),
          max_marks: z.number(),
          rubric: z.string(),
          model_answer: z.string(),
        }),
      ),
    })

    let systemPrompt = `
      You are an expert teacher and exam creator. 
      Your task is to generate a structured exam based on the user's input.
      
      For each question, you MUST provide:
      1. The question text
      2. Maximum marks (appropriate for the complexity)
      3. A detailed rubric (how to award marks)
      4. A model answer (the ideal response)
    `

    if (mode === "complete") {
      systemPrompt += `
        The user has provided a list of questions but no answers or rubrics.
        You must keep the questions exactly as they are (or slightly correct grammar) and generate the missing rubrics, marks, and model answers.
      `
    } else if (mode === "generate") {
      systemPrompt += `
        The user has provided a topic or raw text. 
        You must extract or generate questions from this content.
        If it's a topic, create diverse questions (definitions, explanations, diagrams).
        If it's raw text (like a pasted exam paper), parse it into the structure.
      `
    }

    const { object } = await generateObject({
      model: google("gemini-2.0-flash-exp"),
      schema: questionSchema,
      system: systemPrompt,
      prompt: `
        Context/Subject: ${context || "General"}
        
        User Input:
        ${prompt}
      `,
    })

    return NextResponse.json({ success: true, data: object.questions })
  } catch (error: any) {
    console.error("Generation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
