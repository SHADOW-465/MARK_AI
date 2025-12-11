"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, Clock, Plus, Zap, Trash2 } from "lucide-react"
import { addTask, toggleTaskStatus } from "@/app/actions/planner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PlannerClient({ initialTasks }: { initialTasks: any[] }) {
    const [tasks, setTasks] = useState(initialTasks)
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const completed = tasks.filter((t: any) => t.status === 'completed').length
    const total = tasks.length

    const handleToggle = async (taskId: string, status: string) => {
        // Optimistic update
        setTasks(prev => prev.map((t: any) => t.id === taskId ? { ...t, status: status === 'completed' ? 'pending' : 'completed' } : t))
        await toggleTaskStatus(taskId, status)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await addTask(formData)
        if (res?.error) {
            alert(res.error)
        } else {
            setIsOpen(false)
            // Reload page to get new data or wait for revalidatePath logic (in real app, we might use router.refresh())
            window.location.reload()
        }
        setIsLoading(false)
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold">Autopilot</h1>
                    <p className="text-muted-foreground">Your dynamic adaptive schedule.</p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-neon-cyan text-black hover:bg-neon-cyan/80">
                            <Plus size={18} className="mr-2" /> Add Task manually
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black/90 border-white/10 backdrop-blur-xl text-foreground">
                        <DialogHeader>
                            <DialogTitle>Add New Task</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Task Title</Label>
                                <Input name="title" required className="bg-white/5 border-white/10" placeholder="e.g. Study Physics Ch 3" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Type</Label>
                                    <Select name="type" defaultValue="Study">
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Study">Study</SelectItem>
                                            <SelectItem value="Focus">Focus</SelectItem>
                                            <SelectItem value="Exam Prep">Exam Prep</SelectItem>
                                            <SelectItem value="Assignment">Assignment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Priority</Label>
                                    <Select name="priority" defaultValue="Medium">
                                        <SelectTrigger className="bg-white/5 border-white/10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="High">High</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Duration (mins)</Label>
                                <Input name="duration" type="number" defaultValue="30" className="bg-white/5 border-white/10" />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full bg-neon-cyan text-black">
                                {isLoading ? "Adding..." : "Add Task"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Task List */}
                <div className="lg:col-span-3 space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Calendar size={18} className="text-neon-purple" />
                        Today's Flight Plan
                    </h3>

                    {tasks.length > 0 ? (
                        tasks.map((task: any) => (
                            <GlassCard key={task.id} className={`p-4 flex items-center justify-between group transition-all ${
                                task.status === 'completed' ? 'opacity-60 grayscale' : 'hover:border-neon-cyan/30'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <button
                                        className={`h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${
                                            task.status === 'completed'
                                            ? 'bg-green-500 border-green-500 text-black'
                                            : 'border-white/20 hover:border-green-500'
                                        }`}
                                        onClick={() => handleToggle(task.id, task.status)}
                                    >
                                        {task.status === 'completed' && <CheckCircle size={14} />}
                                    </button>

                                    <div>
                                        <h4 className={`font-bold ${task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                            {task.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs mt-1">
                                            <span className={`px-2 py-0.5 rounded ${
                                                task.type === 'Focus' ? 'bg-red-500/20 text-red-400' :
                                                task.type === 'Exam Prep' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {task.type}
                                            </span>
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Clock size={12} /> {task.estimated_duration} mins
                                            </span>
                                            {task.why && (
                                                <span className="text-neon-purple flex items-center gap-1">
                                                    <Zap size={12} /> {task.why}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground bg-white/5 rounded-xl">
                            No tasks scheduled. Add one or complete an exam to generate tasks.
                        </div>
                    )}

                    {/* Auto-Reschedule Notice */}
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3 text-sm text-blue-300">
                        <Zap size={18} />
                        <span>Autopilot is active. Unfinished tasks will be automatically rescheduled to tomorrow's low-load slots.</span>
                    </div>
                </div>

                {/* Side Stats */}
                <div className="lg:col-span-1 space-y-4">
                    <GlassCard className="p-6">
                        <h4 className="font-bold mb-4">Daily Progress</h4>
                        <div className="relative h-32 w-32 mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-secondary" />
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="transparent"
                                    className="text-neon-green"
                                    strokeDasharray={351}
                                    strokeDashoffset={351 - (351 * ((total > 0 ? completed / total : 0)))}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-2xl font-bold font-display">{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
                        </div>
                        <div className="text-center text-sm text-muted-foreground">
                            {completed} of {total} tasks completed
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}
