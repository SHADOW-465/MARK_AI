import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/ai-guide/sessions/:id
// Full session including chat_history and generated_outputs
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createAdminClient()
    const { data: session } = await supabase
        .from("ai_guide_sessions")
        .select("*")
        .eq("id", id)
        .single()

    if (!session) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    return NextResponse.json({ session })
}

// PATCH /api/ai-guide/sessions/:id
// Partial update — saves chat messages, outputs, mastery checkpoints, rename, etc.
// Always bumps last_active_at
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const supabase = createAdminClient()
        const { data: updated, error } = await supabase
            .from("ai_guide_sessions")
            .update({ ...body, last_active_at: new Date().toISOString() })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ session: updated })
    } catch (error) {
        console.error("Update session error:", error)
        return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
    }
}

// DELETE /api/ai-guide/sessions/:id
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = createAdminClient()
    await supabase.from("ai_guide_sessions").delete().eq("id", id)
    return NextResponse.json({ ok: true })
}
