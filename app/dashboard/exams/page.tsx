import { createClient } from "@/lib/supabase/server"
import { Plus, Search, MoreHorizontal, FileText } from "lucide-react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { ExportDialog } from "./export-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const dynamic = 'force-dynamic'

export default async function ExamsPage() {
  const supabase = await createClient()

  // Fetch exams
  const { data: exams } = await supabase.from("exams").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-8 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight mb-2">
            Exams
          </h1>
          <p className="text-muted-foreground font-medium">Manage your assessments and rubrics.</p>
        </div>
        <Link href="/dashboard/exams/create">
          <Button variant="gradient" className="rounded-full pl-4 pr-6 shadow-lg shadow-indigo-500/20">
            <Plus className="h-5 w-5 mr-2" />
            Create Exam
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="search"
            placeholder="Search exams..."
            className="w-full bg-white/50 dark:bg-slate-900/50 border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-900 rounded-full py-3 pl-11 pr-4 text-foreground text-sm focus:outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <GlassCard variant="liquid" className="p-0 overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl">
          <h3 className="text-xl font-display font-bold text-foreground">All Exams</h3>
          <p className="text-sm text-muted-foreground mt-1">A comprehensive list of all assessments.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-xs uppercase font-bold text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Exam Name</th>
                <th className="px-6 py-4 font-bold tracking-wider">Subject</th>
                <th className="px-6 py-4 font-bold tracking-wider">Class</th>
                <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                <th className="px-6 py-4 font-bold tracking-wider">Marks</th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {exams && exams.length > 0 ? (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <Link
                        href={`/dashboard/exams/${exam.id}`}
                        className="flex items-center gap-3 group-hover:text-primary transition-colors"
                      >
                        <div className="p-2.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm">
                          <FileText className="h-4 w-4" />
                        </div>
                        <span className="font-semibold">{exam.exam_name}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{exam.subject}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-bold text-purple-700 dark:text-purple-300">
                        Class {exam.class}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs font-medium">{new Date(exam.exam_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-bold text-foreground">{exam.total_marks}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary flex items-center justify-center">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover/90 backdrop-blur-xl shadow-xl">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer rounded-lg">
                            <Link href={`/dashboard/exams/${exam.id}`} className="w-full">
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer rounded-lg">
                            <Link href={`/dashboard/exams/${exam.id}/edit`} className="w-full">
                              Edit Exam
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border/50" />
                          <ExportDialog exam={exam} />
                          <DropdownMenuSeparator className="bg-border/50" />
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-muted-foreground">
                    No exams found. Create your first exam to get started.
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
