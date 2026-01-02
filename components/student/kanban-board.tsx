"use client"

import { useState } from "react"
import { motion, Reorder } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react"

type Task = {
    id: string
    title: string
    status: string
    priority: string
    due_date?: string
}

const COLUMNS = [
    { id: "pending", label: "To-Do", color: "text-muted-foreground" },
    { id: "in_progress", label: "In Progress", color: "text-neon-cyan" },
    { id: "completed", label: "Mastered", color: "text-emerald-400" }
]

export function KanbanBoard({ initialTasks, studentId }: { initialTasks: any[], studentId: string }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)

    const moveTask = async (taskId: string, newStatus: string) => {
        // Optimistic UI
        const oldTasks = [...tasks]
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

        try {
            const response = await fetch(`/api/student/tasks/${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
                headers: { 'Content-Type': 'application/json' }
            })

            if (!response.ok) throw new Error("Failed to update task")

            // If moving to COMPLETED, award XP via gamify API
            if (newStatus === 'completed') {
                await fetch('/api/student/gamify', {
                    method: 'POST',
                    body: JSON.stringify({
                        amount: 50,
                        activity: 'task_completion',
                        description: `Completed task: ${tasks.find(t => t.id === taskId)?.title}`
                    }),
                    headers: { 'Content-Type': 'application/json' }
                })
            }
        } catch (error) {
            console.error(error)
            setTasks(oldTasks) // Rollback
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map(col => (
                <div key={col.id} className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className={cn("h-2 w-2 rounded-full", col.id === 'pending' ? 'bg-muted-foreground/30' : col.id === 'in_progress' ? 'bg-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]')} />
                        <h4 className={cn("text-xs font-bold uppercase tracking-widest", col.color)}>{col.label}</h4>
                        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                            {tasks.filter(t => t.status === col.id).length}
                        </span>
                    </div>

                    <div className="space-y-3 min-h-[400px] p-2 rounded-2xl bg-white/[0.02] border border-dashed border-white/5">
                        {tasks.filter(t => t.status === col.id).map(task => (
                            <motion.div
                                key={task.id}
                                layoutId={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -2 }}
                                className="group"
                            >
                                <GlassCard className="p-4 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={cn(
                                            "text-[9px] font-bold px-1.5 py-0.5 rounded border",
                                            task.priority === 'High' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                                                task.priority === 'Medium' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                                    "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                        )}>
                                            {task.priority}
                                        </span>
                                        {col.id !== 'completed' && (
                                            <button
                                                onClick={() => moveTask(task.id, col.id === 'pending' ? 'in_progress' : 'completed')}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-md text-neon-cyan"
                                            >
                                                <CheckCircle2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <h5 className="text-sm font-semibold mb-3 leading-tight text-foreground/90">{task.title}</h5>

                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="flex items-center gap-1 text-[10px]">
                                            <Clock size={10} />
                                            <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
