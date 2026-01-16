import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { FlashcardDeck } from "@/components/student/flashcard-deck"
import { Brain, Zap, Clock, History, Plus } from "lucide-react"
import { CustomCardDialog } from "@/components/student/custom-card-dialog"

export default async function FlashcardStudio() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Unauthorized</div>

    const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single()

    if (!student) return <div>Student not found</div>

    // Fetch Cards due for review
    const { data: cards } = await supabase
        .from("flashcards")
        .select("*")
        .eq("student_id", student.id)
        .order("next_review_at", { ascending: true })

    const dueCount = cards?.filter(c => new Date(c.next_review_at) <= new Date()).length || 0

    return (
        <div className="space-y-8 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Flashcard Studio</h1>
                    <p className="text-muted-foreground mt-1 font-medium">AI-generated active recall tailored to your gaps.</p>
                </div>
                <CustomCardDialog studentId={student.id} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats Sidebar */}
                <div className="space-y-6">
                    <GlassCard variant="neu" className="p-6">
                        <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-foreground">
                            <Brain size={16} className="text-primary" />
                            Studio Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium">Cards in Vault</span>
                                <span className="text-sm font-bold font-mono text-foreground">{cards?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium">Ready for Review</span>
                                <span className="text-sm font-bold font-mono text-primary">{dueCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium">Mastered (L5)</span>
                                <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    {cards?.filter(c => c.level === 5).length || 0}
                                </span>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border transition-all group shadow-sm">
                            <div className="flex items-center gap-3">
                                <Zap size={20} className="text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
                                <div className="text-left">
                                    <p className="text-sm font-bold text-foreground">Power Sprint</p>
                                    <p className="text-[10px] text-muted-foreground font-medium">Timed mode for rapid recall</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">NEW</span>
                        </button>
                    </div>
                </div>

                {/* Main Deck View */}
                <div className="lg:col-span-3 space-y-6">
                    <FlashcardDeck initialCards={cards || []} studentId={student.id} />
                </div>
            </div>
        </div>
    )
}
