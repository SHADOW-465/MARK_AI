"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Slider } from "@/components/ui/slider"
import { TrendingUp, RefreshCcw } from "lucide-react"

export function PredictiveGradeSandbox({
    initialStats
}: {
    initialStats: { concept: number, calculation: number, keyword: number, currentGrade: number, maxScore: number }
}) {
    // We simulate improvement. 0% means "I make the same errors". 100% means "I make 0 errors".
    const [improvement, setImprovement] = useState({
        concept: 0,
        calculation: 0,
        keyword: 0
    })

    const calculateProjectedScore = () => {
        const savedConcept = initialStats.concept * (improvement.concept / 100)
        const savedCalc = initialStats.calculation * (improvement.calculation / 100)
        const savedKeyword = initialStats.keyword * (improvement.keyword / 100)

        return Math.min(initialStats.maxScore, Math.round(initialStats.currentGrade + savedConcept + savedCalc + savedKeyword))
    }

    const projectedScore = calculateProjectedScore()
    const gain = projectedScore - initialStats.currentGrade

    return (
        <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp className="text-neon-green" />
                    Predictive Grade Sandbox
                </h3>
                <button
                    onClick={() => setImprovement({ concept: 0, calculation: 0, keyword: 0 })}
                    className="text-xs text-muted-foreground hover:text-white flex items-center gap-1"
                >
                    <RefreshCcw size={12} /> Reset
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Sliders */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="font-bold text-red-400">Master Concepts</span>
                            <span className="text-muted-foreground">Fixing {improvement.concept}% of errors</span>
                        </div>
                        <Slider
                            value={[improvement.concept]}
                            onValueChange={(v) => setImprovement(prev => ({ ...prev, concept: v[0] }))}
                            max={100}
                            step={10}
                            className="[&>.relative>.absolute]:bg-red-500"
                        />
                        <p className="text-xs text-muted-foreground">
                            Potential Gain: +{initialStats.concept} marks
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="font-bold text-amber-400">Eliminate Calc Errors</span>
                            <span className="text-muted-foreground">Fixing {improvement.calculation}% of errors</span>
                        </div>
                        <Slider
                            value={[improvement.calculation]}
                            onValueChange={(v) => setImprovement(prev => ({ ...prev, calculation: v[0] }))}
                            max={100}
                            step={10}
                            className="[&>.relative>.absolute]:bg-amber-500"
                        />
                         <p className="text-xs text-muted-foreground">
                            Potential Gain: +{initialStats.calculation} marks
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="font-bold text-blue-400">Use Correct Keywords</span>
                            <span className="text-muted-foreground">Fixing {improvement.keyword}% of errors</span>
                        </div>
                        <Slider
                            value={[improvement.keyword]}
                            onValueChange={(v) => setImprovement(prev => ({ ...prev, keyword: v[0] }))}
                            max={100}
                            step={10}
                            className="[&>.relative>.absolute]:bg-blue-500"
                        />
                         <p className="text-xs text-muted-foreground">
                            Potential Gain: +{initialStats.keyword} marks
                        </p>
                    </div>
                </div>

                {/* Result */}
                <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-sm text-muted-foreground mb-2">Projected Score</div>
                    <div className="text-5xl font-display font-bold text-foreground mb-2">
                        {projectedScore}
                        <span className="text-xl text-muted-foreground font-normal"> / {initialStats.maxScore}</span>
                    </div>
                    {gain > 0 && (
                        <div className="px-3 py-1 rounded-full bg-neon-green/20 text-neon-green text-sm font-bold animate-pulse">
                            +{gain} Marks
                        </div>
                    )}
                    <p className="text-xs text-center text-muted-foreground mt-4 max-w-[200px]">
                        Adjust the sliders to see how fixing specific weaknesses impacts your final grade.
                    </p>
                </div>
            </div>
        </GlassCard>
    )
}
