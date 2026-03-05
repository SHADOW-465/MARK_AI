import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(req: Request) {
    try {
        const { sessionId, rating } = await req.json()

        if (!sessionId) {
            return NextResponse.json({ error: "sessionId required" }, { status: 400 })
        }

        const supabase = createAdminClient()
        await supabase
            .from("ai_guide_sessions")
            .update({ rating })
            .eq("id", sessionId)

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Rating Failed" }, { status: 500 })
    }
}
