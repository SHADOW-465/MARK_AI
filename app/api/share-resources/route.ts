import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
    try {
        const { studentIds, title, content, fileUrl } = await req.json()

        if (!studentIds?.length) {
            return NextResponse.json({ error: "No students specified" }, { status: 400 })
        }

        const supabase = createAdminClient()

        // Bulk insert — one row per student
        const rows = studentIds.map((studentId: string) => ({
            student_id: studentId,
            type: "shared",
            title: title || "Shared Resource",
            ocr_text: content || "",
            file_url: fileUrl || "",
        }))

        const { error } = await supabase.from("student_sources").insert(rows)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, count: studentIds.length })
    } catch (error) {
        console.error("Share Error:", error)
        return NextResponse.json({ error: "Share Failed" }, { status: 500 })
    }
}
