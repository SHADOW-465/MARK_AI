"use client"

import { useState } from "react"
import { UploadZone } from "./upload-zone"
import { GuideGenerator } from "./guide-generator"
import { GlassCard } from "@/components/ui/glass-card"
import { FileText, Check, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Source {
    id: string
    title: string | null
    type: string
    created_at: Date
}

interface AiGuideViewProps {
    initialSources: Source[]
    studentId: string
}

export function AiGuideView({ initialSources, studentId }: AiGuideViewProps) {
    const [sources, setSources] = useState<Source[]>(initialSources)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)

    const refreshSources = async () => {
        setIsRefreshing(true)
        // In a real app, use Server Actions or SWR. Here, simple hack to waiting or reload window.
        // Or fetch an API that returns sources.
        // For MVP, simply reloading page or assuming successful upload adds to list (if we returned it).
        // Let's just reload the page for now to get fresh server data.
        window.location.reload()
    }

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Sources & Upload */}
            <div className="lg:col-span-1 space-y-6">

                <UploadZone studentId={studentId} onUploadComplete={refreshSources} />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Your Sources</h2>
                        <Button variant="ghost" size="sm" onClick={refreshSources} disabled={isRefreshing}>
                            <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {sources.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                No sources yet. Upload one above!
                            </div>
                        ) : (
                            sources.map(source => (
                                <GlassCard
                                    key={source.id}
                                    className={cn(
                                        "p-3 flex items-center justify-between cursor-pointer border transition-all",
                                        selectedIds.includes(source.id)
                                            ? "border-primary bg-primary/5"
                                            : "border-transparent hover:border-border"
                                    )}
                                    onClick={() => toggleSelection(source.id)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                            selectedIds.includes(source.id) ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                                        )}>
                                            {selectedIds.includes(source.id) ? <Check size={20} /> : <FileText size={20} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm truncate">{source.title || "Untitled"}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{source.type}</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: AI Generator */}
            <div className="lg:col-span-2 space-y-6">
                <GuideGenerator studentId={studentId} selectedSourceIds={selectedIds} />
            </div>
        </div>
    )
}
