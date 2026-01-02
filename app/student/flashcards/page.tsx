import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { FlashcardDeck } from "@/components/student/flashcard-deck"
import { Brain, Zap, Clock, History, Plus } from "lucide-react"

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
                    <p className="text-muted-foreground mt-1">AI-generated active recall tailored to your gaps.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-black rounded-xl font-bold text-sm hover:bg-neon-cyan/90 transition-all">
                    <Plus size={18} />
                    Custom Card
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats Sidebar */}
                <div className="space-y-6">
                    <GlassCard className="p-6">
                        <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                            <Brain size={16} className="text-neon-cyan" />
                            Studio Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Cards in Vault</span>
                                <span className="text-sm font-bold font-mono">{cards?.length || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Ready for Review</span>
                                <span className="text-sm font-bold font-mono text-neon-cyan">{dueCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Mastered (L5)</span>
                                <span className="text-sm font-bold font-mono text-emerald-400">
                                    {cards?.filter(c => c.level === 5).length || 0}
                                </span>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                            <div className="flex items-center gap-3">
                                <Zap size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                <div className="text-left">
                                    <p className="text-sm font-bold">Power Sprint</p>
                                    <p className="text-[10px] text-muted-foreground">Timed mode for rapid recall</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">NEW</span>
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
