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

    // Fetch Answer Sheet to get Student ID
    const { data: sheet } = await supabase.from("answer_sheets").select("student_id").eq("id", sheetId).single()
    const studentId = sheet?.student_id

    // 2. Construct Prompt for Gemini
    const prompt = `
    You are an expert educational evaluator for ${exam.subject} at Class ${exam.class}.

    ## YOUR TASK
    Analyze the attached handwritten answer sheet images (there may be multiple pages) and:
    1. Extract all student answers (OCR from handwriting) across all pages.
    2. Match each answer to the corresponding question.
    3. Grade each answer against the rubric.
    4. Provide detailed, personalized feedback including a "Student OS" analysis (ROI, Root Cause, Real World).

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

    ## ADDITIONAL ANALYSIS FOR STUDENT DASHBOARD
    - **Root Cause Analysis**: For every lost mark, determine if it was a 'Concept Error', 'Calculation Error', or 'Keywording Error'.
    - **Real World Application**: Explain ONE key real-world application of the concepts missed (or the exam topic in general) to motivate the student.
    - **ROI / Focus Areas**: Identify the top 2-3 topics where the student lost the most marks and which are easiest to fix.

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
          "gaps": ["..."],
          "root_cause": "Concept Error" // or "Calculation Error", "Keywording Error", "None"
        }
      ],
      "overall_feedback": "...",
      "student_os_analysis": {
        "real_world_application": "...", // e.g. "Understanding Thermodynamics is crucial for designing efficient car engines..."
        "root_cause_summary": {
           "concept": 5, // Total marks lost due to concept
           "calculation": 2,
           "keyword": 1
        },
        "focus_areas": ["Thermodynamics", "Kinematics"],
        "roi_analysis": [
           { "topic": "Thermodynamics", "potential_gain": 5, "effort": "Medium" }
        ]
      },
      "total_score": 42.5,
      "confidence": 0.9
    }
    `

    // 3. Call Gemini API
    const content: any[] = [{ type: "text", text: prompt }]

    if (Array.isArray(fileUrls)) {
      fileUrls.forEach((url: string) => {
        content.push({ type: "image", image: new URL(url) })
      })
    } else if (typeof fileUrls === 'string') {
      content.push({ type: "image", image: new URL(fileUrls) })
    }

    const { text } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
    })

    // 4. Parse Response
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
        final_score: evalItem.score,
        confidence: evalItem.confidence,
        reasoning: evalItem.reasoning,
        strengths: evalItem.strengths,
        gaps: evalItem.gaps,
        root_cause: evalItem.root_cause, // NEW: Store category for dashboard
      }
    })

    await supabase.from("question_evaluations").insert(evaluations)

    // Insert Feedback Analysis (Student OS Data)
    if (result.student_os_analysis && studentId) {
      await supabase.from("feedback_analysis").insert({
        answer_sheet_id: sheetId,
        student_id: studentId,
        overall_feedback: result.overall_feedback,
        real_world_application: result.student_os_analysis.real_world_application,
        root_cause_analysis: result.student_os_analysis.root_cause_summary,
        focus_areas: result.student_os_analysis.focus_areas,
        roi_analysis: result.student_os_analysis.roi_analysis
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Grading error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
