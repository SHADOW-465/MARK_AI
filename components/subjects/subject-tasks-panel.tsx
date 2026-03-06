"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, CheckCircle2, Circle, Trash2, Clock } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  status: "pending" | "completed"
  created_at: string
}

interface Session {
  id: string
  duration_minutes: number | null
  notes: string | null
  created_at: string
}

interface SubjectTasksPanelProps {
  subjectId: string
  initialTasks: Task[]
  initialSessions: Session[]
}

export function SubjectTasksPanel({ subjectId, initialTasks, initialSessions }: SubjectTasksPanelProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [sessions, setSessions] = useState<Session[]>(initialSessions)
  const [newTask, setNewTask] = useState("")
  const [addingTask, setAddingTask] = useState(false)
  const [taskLoading, setTaskLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionMinutes, setSessionMinutes] = useState(30)
  const [sessionNotes, setSessionNotes] = useState("")
  const [loggingSession, setLoggingSession] = useState(false)

  const handleAddTask = async () => {
    if (!newTask.trim()) return
    setTaskLoading(true)
    const res = await fetch("/api/student/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask.trim(), subjectId }),
    })
    if (res.ok) {
      const { task } = await res.json()
      setTasks((prev) => [task, ...prev])
    }
    setNewTask("")
    setAddingTask(false)
    setTaskLoading(false)
  }

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed"
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))
    await fetch(`/api/student/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    await fetch("/api/student/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    })
  }

  const handleLogSession = async () => {
    setSessionLoading(true)
    const res = await fetch("/api/student/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        duration_minutes: sessionMinutes,
        notes: sessionNotes.trim() || null,
      }),
    })
    if (res.ok) {
      const { session } = await res.json()
      setSessions((prev) => [session, ...prev])
    }
    setSessionMinutes(30)
    setSessionNotes("")
    setLoggingSession(false)
    setSessionLoading(false)
  }

  const pending = tasks.filter((t) => t.status === "pending")
  const completed = tasks.filter((t) => t.status === "completed")

  return (
    <div className="space-y-4">
      {/* Tasks */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Tasks</h3>
          <button
            onClick={() => setAddingTask((v) => !v)}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus size={12} /> Add task
          </button>
        </div>

        {addingTask && (
          <div className="mb-3 flex items-center gap-2">
            <input
              autoFocus
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask()
                if (e.key === "Escape") setAddingTask(false)
              }}
              placeholder="Task title..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
            <Button size="sm" onClick={handleAddTask} disabled={taskLoading || !newTask.trim()}>
              {taskLoading ? <Loader2 size={12} className="animate-spin" /> : "Add"}
            </Button>
          </div>
        )}

        {tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No tasks yet. Add one above.</p>
        ) : (
          <div className="space-y-1.5">
            {[...pending, ...completed].map((task) => (
              <div key={task.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                <button onClick={() => handleToggleTask(task)} className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors">
                  {task.status === "completed" ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <Circle size={16} />
                  )}
                </button>
                <span className={cn("flex-1 text-sm", task.status === "completed" && "line-through text-muted-foreground")}>
                  {task.title}
                </span>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="hidden group-hover:flex text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {completed.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {completed.length}/{tasks.length} completed
          </p>
        )}
      </GlassCard>

      {/* Study Sessions */}
      <GlassCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Study Sessions</h3>
          <button
            onClick={() => setLoggingSession((v) => !v)}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            <Clock size={12} /> Log session
          </button>
        </div>

        {loggingSession && (
          <div className="mb-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-16 flex-shrink-0">Minutes</label>
              <input
                type="number"
                min={1}
                max={480}
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(Number(e.target.value))}
                className="w-20 rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground w-16 flex-shrink-0">Notes</label>
              <input
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Optional notes..."
                className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
              />
            </div>
            <Button size="sm" onClick={handleLogSession} disabled={sessionLoading} className="w-full">
              {sessionLoading ? <Loader2 size={12} className="animate-spin" /> : "Log"}
            </Button>
          </div>
        )}

        {sessions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No sessions logged yet.</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 8).map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {session.duration_minutes ? `${session.duration_minutes} min` : "Session"}
                  </p>
                  {session.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{session.notes}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
