import { createClient } from "@/lib/supabase/server"
import { Plus, User } from "lucide-react"
import Link from "next/link"
import { DeleteStudentButton } from "./delete-button"
import { GlassCard } from "@/components/ui/glass-card"
import { StudentFilters } from "./student-filters"
import { BulkImportDialog } from "./bulk-import-dialog"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; class?: string; section?: string }>
}) {
  const { search, class: classFilter, section } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch unique classes for the filter
  const { data: classData } = await supabase
    .from("students")
    .select("class")
    .order("class", { ascending: true })

  const classes = Array.from(new Set(classData?.map(c => c.class) || [])).filter(Boolean)

  // Fetch students - Admins (teachers) can see all students
  let query = supabase
    .from("students")
    .select("*")
    .order("class", { ascending: true })
    .order("roll_number", { ascending: true })

  if (search) {
    query = query.ilike("name", `%${search}%`)
  }
  if (classFilter && classFilter !== "all") {
    query = query.eq("class", classFilter)
  }
  if (section) {
    query = query.ilike("section", `%${section}%`)
  }

  const { data: students } = await query

  return (
    <div className="space-y-8 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-wide mb-1 drop-shadow-lg">
            Students
          </h1>
          <p className="text-sm font-mono text-muted-foreground">Manage student profiles and enrollment.</p>
        </div>
        <div className="flex items-center gap-3">
          <BulkImportDialog />
          <Link href="/dashboard/students/add">
            <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Student
            </button>
          </Link>
        </div>
      </div>

      <StudentFilters classes={classes} />

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-display font-bold text-foreground">All Students</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">A DIRECTORY OF ALL STUDENTS IN THE SYSTEM</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-slate-100/50 dark:bg-white/5 text-xs uppercase font-bold text-muted-foreground">
              <tr>
                <th className="px-6 py-4 w-[50px]"></th>
                <th className="px-6 py-4">Roll No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students && students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                        <User className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-foreground text-xs">{student.roll_number}</td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {student.name}
                      {student.section && (
                        <span className="ml-2 text-[10px] text-slate-500 font-normal uppercase">Sec {student.section}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">{student.email || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 border border-blue-500/20">
                        Class {student.class}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.user_id ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Registered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-500 border border-slate-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DeleteStudentButton id={student.id} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-muted-foreground font-mono">
                    No students found. Add students or try a different filter.
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
