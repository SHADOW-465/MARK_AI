"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Info } from "lucide-react"

type Flashcard = {
    id: string
    question: string
    answer: string
    explanation: string
    level: number
    subject: string
}

export function FlashcardDeck({ initialCards, studentId }: { initialCards: any[], studentId: string }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [cards, setCards] = useState<Flashcard[]>(initialCards)

    const currentCard = cards[currentIndex]

    const handleLevelUp = async (success: boolean) => {
        if (!currentCard) return

        const newLevel = success ? Math.min(currentCard.level + 1, 5) : Math.max(currentCard.level - 1, 1)

        // Spaced Repetition Logic (Days until next review)
        const intervals = [0, 1, 3, 7, 14, 30]
        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + intervals[newLevel])

        try {
            await fetch(`/api/student/flashcards/${currentCard.id}`, {
                method: "PATCH",
                body: JSON.stringify({ level: newLevel, nextReview: nextReview.toISOString() }),
                headers: { "Content-Type": "application/json" }
            })

            // Award XP on success
            if (success) {
                await fetch('/api/student/gamify', {
                    method: 'POST',
                    body: JSON.stringify({ amount: 10, activity: 'flashcard_mastery', description: `Mastered card: ${currentCard.question.substring(0, 20)}...` }),
                    headers: { 'Content-Type': 'application/json' }
                })
            }

            // Move to next card
            setIsFlipped(false)
            setTimeout(() => {
                if (currentIndex < cards.length - 1) {
                    setCurrentIndex(prev => prev + 1)
                }
            }, 300)

        } catch (error) {
            console.error("SRS Update Error:", error)
        }
    }

    if (!currentCard) {
        return (
            <GlassCard className="h-[400px] flex flex-col items-center justify-center text-center p-8 border-dashed border-white/10">
                <Brain size={48} className="text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-bold mb-2">Workspace Clear</h3>
                <p className="text-sm text-muted-foreground">All cards reviewed! Upload more notes to generate new cards.</p>
            </GlassCard>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span className="bg-white/5 px-2 py-1 rounded">Card {currentIndex + 1} / {cards.length}</span>
                <span className="uppercase tracking-widest">{currentCard.subject}</span>
                <span className="bg-neon-cyan/10 text-neon-cyan px-2 py-1 rounded border border-neon-cyan/20">Level {currentCard.level}</span>
            </div>

            {/* FLIP CARD */}
            <div className="perspective-1000 h-[400px] w-full" onClick={() => setIsFlipped(!isFlipped)}>
                <motion.div
                    className="relative w-full h-full text-center transition-all duration-500 [transform-style:preserve-3d] cursor-pointer"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                >
                    {/* Front */}
                    <GlassCard className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-12 border-neon-cyan/20">
                        <h2 className="text-xl md:text-2xl font-bold font-display leading-tight">
                            {currentCard.question}
                        </h2>
                        <div className="absolute bottom-6 flex items-center gap-2 text-xs text-muted-foreground">
                            <RotateCcw size={14} />
                            Click to flip
                        </div>
                    </GlassCard>

                    {/* Back */}
                    <GlassCard className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] flex flex-col items-center justify-center p-12 border-neon-purple/20 bg-neon-purple/[0.02]">
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold font-display text-neon-purple leading-tight">
                                {currentCard.answer}
                            </h2>
                            <p className="text-sm text-muted-foreground italic leading-relaxed">
                                {currentCard.explanation}
                            </p>
                        </div>
                        <div className="absolute bottom-6 flex items-center gap-2 text-xs text-muted-foreground">
                            <Info size={14} />
                            Was this answer correct?
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            {/* CONTROLS */}
            <div className="flex items-center justify-center gap-12">
                <button
                    onClick={(e) => { e.stopPropagation(); handleLevelUp(false); }}
                    className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all group"
                >
                    <X size={24} className="group-hover:scale-110 transition-transform" />
                </button>

                <div className="flex items-center gap-4">
                    <button
                        disabled={currentIndex === 0}
                        onClick={() => { setCurrentIndex(prev => prev - 1); setIsFlipped(false); }}
                        className="p-2 hover:bg-white/5 rounded-full disabled:opacity-30"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        disabled={currentIndex === cards.length - 1}
                        onClick={() => { setCurrentIndex(prev => prev + 1); setIsFlipped(false); }}
                        className="p-2 hover:bg-white/5 rounded-full disabled:opacity-30"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); handleLevelUp(true); }}
                    className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20 transition-all group"
                >
                    <Check size={24} className="group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>
    )
}

import { Brain } from "lucide-react"
