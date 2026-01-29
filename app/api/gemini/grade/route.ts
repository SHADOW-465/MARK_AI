import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText, embed } from "ai"
import { google } from "@ai-sdk/google"

// Plagiarism detection helper - truncate text for embedding (max ~8000 chars to be safe)
function truncateForEmbedding(text: string, maxLength: number = 8000): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

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

    // ============================================
    // PLAGIARISM DETECTION (Soft Fail - won't break grading)
    // ============================================
    try {
      // 1. Combine all extracted text for embedding
      const allExtractedText = result.ocr_extractions
        .map((e: any) => `Q${e.question_num}: ${e.extracted_text}`)
        .join("\n\n")

      if (allExtractedText.trim().length > 50) {
        // Only run if there's meaningful text
        // 2. Generate embedding using Gemini text-embedding-004
        const truncatedText = truncateForEmbedding(allExtractedText)
        const { embedding } = await embed({
          model: google.textEmbeddingModel("text-embedding-004"),
          value: truncatedText,
        })

        // 3. Store embedding in plagiarism_scores table
        const { data: insertedScore } = await supabase
          .from("plagiarism_scores")
          .insert({
            answer_sheet_id: sheetId,
            embedding: embedding,
            status: "pending",
          })
          .select("id")
          .single()

        // 4. Query for similar submissions using RPC function
        const { data: similarSubmissions } = await supabase.rpc(
          "find_similar_submissions",
          {
            query_embedding: embedding,
            match_threshold: 0.7,
            match_count: 5,
            exclude_sheet_id: sheetId,
            target_exam_id: examId,
          }
        )

        // 5. Calculate peer similarity (highest match)
        let peerSimilarity = 0
        let matchedPeers: any[] = []

        if (similarSubmissions && similarSubmissions.length > 0) {
          peerSimilarity = Math.round(similarSubmissions[0].similarity * 100)
          matchedPeers = similarSubmissions.map((s: any) => ({
            answer_sheet_id: s.answer_sheet_id,
            student_name: s.student_name,
            similarity: Math.round(s.similarity * 100),
          }))
        }

        // 6. Calculate combined score (for now, just peer similarity)
        // Model similarity would require having model answer embeddings stored
        const combinedScore = peerSimilarity

        // 7. Update plagiarism_scores with results
        await supabase
          .from("plagiarism_scores")
          .update({
            peer_similarity: peerSimilarity,
            combined_score: combinedScore,
            matched_peers: matchedPeers,
            status: combinedScore > 60 ? "flagged" : "checked",
            checked_at: new Date().toISOString(),
          })
          .eq("answer_sheet_id", sheetId)

        console.log(
          `[Plagiarism] Sheet ${sheetId}: ${combinedScore}% similarity detected`
        )
      }
    } catch (plagiarismError: any) {
      // Soft fail - log error but don't break grading
      console.error("[Plagiarism] Detection failed (soft fail):", plagiarismError.message)
      // Insert a record with error status so we know it failed
      await supabase
        .from("plagiarism_scores")
        .upsert({
          answer_sheet_id: sheetId,
          status: "error",
          combined_score: 0,
        })
        .select()
    }

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
