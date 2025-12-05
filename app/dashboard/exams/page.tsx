import { createClient } from "@/lib/supabase/server"
import { Plus, Search, MoreHorizontal, FileText } from "lucide-react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function ExamsPage() {
  const supabase = await createClient()

  // Fetch exams
  const { data: exams } = await supabase.from("exams").select("*").order("created_at", { ascending: false })

  return (
    <div className="space-y-8 pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-wide mb-1 drop-shadow-lg">
            Exams
          </h1>
          <p className="text-sm font-mono text-cyan-100/70">Manage your exams, rubrics, and grading.</p>
        </div>
        <Link href="/dashboard/exams/create">
          <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Exam
          </button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search exams..."
            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-200 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-slate-500"
          />
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xl font-display font-bold text-white">All Exams</h3>
          <p className="text-xs text-slate-400 font-mono mt-1">A LIST OF ALL EXAMS CREATED BY YOU</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase font-bold text-slate-400">
              <tr>
                <th className="px-6 py-4">Exam Name</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total Marks</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {exams && exams.length > 0 ? (
                exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">
                      <Link
                        href={`/dashboard/exams/${exam.id}`}
                        className="flex items-center gap-2 group-hover:text-cyan-400 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 transition-colors">
                          <FileText className="h-4 w-4 text-slate-400 group-hover:text-cyan-300" />
                        </div>
                        {exam.exam_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{exam.subject}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-300 border border-purple-500/20">
                        {exam.class}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{new Date(exam.exam_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono">{exam.total_marks}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 p-0 text-slate-400 hover:text-white transition-colors">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/10 text-slate-200">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Link href={`/dashboard/exams/${exam.id}`} className="w-full">
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Link href={`/dashboard/exams/${exam.id}/edit`} className="w-full">
                              Edit Exam
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-slate-500 font-mono">
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
