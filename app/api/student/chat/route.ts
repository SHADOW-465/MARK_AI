import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { truncateContext } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const { message, fileIds = [], examIds = [], synthesisType } = await request.json()
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

    // 1. Fetch File Content (Context) from multiple files
    let fileContext = ""
    if (fileIds.length > 0) {
      const { data: files } = await supabase
        .from("study_materials")
        .select("title, extracted_text")
        .in("id", fileIds)
        .eq("student_id", student.id)

      if (files) {
        fileContext = files.map(f => `
                CONTEXT FROM USER FILE "${f.title}":
                ${truncateContext(f.extracted_text)}
            `).join("\n---\n")
      }
    }

    // 1.1 Fetch Exam Content if multiple examIds provided
    let examContext = ""
    if (examIds.length > 0) {
      const { data: sheets } = await supabase
        .from("answer_sheets")
        .select(`
                total_score,
                exams (exam_name, subject, marking_scheme),
                question_evaluations (question_num, extracted_text, final_score, reasoning)
            `)
        .in("id", examIds)
        .eq("student_id", student.id)

      if (sheets) {
        examContext = sheets.map(sheet => {
          const evals = (sheet.question_evaluations as any[]).map(e => {
            const q = (sheet.exams as any).marking_scheme.find((mq: any) => mq.question_num === e.question_num)
            return `Question ${e.question_num} (${q?.question_text || "N/A"}): 
                        - Student Answer: ${e.extracted_text}
                        - Score: ${e.final_score}/${q?.max_marks || "N/A"}
                        - Teacher Feedback: ${e.reasoning}`
          }).join("\n\n")

          return `
                    CONTEXT FROM GRADED EXAM "${(sheet.exams as any).exam_name}":
                    Subject: ${(sheet.exams as any).subject}
                    Total Score: ${sheet.total_score}
                    
                    Detailed Evaluations:
                    ${evals}
                `
        }).join("\n---\n")
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
      ? "MODE: CHALLENGE. The student is a high-achiever. Do not simplify too much. Push them with edge cases, university-level applications, and deeper questions."
      : "MODE: SUPPORT. Explain concepts simply ('Like I'm 5'). Use analogies."

    const interestInstruction = (student.interests && student.interests.length > 0)
      ? `ANALOGY FRAMEWORK: Use student interests: ${student.interests.join(", ")}.`
      : ""

    const synthesisInstruction = synthesisType === 'faq'
      ? "FORMAT: Return a structured list of FAQs."
      : synthesisType === 'glossary'
        ? "FORMAT: Return a glossary list."
        : ""

    const systemPrompt = `
    You are an AI Tutor in the "Deep Work Studio", inspired by NotebookLM.
    ${modeInstruction}
    ${interestInstruction}
    ${synthesisInstruction}

    ${gapContext}

    SOURCE MATERIALS:
    ${fileContext}
    ${examContext}

    CRITICAL RULE FOR CITATIONS:
    Whenever you use information from a source, YOU MUST cite it in-line using brackets with the source name, e.g. [[Force & Motion Notes]] or [[Midterm Physics Exam]].
    
    If the context is missing, apologize and answer generally.
    `

    // 4. Call Gemini
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
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
