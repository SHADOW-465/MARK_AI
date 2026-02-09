"use client"

import { useState } from "react"
import { Sparkles, BookOpen, HelpCircle, List, FileText, Share2, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

interface GuideGeneratorProps {
    studentId: string
    selectedSourceIds: string[]
}

type GenType = 'summary' | 'quiz' | 'faq' | 'study_plan'

export function GuideGenerator({ studentId, selectedSourceIds }: GuideGeneratorProps) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [result, setResult] = useState<string | null>(null)
    const [selectedType, setSelectedType] = useState<GenType>('summary')

    const handleGenerate = async () => {
        if (selectedSourceIds.length === 0) return

        setIsGenerating(true)
        setResult(null)

        try {
            const res = await fetch('/api/ai-guide/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: selectedType,
                    sourceIds: selectedSourceIds,
                    studentId
                })
            })

            if (!res.ok) throw new Error('Generation failed')

            const data = await res.json()
            setResult(data.result)
        } catch (error) {
            console.error(error)
            setResult("Error generating content. Please try again.")
        } finally {
            setIsGenerating(false)
        }
    }

    const options = [
        { id: 'summary', label: 'Summary', icon: FileText, desc: 'Get a concise overview' },
        { id: 'quiz', label: 'Quiz Me', icon: HelpCircle, desc: 'Test your knowledge' },
        { id: 'faq', label: 'Q&A', icon: HelpCircle, desc: 'Common questions' },
        { id: 'study_plan', label: 'Study Plan', icon: List, desc: 'Structure your learning' },
    ] as const

    return (
        <div className="space-y-6">
            <GlassCard variant="neu" className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="text-purple-500" />
                    Create AI Guide
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            onClick={() => setSelectedType(opt.id as GenType)}
                            className={cn(
                                "p-4 rounded-xl border transition-all flex flex-col items-center text-center gap-2",
                                selectedType === opt.id
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-secondary/50 border-transparent hover:bg-secondary hover:border-border"
                            )}
                        >
                            <opt.icon size={24} className={selectedType === opt.id ? "text-primary" : "text-muted-foreground"} />
                            <div>
                                <div className="font-semibold text-sm">{opt.label}</div>
                                <div className="text-xs text-muted-foreground">{opt.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                <Button
                    variant="liquid"
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedSourceIds.length === 0}
                >
                    {isGenerating ? "Generating..." : "Generate Guide"}
                    {!isGenerating && <Play size={16} className="ml-2" />}
                </Button>

                {selectedSourceIds.length === 0 && (
                    <p className="text-center text-sm text-yellow-600 mt-2">
                        Select at least one source above to generate.
                    </p>
                )}
            </GlassCard>

            {result && (
                <GlassCard variant="glass" className="p-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="prose dark:prose-invert max-w-none">
                        <h3 className="text-xl font-bold mb-4 capitalize">{selectedType.replace('_', ' ')}</h3>
                        <div className="whitespace-pre-wrap">{result}</div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <Button variant="outline" size="sm">Save to Vault</Button>
                        <Button variant="ghost" size="sm"><Share2 size={16} /></Button>
                    </div>
                </GlassCard>
            )}
        </div>
    )
}
