import { createClient } from "@/lib/supabase/server"
import { Plus, Search, User } from "lucide-react"
import Link from "next/link"
import { DeleteStudentButton } from "./delete-button"
import { GlassCard } from "@/components/ui/glass-card"

export default async function StudentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch students
  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("teacher_id", user?.id) // Filter by teacher_id
    .order("class", { ascending: true })
    .order("roll_number", { ascending: true })

  return (
    <div className="space-y-8 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-wide mb-1 drop-shadow-lg">
            Students
          </h1>
          <p className="text-sm font-mono text-cyan-100/70">Manage student profiles and enrollment.</p>
        </div>
        <Link href="/dashboard/students/add">
          <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Student
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search students..."
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-500"
          />
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-display font-bold text-white">All Students</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">A DIRECTORY OF ALL STUDENTS IN YOUR CLASSES</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase font-bold text-slate-400">
              <tr>
                <th className="px-6 py-4 w-[50px]"></th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Section</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students && students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <User className="h-4 w-4 text-indigo-300" />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-white">{student.roll_number}</td>
                    <td className="px-6 py-4 font-bold text-slate-200">{student.name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-300 border border-blue-500/20">
                        Class {student.class}
                      </span>
                    </td>
                    <td className="px-6 py-4">{student.section || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <DeleteStudentButton id={student.id} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-slate-500 font-mono">
                    No students found. Add students to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
