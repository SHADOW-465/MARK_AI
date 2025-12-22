import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { truncateContext } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const { message, fileId, examId } = await request.json()
    const supabase = await createClient()

    // 0. Verify Student & Get User Details (Interests, Challenge Mode)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: student } = await supabase
      .from("students")
      .select("id, interests, challenge_mode")
      .eq("user_id", user.id)
      .single()

    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    // 1. Fetch File Content (Context)
    let fileContext = ""
    if (fileId) {
      const { data: file } = await supabase
        .from("study_materials")
        .select("title, extracted_text")
        .eq("id", fileId)
        .eq("student_id", student.id) // Security check
        .single()

      if (file) {
        fileContext = `
            CONTEXT FROM USER FILE "${file.title}":
            ${truncateContext(file.extracted_text)}
            `
      }
    }

    // 1.1 Fetch Exam Content if examId provided
    let examContext = ""
    if (examId) {
      const { data: sheet } = await supabase
        .from("answer_sheets")
        .select(`
                total_score,
                exams (exam_name, subject, marking_scheme),
                question_evaluations (question_num, extracted_text, final_score, reasoning)
            `)
        .eq("id", examId)
        .eq("student_id", student.id)
        .single()

      if (sheet) {
        const evals = (sheet.question_evaluations as any[]).map(e => {
          const q = (sheet.exams as any).marking_scheme.find((mq: any) => mq.question_num === e.question_num)
          return `Question ${e.question_num} (${q?.question_text || "N/A"}): 
                - Student Answer: ${e.extracted_text}
                - Score: ${e.final_score}/${q?.max_marks || "N/A"}
                - Teacher Feedback: ${e.reasoning}`
        }).join("\n\n")

        examContext = `
            CONTEXT FROM GRADED EXAM "${(sheet.exams as any).exam_name}":
            Subject: ${(sheet.exams as any).subject}
            Total Score: ${sheet.total_score}
            
            Detailed Evaluations:
            ${evals}
            `
      }
    }

    // 2. Fetch Last 5 Concept Errors (Gap Analysis)
    // We look for feedback_analysis entries where root_cause_analysis indicates concept errors
    // Since root_cause_analysis is JSONB, we just fetch the latest ones and parse in prompt if needed.
    // Ideally we filter, but for now we take the latest 5 feedbacks.
    const { data: feedbackList } = await supabase
      .from("feedback_analysis")
      .select("root_cause_analysis, focus_areas")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(5)

    let gapContext = ""
    if (feedbackList && feedbackList.length > 0) {
      const errors = feedbackList
        .map(f => {
          const root = f.root_cause_analysis as any
          // Only include if there are concept errors
          if (root?.concept && Number(root.concept) > 0) {
            return `Focus Areas: ${f.focus_areas?.join(", ")} (Concept Errors: ${root.concept} marks lost)`
          }
          return null
        })
        .filter(Boolean)

      if (errors.length > 0) {
        gapContext = `
            RECENT STUDENT STRUGGLES (CONCEPT GAPS):
            The student has recently lost marks in these areas due to conceptual misunderstanding. Use this to tailor your explanations:
            ${errors.join("\n")}
            `
      }
    }

    // 3. Construct System Prompt
    const modeInstruction = student.challenge_mode
      ? "MODE: CHALLENGE. The student is a high-achiever. Do not simplify too much. Push them with edge cases, university-level applications, and deeper questions. Test their mastery."
      : "MODE: SUPPORT. Explain concepts simply ('Like I'm 5'). Use analogies."

    const interestInstruction = (student.interests && student.interests.length > 0)
      ? `ANALOGY FRAMEWORK: The student is interested in: ${student.interests.join(", ")}. Use these topics for metaphors and examples.`
      : ""

    const systemPrompt = `
    You are an AI Tutor in the "Deep Work Studio".
    ${modeInstruction}
    ${interestInstruction}

    ${gapContext}

    ${fileContext}
    ${examContext}

    If the context is missing, apologize and answer generally, but warn the user.
    `

    // 4. Call Gemini
    const { text } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      messages: [
        {
          role: "system",
          content: systemPrompt
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
