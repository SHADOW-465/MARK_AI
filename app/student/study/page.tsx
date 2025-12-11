import { createClient } from "@/lib/supabase/server"
import { StudyClient } from "./study-client"

export default async function DeepWorkStudio() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get student ID
    const { data: student } = await supabase.from("students").select("id").eq("user_id", user?.id).single()

    let materials = []
    if (student) {
        const { data } = await supabase
            .from("study_materials")
            .select("*")
            .eq("student_id", student.id)
            .order("created_at", { ascending: false })
        materials = data || []
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
            <StudyClient initialMaterials={materials} />
        </div>
    )
}
