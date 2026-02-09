import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AiGuideView } from "@/components/ai-guide/ai-guide-view"
import { Separator } from "@/components/ui/separator"
import { Brain } from "lucide-react"

export default async function AiGuidePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/sign-in')
    }

    const student = await prisma.student.findUnique({
        where: { user_id: user.id }
    })

    if (!student) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-destructive">Profile not found</h1>
                <p>Please contact your administrator to link your account.</p>
            </div>
        )
    }

    const sources = await prisma.studentSource.findMany({
        where: { student_id: student.id },
        orderBy: { created_at: 'desc' }
    })

    // Serialize dates for Client Component if needed (Next.js server-client boundary serialization)
    // Prisma dates are objects, usually passing them works in recent Next versions, but safer to be explicit or rely on auto-serialization.

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-display font-bold text-foreground flex items-center gap-3">
                        <Brain className="text-indigo-500 h-10 w-10" />
                        AI Study Guide
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Synthesize your notes into personalized study aids.
                    </p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider">
                    Beta
                </span>
            </div>

            <Separator className="bg-border/50" />

            <AiGuideView initialSources={sources} studentId={student.id} />
        </div>
    )
}
