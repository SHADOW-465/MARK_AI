import { createClient } from "@/lib/supabase/server"
import { Plus, User, Search, Filter } from "lucide-react"
import Link from "next/link"
import { DeleteStudentButton } from "./delete-button"
import { GlassCard } from "@/components/ui/glass-card"
import { StudentFilters } from "./student-filters"
import { BulkImportDialog } from "./bulk-import-dialog"
import { Button } from "@/components/ui/button"

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
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight mb-2">
            Students
          </h1>
          <p className="text-muted-foreground font-medium">Manage student profiles and enrollment.</p>
        </div>
        <div className="flex items-center gap-3">
          <BulkImportDialog />
          <Link href="/dashboard/students/add">
            <Button variant="gradient" className="rounded-full shadow-lg shadow-indigo-500/20 pl-4 pr-6">
              <Plus className="h-5 w-5 mr-2" />
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      <StudentFilters classes={classes} />

      <GlassCard variant="liquid" className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl">
          <h3 className="text-xl font-display font-bold text-foreground">All Students</h3>
          <p className="text-sm text-muted-foreground mt-1">A directory of all enrolled students.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-xs uppercase font-bold text-muted-foreground">
              <tr>
                <th className="px-6 py-4 w-[50px]"></th>
                <th className="px-6 py-4 font-bold tracking-wider">Roll No</th>
                <th className="px-6 py-4 font-bold tracking-wider">Name</th>
                <th className="px-6 py-4 font-bold tracking-wider">Email</th>
                <th className="px-6 py-4 font-bold tracking-wider">Class</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {students && students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm">
                        <User className="h-4 w-4" />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-foreground font-medium">{student.roll_number}</td>
                    <td className="px-6 py-4 font-bold text-foreground">
                      {student.name}
                      {student.section && (
                        <span className="ml-2 text-[10px] text-muted-foreground font-normal uppercase px-1.5 py-0.5 rounded border border-border">
                          Sec {student.section}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{student.email || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                        Class {student.class}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.user_id ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Registered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-500 dark:text-slate-400">
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
                  <td colSpan={7} className="h-32 text-center text-muted-foreground">
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
