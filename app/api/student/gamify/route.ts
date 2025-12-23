import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { amount, activity, description } = await req.json()

        if (!amount || !activity) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        // Fetch student record
        const { data: student } = await supabase
            .from("students")
            .select("id")
            .eq("user_id", user.id)
            .single()

        if (!student) {
            return new NextResponse("Student record not found", { status: 404 })
        }

        // Call the RPC function defined in the migration
        const { error } = await supabase.rpc("award_student_xp", {
            p_student_id: student.id,
            p_amount: amount,
            p_activity: activity,
            p_desc: description
        })

        if (error) throw error

        return NextResponse.json({ success: true, message: `Awarded ${amount} XP` })

    } catch (error) {
        console.error("XP Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
