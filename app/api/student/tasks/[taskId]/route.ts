import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: { taskId: string } }) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        const { status } = await req.json()
        const { taskId } = params

        // Update task
        const { error } = await supabase
            .from("student_tasks")
            .update({ status })
            .eq("id", taskId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Task Update Error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
