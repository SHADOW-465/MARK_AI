import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { PlannerClient } from "./planner-client"

export default async function AutopilotPlanner() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get student ID
    const { data: student } = await supabase.from("students").select("id").eq("user_id", user?.id).single()

    let tasks = []
    if (student) {
        const { data } = await supabase
            .from("student_tasks")
            .select("*")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false })
        tasks = data || []
    }

    return (
        <div className="space-y-8">
            <PlannerClient initialTasks={tasks} />
        </div>
    )
}
