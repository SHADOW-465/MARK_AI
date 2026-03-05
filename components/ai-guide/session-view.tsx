"use client"

import { useState, useRef, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { ContextPanel } from "@/components/ai-guide/context-panel"
import { UploadZone } from "@/components/ai-guide/upload-zone"
import {
    Send, Sparkles, Brain, FileText, Dumbbell, Type,
    ClipboardList, Search, Loader2, PanelRight, X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Source {
    id: string
    title: string
    type: string
    ocr_text?: string | null
    created_at: string
}

interface Message {
    role: "user" | "assistant"
    content: string
    timestamp: string
}

interface GeneratedOutput {
    type: string
    content: string
    saved: boolean
    created_at: string
}

interface MasteryCheckpoint {
    topic: string
    confidence: "low" | "medium" | "high"
    demonstrated_at?: string
}

interface Session {
    id: string
    title: string
    session_type: string
    exam_context_id?: string | null
    error_focus?: string | null
    sources_json: string[]
    chat_history: Message[]
    generated_outputs: GeneratedOutput[]
    mastery_checkpoints: MasteryCheckpoint[]
}

interface ExamContext {
    examName: string
    subject: string
    score: number
    totalMarks: number
    errorStats: { concept: number; calculation: number; keyword: number }
}

interface SessionViewProps {
    session: Session
    allSources: Source[]
    studentId: string
    examContext?: ExamContext
}

const GEN_MODES = [
    { id: "exam_debrief", label: "Exam Debrief", icon: ClipboardList, color: "text-red-500" },
    { id: "concept_explainer", label: "Concept Explainer", icon: Brain, color: "text-purple-500" },
    { id: "drill_practice", label: "Drill Practice", icon: Dumbbell, color: "text-blue-500" },
    { id: "keyword_builder", label: "Keyword Builder", icon: Type, color: "text-amber-500" },
    { id: "summary", label: "Summary", icon: FileText, color: "text-teal-500" },
    { id: "quiz", label: "Quiz Me", icon: Search, color: "text-indigo-500" },
] as const

export function SessionView({
    session,
    allSources,
    studentId,
    examContext,
}: SessionViewProps) {
    const [sources, setSources] = useState(allSources)
    const [selectedIds, setSelectedIds] = useState<string[]>(session.sources_json)
    const [messages, setMessages] = useState<Message[]>(session.chat_history)
    const [outputs, setOutputs] = useState<GeneratedOutput[]>(session.generated_outputs)
    const [checkpoints, setCheckpoints] = useState<MasteryCheckpoint[]>(session.mastery_checkpoints)
    const [input, setInput] = useState("")
    const [streaming, setStreaming] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [genMode, setGenMode] = useState<string>(
        session.session_type === "exam_prep" ? "exam_debrief" : "summary"
    )
    const [showContext, setShowContext] = useState(true)
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, outputs])

    const persist = async (
        msgs: Message[],
        outs: GeneratedOutput[],
        cps: MasteryCheckpoint[]
    ) => {
        await fetch(`/api/ai-guide/sessions/${session.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_history: msgs,
                generated_outputs: outs,
                mastery_checkpoints: cps,
                sources_json: selectedIds,
            }),
        })
    }

    const sendMessage = async () => {
        if (!input.trim() || streaming) return
        const userMsg: Message = { role: "user", content: input.trim(), timestamp: new Date().toISOString() }
        const newMsgs = [...messages, userMsg]
        setMessages(newMsgs)
        setInput("")
        setStreaming(true)

        const placeholder: Message = { role: "assistant", content: "", timestamp: new Date().toISOString() }
        setMessages([...newMsgs, placeholder])

        try {
            const res = await fetch("/api/ai-guide/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
                    sourceIds: selectedIds,
                    studentId,
                    examContextId: session.exam_context_id,
                }),
            })

            const reader = res.body!.getReader()
            const decoder = new TextDecoder()
            let full = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                // Vercel AI SDK streaming format: lines starting with "0:"
                full += chunk
                    .split("\n")
                    .filter((l) => l.startsWith("0:"))
                    .map((l) => { try { return JSON.parse(l.slice(2)) } catch { return "" } })
                    .join("")
                setMessages((prev) => {
                    const u = [...prev]
                    u[u.length - 1] = { ...placeholder, content: full }
                    return u
                })
            }

            const finalMsgs = [...newMsgs, { ...placeholder, content: full }]
            setMessages(finalMsgs)
            await persist(finalMsgs, outputs, checkpoints)
        } catch (err) {
            console.error(err)
            setMessages((prev) => {
                const u = [...prev]
                u[u.length - 1] = { ...placeholder, content: "Error — please try again." }
                return u
            })
        } finally {
            setStreaming(false)
        }
    }

    const generate = async () => {
        if (selectedIds.length === 0 && !session.exam_context_id) return
        setGenerating(true)
        try {
            const res = await fetch("/api/ai-guide/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: genMode,
                    sourceIds: selectedIds,
                    studentId,
                    sessionId: session.id,
                    examContextId: session.exam_context_id,
                }),
            })
            const { result } = await res.json()
            const out: GeneratedOutput = {
                type: genMode,
                content: result,
                saved: false,
                created_at: new Date().toISOString(),
            }
            const newOutputs = [...outputs, out]
            setOutputs(newOutputs)
            await persist(messages, newOutputs, checkpoints)
        } finally {
            setGenerating(false)
        }
    }

    const toggleMastery = async (topic: string) => {
        const updated = checkpoints.map((cp) =>
            cp.topic === topic
                ? { ...cp, confidence: cp.confidence === "high" ? ("low" as const) : ("high" as const) }
                : cp
        )
        setCheckpoints(updated)
        await persist(messages, outputs, updated)
    }

    const toggleSource = (id: string) =>
        setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])

    const canGenerate = selectedIds.length > 0 || !!session.exam_context_id

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-3">
            {/* LEFT: Source picker */}
            <div className="w-52 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1">
                    Sources
                </p>
                {sources.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => toggleSource(s.id)}
                        className={cn(
                            "w-full text-left p-3 rounded-xl border text-xs transition-all",
                            selectedIds.includes(s.id)
                                ? "bg-indigo-50 border-indigo-300 dark:bg-indigo-900/30 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300"
                                : "bg-secondary/50 border-transparent hover:border-border text-foreground"
                        )}
                    >
                        <FileText size={11} className="mb-1 opacity-50" />
                        <p className="font-semibold line-clamp-2">{s.title}</p>
                    </button>
                ))}
                <UploadZone
                    studentId={studentId}
                    onUploadComplete={(newSource: any) => setSources((p) => [newSource, ...p])}
                />
            </div>

            {/* CENTER: Chat + Generate */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mode selector */}
                <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 flex-wrap">
                    {GEN_MODES.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setGenMode(m.id)}
                            className={cn(
                                "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                                genMode === m.id
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "bg-secondary/50 border-transparent hover:bg-secondary text-muted-foreground"
                            )}
                        >
                            <m.icon size={11} className={genMode === m.id ? "text-primary" : m.color} />
                            {m.label}
                        </button>
                    ))}
                    <Button
                        variant="liquid"
                        size="sm"
                        className="flex-shrink-0 gap-1 text-xs h-8"
                        onClick={generate}
                        disabled={generating || !canGenerate}
                    >
                        {generating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                        Generate
                    </Button>
                </div>

                {/* Output + chat area */}
                <GlassCard className="flex-1 overflow-y-auto p-4 space-y-4 mb-3">
                    {messages.length === 0 && outputs.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                            <Sparkles size={36} className="mb-3 opacity-25" />
                            <p className="font-semibold text-sm">
                                {session.session_type === "exam_prep"
                                    ? "Click Exam Debrief → Generate to start."
                                    : "Select sources and generate or chat."}
                            </p>
                        </div>
                    )}

                    {outputs.map((out, i) => (
                        <GlassCard key={i} variant="neu" className="p-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                {out.type.replace(/_/g, " ")}
                            </p>
                            <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                                {out.content}
                            </div>
                        </GlassCard>
                    ))}

                    {messages.map((msg, i) => (
                        <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-secondary text-foreground rounded-bl-sm"
                            )}>
                                {msg.content || <span className="opacity-40 animate-pulse">▌</span>}
                            </div>
                        </div>
                    ))}
                    <div ref={endRef} />
                </GlassCard>

                {/* Input */}
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                        placeholder="Ask about your materials..."
                        className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
                    />
                    <Button
                        onClick={sendMessage}
                        disabled={!input.trim() || streaming}
                        variant="liquid"
                        size="icon"
                        className="h-12 w-12 rounded-xl flex-shrink-0"
                    >
                        {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </Button>
                </div>
            </div>

            {/* RIGHT: Context panel */}
            {showContext && (
                <div className="w-52 flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Context</p>
                        <button onClick={() => setShowContext(false)} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground">
                            <X size={12} />
                        </button>
                    </div>
                    <ContextPanel
                        errorStats={examContext?.errorStats}
                        examContext={examContext}
                        masteryCheckpoints={checkpoints}
                        onToggleMastery={toggleMastery}
                    />
                </div>
            )}
            {!showContext && (
                <button
                    onClick={() => setShowContext(true)}
                    className="flex-shrink-0 self-start mt-10 p-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-muted-foreground"
                    title="Show context panel"
                >
                    <PanelRight size={15} />
                </button>
            )}
        </div>
    )
}
