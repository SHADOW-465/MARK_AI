"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { SubjectCard } from "@/components/student-dashboard/subject-card"

interface Subject {
  id: string
  name: string
  color: string
  avgScore: number
  totalTasks: number
  completedTasks: number
  sessionCount: number
}

export function SubjectCarousel({ subjects }: { subjects: Subject[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setLoading(true)
    await fetch("/api/student/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setLoading(false)
    setAdding(false)
    setNewName("")
    router.refresh()
  }

  return (
    <div className="rounded-2xl bg-primary p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-3xl font-semibold text-white">Your subjects</h3>
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30 transition-colors"
        >
          <Plus size={13} /> Add subject
        </button>
      </div>

      {adding && (
        <div className="mb-4 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd()
              if (e.key === "Escape") setAdding(false)
            }}
            placeholder="Subject name..."
            className="flex-1 rounded-xl bg-white/20 px-3 py-2 text-sm text-white placeholder:text-white/60 outline-none border border-white/30 focus:border-white/60"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !newName.trim()}
            className="rounded-xl bg-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/40 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "Add"}
          </button>
          <button
            onClick={() => { setAdding(false); setNewName("") }}
            className="text-white/60 hover:text-white text-sm px-2"
          >
            Cancel
          </button>
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="text-white/70 text-sm py-6 text-center">
          No subjects yet. Add one above or get your exams graded by your teacher.
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} {...subject} />
          ))}
        </div>
      )}
    </div>
  )
}
