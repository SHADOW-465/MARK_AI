"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { KanbanBoard } from "@/components/student/kanban-board"
import { FileText, Target, Brain, Sparkles, Send, Upload, Link2, Plus, LayoutGrid, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { uploadStudyMaterial } from "@/app/actions/study"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LibraryClientProps {
    studentId: string
    initialTasks: any[]
    initialMaterials: any[]
    initialExams: any[]
}

export function LibraryClient({ studentId, initialTasks, initialMaterials, initialExams }: LibraryClientProps) {
    const searchParams = useSearchParams()
    const tabParam = searchParams.get('tab') as 'missions' | 'ai_studio'
    const [activeTab, setActiveTab] = useState<'missions' | 'ai_studio'>(tabParam || 'missions')

    useEffect(() => {
        if (tabParam) setActiveTab(tabParam)
    }, [tabParam])

    const [materials, setMaterials] = useState(initialMaterials)
    const [exams, setExams] = useState(initialExams)
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
    const [selectedExamIds, setSelectedExamIds] = useState<string[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [showDriveDialog, setShowDriveDialog] = useState(false)
    const [driveUrl, setDriveUrl] = useState('')
    const [isDriveImporting, setIsDriveImporting] = useState(false)

    // Task Creation State
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
    const [isTaskLoading, setIsTaskLoading] = useState(false)

    // Chat State
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
        { role: 'ai', text: "Hello! I'm your AI Study Guide. Select any notes or exams from your library to add them to my context, then we can synthesize them into something new." }
    ])
    const [input, setInput] = useState("")
    const [isChatting, setIsChatting] = useState(false)

    const toggleFile = (id: string) => {
        setSelectedFileIds(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id])
    }

    const toggleExam = (id: string) => {
        setSelectedExamIds(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", e.target.files[0])
        const res = await uploadStudyMaterial(formData)
        if (res?.error) alert(res.error)
        else window.location.reload()
        setIsUploading(false)
    }

    const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsTaskLoading(true)
        const formData = new FormData(e.currentTarget)
        formData.append("student_id", studentId)

        try {
            const res = await fetch("/api/student/tasks", {
                method: "POST",
                body: JSON.stringify(Object.fromEntries(formData)),
                headers: { "Content-Type": "application/json" }
            })
            if (!res.ok) throw new Error("Failed to add task")
            window.location.reload()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsTaskLoading(false)
            setIsTaskDialogOpen(false)
        }
    }

    const handleDriveImport = async () => {
        if (!driveUrl.trim()) return
        setIsDriveImporting(true)
        try {
            const res = await fetch('/api/drive/fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driveUrl, type: 'study_material' })
            })
            const data = await res.json()
            if (!res.ok || data.error) throw new Error(data.error)
            setShowDriveDialog(false)
            setDriveUrl('')
            window.location.reload()
        } catch (error: any) {
            alert(error.message || 'Failed to import from Drive')
        } finally {
            setIsDriveImporting(false)
        }
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
            if (data.reply) setMessages(prev => [...prev, { role: 'ai', text: data.reply }])
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: "Synthesis failed. Check connection." }])
        } finally {
            setIsChatting(false)
        }
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
            if (data.reply) setMessages(prev => [...prev, { role: 'ai', text: data.reply }])
            else setMessages(prev => [...prev, { role: 'ai', text: "Error encountered." }])
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', text: "Network error." }])
        } finally {
            setIsChatting(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-180px)]">
            {/* Sidebar: Knowledge Hub */}
            <div className="lg:col-span-3 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold">Context Library</h3>
                    <div className="flex gap-3">
                        <label className="cursor-pointer text-muted-foreground hover:text-neon-cyan transition-colors" title="Upload Note">
                            <Upload size={14} />
                            <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
                        </label>
                        <button onClick={() => setShowDriveDialog(true)} className="text-muted-foreground hover:text-neon-purple transition-colors" title="Import Drive">
                            <Link2 size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide py-2">
                    {/* Materials */}
                    <section>
                        <h4 className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-3 px-1 italic">Notes & Documents</h4>
                        <div className="space-y-2">
                            {materials.map(f => (
                                <div
                                    key={f.id}
                                    onClick={() => toggleFile(f.id)}
                                    className={cn(
                                        "p-3 rounded-xl text-xs cursor-pointer transition-all border",
                                        selectedFileIds.includes(f.id)
                                            ? "bg-neon-cyan/10 border-neon-cyan/30 text-foreground ring-1 ring-neon-cyan/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                                            : "bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className={selectedFileIds.includes(f.id) ? "text-neon-cyan" : "opacity-50"} />
                                        <span className="truncate flex-1">{f.title}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Exams */}
                    <section>
                        <h4 className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-3 px-1 italic">Evaluated Content</h4>
                        <div className="space-y-2">
                            {exams.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => toggleExam(s.id)}
                                    className={cn(
                                        "p-3 rounded-xl text-xs cursor-pointer transition-all border",
                                        selectedExamIds.includes(s.id)
                                            ? "bg-neon-purple/10 border-neon-purple/30 text-foreground ring-1 ring-neon-purple/50 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                                            : "bg-white/5 border-transparent hover:bg-white/10 text-muted-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Target size={14} className={selectedExamIds.includes(s.id) ? "text-neon-purple" : "opacity-50"} />
                                        <span className="truncate flex-1 font-bold">{s.exams?.exam_name}</span>
                                    </div>
                                    <div className="text-[10px] opacity-60 ml-5 flex justify-between">
                                        <span>{s.exams?.subject}</span>
                                        <span className="font-mono">{s.total_score}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <GlassCard className="p-4 bg-neon-cyan/5 border-neon-cyan/20">
                    <p className="text-[10px] text-neon-cyan font-mono uppercase tracking-tighter mb-1 font-bold">AI Tutor Tip</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                        Selected sources (highlighted) are used by the AI to answer questions and synthesize new study guides.
                    </p>
                </GlassCard>
            </div>

            {/* Main Content: Tabs */}
            <div className="lg:col-span-9 flex flex-col gap-6 overflow-hidden">
                <div className="flex items-center justify-between">
                    <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                        <button
                            onClick={() => setActiveTab('missions')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all",
                                activeTab === 'missions' ? "bg-neon-cyan text-black" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid size={14} /> Mission Board
                        </button>
                        <button
                            onClick={() => setActiveTab('ai_studio')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all",
                                activeTab === 'ai_studio' ? "bg-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Brain size={14} /> AI Synthesis
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {activeTab === 'missions' && (
                            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" className="bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] h-9 gap-1.5 uppercase tracking-widest font-bold">
                                        <Plus size={14} /> New Mission
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-black/90 border-white/10 backdrop-blur-xl text-foreground">
                                    <DialogHeader>
                                        <DialogTitle>Add New Learning Mission</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddTask} className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label>Mission Title</Label>
                                            <Input name="title" required className="bg-white/5 border-white/10" placeholder="e.g. Master Optics Laws" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Priority</Label>
                                                <Select name="priority" defaultValue="Medium">
                                                    <SelectTrigger className="bg-white/5 border-white/10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="High">High</SelectItem>
                                                        <SelectItem value="Medium">Medium</SelectItem>
                                                        <SelectItem value="Low">Low</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Target Date</Label>
                                                <Input name="due_date" type="date" className="bg-white/5 border-white/10" />
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={isTaskLoading} className="w-full bg-neon-cyan text-black font-bold uppercase tracking-wider">
                                            {isTaskLoading ? "Initiating..." : "Create Mission"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                        {activeTab === 'ai_studio' && (
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-[10px] h-9 gap-1.5 border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 font-bold" onClick={() => handleSynthesis('faq')} disabled={isChatting}>
                                    <MessageSquare size={14} /> FAQs
                                </Button>
                                <Button size="sm" variant="outline" className="text-[10px] h-9 gap-1.5 border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 font-bold" onClick={() => handleSynthesis('glossary')} disabled={isChatting}>
                                    <Sparkles size={14} /> GLOSSARY
                                </Button>
                                <Button size="sm" variant="outline" className="text-[10px] h-9 gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 font-bold" onClick={() => handleSynthesis('guide')} disabled={isChatting}>
                                    <FileText size={14} /> PREP GUIDE
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    {activeTab === 'missions' ? (
                        <div className="h-full overflow-y-auto pr-2 scrollbar-hide py-1">
                            <KanbanBoard initialTasks={initialTasks} studentId={studentId} />
                        </div>
                    ) : (
                        <GlassCard className="h-full p-0 flex flex-col overflow-hidden relative border-neon-purple/20 shadow-[0_0_30px_rgba(168,85,247,0.05)]">
                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                {messages.map((m, i) => (
                                    <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed",
                                            m.role === 'user'
                                                ? "bg-neon-purple/20 text-foreground rounded-br-none border border-neon-purple/30 shadow-lg"
                                                : "bg-white/5 text-muted-foreground rounded-bl-none shadow-inner border border-white/10"
                                        )}>
                                            <p className="whitespace-pre-wrap">{m.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isChatting && (
                                    <div className="flex justify-start">
                                        <div className="bg-white/5 p-5 rounded-3xl rounded-bl-none animate-pulse text-neon-cyan flex items-center gap-2 text-xs font-bold tracking-widest">
                                            <Brain size={16} className="animate-bounce" /> ANALYZING CONTEXT...
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-6 border-t border-white/5 bg-black/60 backdrop-blur-xl">
                                <div className="flex gap-3 max-w-4xl mx-auto">
                                    <Input
                                        placeholder={(selectedFileIds.length + selectedExamIds.length) > 0
                                            ? `Analyzing ${(selectedFileIds.length + selectedExamIds.length)} sources...`
                                            : "Select sources from the sidebar to start deep work..."
                                        }
                                        className="bg-white/5 border-white/10 h-12 rounded-2xl focus:border-neon-purple/50 transition-all px-6 text-sm"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <Button size="icon" className="h-12 w-12 rounded-2xl bg-neon-purple hover:bg-neon-purple/80 text-white shrink-0 shadow-lg" onClick={handleSend} disabled={isChatting}>
                                        <Send size={20} />
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>

            {/* Drive Dialog */}
            {showDriveDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                    <GlassCard className="w-full max-w-md p-8 space-y-6 border-neon-purple/30">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold font-display flex items-center gap-3">
                                <Link2 className="text-neon-purple" size={24} />
                                Drive Link Sync
                            </h3>
                            <button onClick={() => setShowDriveDialog(false)} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                        </div>
                        <p className="text-xs text-muted-foreground">Paste any Google Drive share link. We'll extract the content and add it to your library context.</p>
                        <Input
                            placeholder="https://drive.google.com/..."
                            value={driveUrl}
                            onChange={(e) => setDriveUrl(e.target.value)}
                            className="bg-white/5 border-white/10 h-11"
                        />
                        <Button className="w-full bg-neon-purple text-white hover:bg-neon-purple/90 h-11 font-bold uppercase tracking-widest" onClick={handleDriveImport} disabled={isDriveImporting}>
                            {isDriveImporting ? "SYNCING..." : "ADD TO LIBRARY"}
                        </Button>
                    </GlassCard>
                </div>
            )}
        </div>
    )
}
