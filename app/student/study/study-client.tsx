"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, FileText, Send, Sparkles, Target, Brain, Play } from "lucide-react"
import { uploadStudyMaterial } from "@/app/actions/study"

export function StudyClient({
    initialMaterials,
    initialExams,
    preSelectedExamId
}: {
    initialMaterials: any[],
    initialExams: any[],
    preSelectedExamId?: string
}) {
    const [materials, setMaterials] = useState(initialMaterials)
    const [exams, setExams] = useState(initialExams)
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
    const [selectedExamIds, setSelectedExamIds] = useState<string[]>(preSelectedExamId ? [preSelectedExamId] : [])
    const [isUploading, setIsUploading] = useState(false)
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: "Welcome to your Deep Work Studio. Toggle your notes or exams on the left to add them to your notebook, then let's start synthesizing." }
    ])
    const [input, setInput] = useState("")
    const [isChatting, setIsChatting] = useState(false)

    const toggleFile = (id: string) => {
        setSelectedFileIds(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        )
    }

    const toggleExam = (id: string) => {
        setSelectedExamIds(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        )
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        setIsUploading(true)

        const formData = new FormData()
        formData.append("file", e.target.files[0])

        const res = await uploadStudyMaterial(formData)

        if (res?.error) {
            alert(res.error)
        } else {
            // Refresh (or optimistically add)
            window.location.reload()
        }
        setIsUploading(false)
    }

    const handleSynthesis = async (type: 'faq' | 'glossary' | 'guide') => {
        if (selectedFileIds.length === 0 && selectedExamIds.length === 0) {
            alert("Please select at least one source for synthesis.")
            return
        }

        setIsChatting(true)
        const promptMap = {
            faq: "Generate 5 high-impact FAQs with answers based on these sources.",
            glossary: "Create a glossary of the 10 most important terms found across these materials.",
            guide: "Synthesize these sources into a cohesive 1-page study guide."
        }

        const userMsg = promptMap[type as keyof typeof promptMap]
        setMessages(prev => [...prev, { role: 'user', text: userMsg }])

        try {
            const res = await fetch("/api/student/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg,
                    fileIds: selectedFileIds,
                    examIds: selectedExamIds,
                    synthesisType: type
                })
            })
            const data = await res.json()
            if (data.reply) {
                setMessages(prev => [...prev, { role: 'ai', text: data.reply }])
            }
        } catch (e) {
            console.error(e)
            setMessages(prev => [...prev, { role: 'ai', text: "Failed to generate synthesis. Please check your connection." }])
        } finally {
            setIsChatting(false)
        }
    }

    const handleAudioOverview = () => {
        alert("Audio Overview: Processing your sources... Your AI-generated study podcast will be ready in a few minutes! (Simulation)")
    }

    const handleSend = async () => {
        if (!input.trim()) return
        const userMsg = input
        setMessages(prev => [...prev, { role: 'user', text: userMsg }])
        setInput("")
        setIsChatting(true)

        try {
            const res = await fetch("/api/student/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMsg,
                    fileIds: selectedFileIds,
                    examIds: selectedExamIds
                })
            })
            const data = await res.json()
            if (data.reply) {
                setMessages(prev => [...prev, { role: 'ai', text: data.reply }])
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error." }])
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: "Network error." }])
        } finally {
            setIsChatting(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold">Deep Work Studio</h1>
                    <p className="text-muted-foreground text-sm">Synthesize multiple sources into one master concept.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-neon-purple/20 text-neon-purple hover:bg-neon-purple/5"
                        onClick={() => handleSynthesis('faq')}
                    >
                        <Brain size={14} />
                        Gen FAQ
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/5"
                        onClick={() => handleSynthesis('glossary')}
                    >
                        <Sparkles size={14} />
                        Glossary
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 bg-white/5 hover:bg-white/10"
                        onClick={handleAudioOverview}
                    >
                        <Play size={14} />
                        Audio Overview
                    </Button>
                    <div className="w-px h-8 bg-white/10 mx-2" />
                    <Button variant="outline" className="gap-2 border-dashed border-white/20 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 relative">
                        <input
                            type="file"
                            accept=".pdf,.txt,.md"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleUpload}
                            disabled={isUploading}
                        />
                        <Upload size={16} />
                        {isUploading ? "Uploading..." : "Add Source"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Knowledge Base Sidebar */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <GlassCard className="flex-1 p-4 flex flex-col overflow-hidden">
                        <h3 className="font-bold mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText size={16} className="text-neon-cyan" />
                                Notebook Sources
                            </div>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono">
                                {selectedFileIds.length + selectedExamIds.length} Active
                            </span>
                        </h3>
                        <div className="space-y-6 overflow-y-auto flex-1 pr-1 scrollbar-hide">
                            <div>
                                <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 px-1">Study Materials</h4>
                                <div className="space-y-2">
                                    {materials.length > 0 ? materials.map((f: any) => (
                                        <div
                                            key={f.id}
                                            onClick={() => toggleFile(f.id)}
                                            className={`group p-3 rounded-xl text-xs cursor-pointer transition-all border ${selectedFileIds.includes(f.id)
                                                ? 'bg-neon-cyan/10 border-neon-cyan/30 text-foreground ring-1 ring-neon-cyan/50'
                                                : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className={selectedFileIds.includes(f.id) ? "text-neon-cyan" : "opacity-50"} />
                                                <span className="truncate flex-1">{f.title}</span>
                                                {selectedFileIds.includes(f.id) && <div className="h-1.5 w-1.5 rounded-full bg-neon-cyan" />}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-[10px] text-muted-foreground text-center py-2 italic opacity-50">No notes yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2">
                                <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 px-1">Graded Exams</h4>
                                <div className="space-y-2">
                                    {exams.length > 0 ? exams.map((s: any) => (
                                        <div
                                            key={s.id}
                                            onClick={() => toggleExam(s.id)}
                                            className={`group p-3 rounded-xl text-xs cursor-pointer transition-all border ${selectedExamIds.includes(s.id)
                                                ? 'bg-neon-purple/10 border-neon-purple/30 text-foreground ring-1 ring-neon-purple/50'
                                                : 'bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Target size={14} className={selectedExamIds.includes(s.id) ? "text-neon-purple" : "opacity-50"} />
                                                <span className="truncate flex-1 font-bold italic">{s.exams?.exam_name}</span>
                                            </div>
                                            <div className="text-[10px] opacity-60 ml-5 flex justify-between items-center">
                                                <span>Score: {s.total_score} / {s.exams?.total_marks}</span>
                                                {selectedExamIds.includes(s.id) && <div className="h-1.5 w-1.5 rounded-full bg-neon-purple" />}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-[10px] text-muted-foreground text-center py-2 italic opacity-50">No graded exams yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Chat Interface */}
                <div className="lg:col-span-3 flex flex-col">
                    <GlassCard className="flex-1 p-0 flex flex-col overflow-hidden">
                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user'
                                        ? 'bg-neon-purple/20 text-foreground rounded-br-none'
                                        : 'bg-white/5 text-muted-foreground rounded-bl-none'
                                        }`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                                    </div>
                                </div>
                            ))}
                            {isChatting && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 p-4 rounded-2xl rounded-bl-none">
                                        <span className="animate-pulse">...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                            <div className="flex gap-2">
                                <Input
                                    placeholder={selectedExamIds.length + selectedFileIds.length > 0
                                        ? `Chatting with ${selectedExamIds.length + selectedFileIds.length} sources...`
                                        : "Select sources to start deep work..."}
                                    className="bg-background/50 border-white/10"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <Button size="icon" className="bg-neon-cyan hover:bg-neon-cyan/80 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]" onClick={handleSend} disabled={isChatting}>
                                    <Send size={18} />
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}
