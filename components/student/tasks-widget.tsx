"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { CheckCircle, Clock, Zap, Calendar, ArrowRight } from "lucide-react"
import { toggleTaskStatus } from "@/app/actions/planner"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface StudentTasksWidgetProps {
    initialTasks: any[]
}

export function StudentTasksWidget({ initialTasks }: StudentTasksWidgetProps) {
    const [tasks, setTasks] = useState(initialTasks)

    const handleToggle = async (taskId: string, status: string) => {
        // Optimistic update
        setTasks(prev => prev.map((t: any) =>
            t.id === taskId ? { ...t, status: status === 'completed' ? 'pending' : 'completed' } : t
        ))
        await toggleTaskStatus(taskId, status)
    }

    const pendingTasks = tasks.filter(t => t.status !== 'completed').slice(0, 5)

    return (
        <GlassCard className="p-6 flex flex-col h-full overflow-hidden border-white/5 relative">
            <div className="absolute top-0 right-0 p-32 bg-neon-cyan/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Calendar size={18} className="text-neon-cyan" />
                    Today's Tasks
                </h3>
                <Link href="/student/planner" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-neon-cyan transition-colors flex items-center gap-1">
                    Flight Plan <ArrowRight size={10} />
                </Link>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar relative z-10 pr-1">
                {pendingTasks.length > 0 ? (
                    pendingTasks.map((task: any) => (
                        <div
                            key={task.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <button
                                className={cn(
                                    "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                                    task.status === 'completed'
                                        ? "bg-green-500 border-green-500 text-black"
                                        : "border-white/20 hover:border-green-500"
                                )}
                                onClick={() => handleToggle(task.id, task.status)}
                            >
                                {task.status === 'completed' && <CheckCircle size={12} />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-xs font-bold truncate",
                                    task.status === 'completed' && "line-through text-muted-foreground opacity-50"
                                )}>
                                    {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded uppercase font-mono tracking-wider",
                                        task.priority === 'High' ? "bg-red-500/10 text-red-400" :
                                            task.priority === 'Medium' ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                                    )}>
                                        {task.priority}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                                        <Clock size={10} /> {task.estimated_duration}m
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 opacity-50">
                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                            <CheckCircle size={20} className="text-muted-foreground" />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">No pending tasks. Clear skies!</p>
                    </div>
                )}
            </div>

            {tasks.length > 5 && (
                <p className="mt-4 text-[10px] text-center text-muted-foreground italic">
                    + {tasks.length - 5} more tasks in your planner
                </p>
            )}
        </GlassCard>
    )
}
