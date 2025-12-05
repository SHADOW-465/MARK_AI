import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: Request) {
  try {
    const { sheetId, fileUrls, examId } = await request.json()
    const supabase = await createClient()

    // 1. Fetch Exam Details (Rubric)
    const { data: exam } = await supabase.from("exams").select("*").eq("id", examId).single()

    if (!exam) throw new Error("Exam not found")

    // 2. Construct Prompt for Gemini
    const prompt = `
    You are an expert educational evaluator for ${exam.subject} at Class ${exam.class}.

    ## YOUR TASK
    Analyze the attached handwritten answer sheet images (there may be multiple pages) and:
    1. Extract all student answers (OCR from handwriting) across all pages.
    2. Match each answer to the corresponding question.
    3. Grade each answer against the rubric.
    4. Provide detailed, personalized feedback.

    ## EXAM DETAILS
    - Subject: ${exam.subject}
    - Total Questions: ${exam.marking_scheme.length}
    - Marking Precision: ${exam.marking_precision}
    - Total Marks: ${exam.total_marks}

    ## MARKING SCHEME & RUBRIC
    ${JSON.stringify(exam.marking_scheme, null, 2)}

    ## GRADING GUIDELINES
    - **Understand Intent**: Focus on what the student is trying to convey, not exact wording
    - **Partial Credit**: Award marks for partial understanding
    - **Marking Precision**: Apply ${exam.marking_precision} rounding

    ## OUTPUT FORMAT (JSON)
    Return ONLY valid JSON in this exact structure:

    {
      "ocr_extractions": [
        {
          "question_num": 1,
          "extracted_text": "...",
          "confidence": 0.95
        }
      ],
      "evaluations": [
        {
          "question_num": 1,
          "score": 4.5,
          "max_marks": 5,
          "confidence": 0.92,
          "reasoning": "...",
          "strengths": ["..."],
          "gaps": ["..."]
        }
      ],
      "overall_feedback": "...",
      "total_score": 42.5,
      "confidence": 0.9
    }
    `

    // 3. Call Gemini API
    // Construct content array with text prompt and all images
    const content: any[] = [{ type: "text", text: prompt }]

    if (Array.isArray(fileUrls)) {
      fileUrls.forEach((url: string) => {
        content.push({ type: "image", image: new URL(url) })
      })
    } else if (typeof fileUrls === 'string') {
      // Fallback for single file legacy support
      content.push({ type: "image", image: new URL(fileUrls) })
    }

    const { text } = await generateText({
      model: google("gemini-2.0-flash-exp"), // Or appropriate model
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
    })

    // 4. Parse Response
    // Clean up markdown code blocks if present
    const jsonStr = text.replace(/```json\n|\n```/g, "")
    const result = JSON.parse(jsonStr)

    // 5. Update Database

    // Update answer_sheet
    await supabase
      .from("answer_sheets")
      .update({
        status: "graded",
        gemini_response: result,
        total_score: result.total_score,
        confidence: result.confidence,
      })
      .eq("id", sheetId)

    // Insert question_evaluations
    const evaluations = result.evaluations.map((evalItem: any) => {
      const extraction = result.ocr_extractions.find((e: any) => e.question_num === evalItem.question_num)
      return {
        answer_sheet_id: sheetId,
        question_num: evalItem.question_num,
        extracted_text: extraction?.extracted_text || "",
        ai_score: evalItem.score,
        final_score: evalItem.score, // Default to AI score initially
        confidence: evalItem.confidence,
        reasoning: evalItem.reasoning,
        strengths: evalItem.strengths,
        gaps: evalItem.gaps,
      }
    })

    await supabase.from("question_evaluations").insert(evaluations)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Grading error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
