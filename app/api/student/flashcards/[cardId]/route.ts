import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: { cardId: string } }) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const { level, nextReview } = await req.json()
        const { cardId } = params

        const { error } = await supabase
            .from("flashcards")
            .update({
                level,
                next_review_at: nextReview,
                last_reviewed_at: new Date().toISOString()
            })
            .eq("id", cardId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("SRS Patch Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
