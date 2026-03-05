import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
    try {
        const { type, id, studentId, title } = await req.json()
        const supabase = createAdminClient()

        let content = ""

        if (type === "exam") {
            const { data: sheet } = await supabase
                .from("answer_sheets")
                .select("total_score, feedback_analysis(*)")
                .eq("id", id)
                .maybeSingle()

            if (!sheet) {
                return NextResponse.json({ error: "Data not found" }, { status: 404 })
            }

            content = JSON.stringify(
                { score: sheet.total_score, feedback: sheet.feedback_analysis },
                null,
                2
            )
        }

        if (!content) {
            return NextResponse.json({ error: "Data not found" }, { status: 404 })
        }

        const { error } = await supabase.from("student_sources").insert({
            student_id: studentId,
            type: "imported_exam",
            title: title,
            ocr_text: content,
            file_url: "",
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Import Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
