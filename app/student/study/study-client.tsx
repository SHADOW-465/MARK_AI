"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, FileText, Send, Sparkles } from "lucide-react"
import { uploadStudyMaterial } from "@/app/actions/study"

export function StudyClient({ initialMaterials }: { initialMaterials: any[] }) {
    const [materials, setMaterials] = useState(initialMaterials)
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
        { role: 'ai', text: "Welcome to your Deep Work Studio. Upload your notes or textbooks, and I'll help you master them." }
    ])
    const [input, setInput] = useState("")
    const [isChatting, setIsChatting] = useState(false)

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
                body: JSON.stringify({ message: userMsg, fileId: selectedFileId })
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
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold">Deep Work Studio</h1>
                    <p className="text-muted-foreground">Synthesize your notes and textbooks.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-dashed border-white/20 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 relative">
                        <input
                            type="file"
                            accept=".pdf,.txt,.md"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleUpload}
                            disabled={isUploading}
                        />
                        <Upload size={16} />
                        {isUploading ? "Uploading..." : "Upload Notes"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Knowledge Base Sidebar */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <GlassCard className="flex-1 p-4 flex flex-col">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-neon-cyan" />
                            Sources
                        </h3>
                        <div className="space-y-2 overflow-y-auto flex-1">
                            {materials.length > 0 ? materials.map((f: any, i: number) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedFileId(f.id)}
                                    className={`p-3 rounded-lg text-sm cursor-pointer transition-colors flex items-center gap-2 ${
                                        selectedFileId === f.id ? 'bg-neon-cyan/20 text-foreground' : 'bg-white/5 hover:bg-white/10 text-muted-foreground'
                                    }`}
                                >
                                    <FileText size={14} className="opacity-50" />
                                    <span className="truncate">{f.title}</span>
                                </div>
                            )) : (
                                <p className="text-xs text-muted-foreground text-center mt-4">No notes uploaded yet.</p>
                            )}
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
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                                        m.role === 'user'
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
                                    placeholder={selectedFileId ? "Ask about this file..." : "Select a file to ask context-aware questions..."}
                                    className="bg-background/50 border-white/10"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />
                                <Button size="icon" className="bg-neon-cyan hover:bg-neon-cyan/80 text-black" onClick={handleSend} disabled={isChatting}>
                                    <Send size={18} />
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </>
    )
}
