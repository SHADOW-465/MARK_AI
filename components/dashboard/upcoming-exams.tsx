import { Calendar, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

export interface UpcomingExamsProps {
    exams: {
        id: string
        exam_name: string
        exam_date: string
        class: string
    }[]
}

export function UpcomingExams({ exams }: UpcomingExamsProps) {
    if (!exams || exams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                <Calendar className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No upcoming exams scheduled</p>
            </div>
        )
    }

    const calculateDaysLeft = (dateString: string) => {
        const examDate = new Date(dateString)
        const today = new Date()
        const diffTime = examDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    return (
        <div className="space-y-4">
            {exams.map((exam) => {
                const daysLeft = calculateDaysLeft(exam.exam_date)
                return (
                    <div key={exam.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/20 text-purple-400 flex flex-col items-center justify-center border border-purple-500/20">
                                <span className="text-xs font-bold uppercase">{new Date(exam.exam_date).toLocaleString('default', { month: 'short' })}</span>
                                <span className="text-lg font-bold leading-none">{new Date(exam.exam_date).getDate()}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors">{exam.exam_name}</h4>
                                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        10:00 AM
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                    <span>{exam.class}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={`block text-xs font-mono px-2 py-1 rounded border ${daysLeft <= 3 ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-purple-400 bg-purple-500/10 border-purple-500/20'}`}>
                                {daysLeft > 0 ? `${daysLeft} days left` : 'Today'}
                            </span>
                        </div>
                    </div>
                )
            })}
            <Link href="/dashboard/exams" className="block w-full py-2 text-center text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-white/10">
                View Full Schedule <ArrowRight className="inline h-3 w-3 ml-1" />
            </Link>
        </div>
    )
}
