import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { KanbanBoard } from "@/components/student/kanban-board"
import { Folder, Search, Filter, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function StudentVault() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Unauthorized</div>

    const { data: student } = await supabase
        .from("students")
        .select("id, name")
        .eq("user_id", user.id)
        .single()

    if (!student) return <div>Student not found</div>

    // Fetch Tasks for Kanban
    const { data: tasks } = await supabase
        .from("student_tasks")
        .select("*")
        .eq("student_id", student.id)
        .order("due_date", { ascending: true })

    // Fetch Subject Folders (Derived from tasks and materials)
    const { data: materials } = await supabase
        .from("study_materials")
        .select("id, title, created_at")
        .eq("student_id", student.id)

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">The Vault</h1>
                    <p className="text-muted-foreground mt-1">Your relational knowledge hub & mission control.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search knowledge..."
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-neon-cyan/50 transition-all w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* SIDEBAR: Knowledge Folders */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Knowledge Base</h3>
                        <Plus size={14} className="text-muted-foreground hover:text-neon-cyan cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                        {['Mathematics', 'Physics', 'History', 'Untagged'].map((folder) => (
                            <div key={folder} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 group cursor-pointer transition-all">
                                <Folder size={18} className="text-neon-purple group-hover:text-neon-cyan transition-colors" />
                                <span className="text-sm font-medium">{folder}</span>
                                <span className="ml-auto text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                                    {folder === 'Untagged' ? materials?.length || 0 : 0}
                                </span>
                            </div>
                        ))}
                    </div>

                    <GlassCard className="p-4 bg-neon-cyan/5 border-neon-cyan/20">
                        <p className="text-[10px] text-neon-cyan font-mono uppercase tracking-tighter mb-2">Pro Tip</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Drag tasks to "Mastered" to automatically generate flashcards for active recall.
                        </p>
                    </GlassCard>
                </div>

                {/* MAIN: Kanban Board */}
                <div className="lg:col-span-9 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Filter size={18} className="text-neon-cyan" />
                            Active Missions
                        </h3>
                        <div className="flex gap-2">
                            {['All', 'High', 'Medium'].map(p => (
                                <button key={p} className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 hover:border-white/20">
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <KanbanBoard initialTasks={tasks || []} studentId={student.id} />
                </div>
            </div>
        </div>
    )
}
