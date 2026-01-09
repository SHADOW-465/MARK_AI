"use client"

import { useState, useRef, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnimatePresence, motion } from "framer-motion"
import { Send, Upload, FileText, X, Bot, User, Sparkles, AlertCircle, Maximize2, Minimize2, Paperclip, CheckSquare, Brain } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Message {
  role: "user" | "model"
  text: string
}

interface GuideClientProps {
  initialMaterials: any[]
  initialExams: any[]
  preSelectedExamId?: string
  initialQuery?: string
}

export function GuideClient({ initialMaterials, initialExams, preSelectedExamId, initialQuery }: GuideClientProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialQuery || "")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedExams, setSelectedExams] = useState<string[]>(preSelectedExamId ? [preSelectedExamId] : [])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()
  const [hasStarted, setHasStarted] = useState(!!initialQuery)

  // Auto-send initial query if present
  useEffect(() => {
    if (initialQuery && messages.length === 0 && !isLoading) {
      handleSend()
    }
  }, [initialQuery])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = { role: "user", text: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setHasStarted(true)

    try {
      // 1. Fetch content of selected items
      let context = ""

      // Add Materials
      if (selectedMaterials.length > 0) {
        context += "\n\n--- SELECTED STUDY MATERIALS ---\n"
        const relevantMaterials = initialMaterials.filter(m => selectedMaterials.includes(m.id))
        relevantMaterials.forEach(m => {
             context += `Source: ${m.title}\nContent: ${m.extracted_text?.substring(0, 3000) || "No text available"}\n---\n`
        })
      }

      // Add Exams
      if (selectedExams.length > 0) {
         context += "\n\n--- PAST EXAM RESULTS ---\n"
         // Fetch evaluations for these exams
         for (const sheetId of selectedExams) {
            const { data: evals } = await supabase
                .from('question_evaluations')
                .select('question_num, final_score, reasoning, student_answer') // Assuming student_answer might be there or not
                .eq('answer_sheet_id', sheetId)

            const sheet = initialExams.find(e => e.id === sheetId)
            context += `Exam: ${sheet?.exams?.exam_name} (${sheet?.exams?.subject})\n`
            if (evals) {
                evals.forEach(ev => {
                    context += `Q${ev.question_num}: Score ${ev.final_score}. Feedback: ${ev.reasoning}\n`
                })
            }
         }
      }

      const response = await fetch("/api/student/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          history: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          context: context
        }),
      })

      if (!response.ok) throw new Error("Failed to send message")

      const data = await response.json()
      setMessages((prev) => [...prev, { role: "model", text: data.response }])
    } catch (error) {
      console.error(error)
      setMessages((prev) => [...prev, { role: "model", text: "Sorry, I encountered an error processing your request." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
        const formData = new FormData()
        formData.append("file", file)

        // Use existing upload API or server action
        // For now, let's assume we have a direct upload capability or reuse the one from Materials
        // Since I don't see the upload action immediately, I'll simulate or skip for this specific rebrand task
        // unless explicitly needed. But "AI Guide" needs context.
        // Let's just alert for now as the prompt is about "Rebranding" and "Refactoring".
        alert("Please go to the Library to upload new materials.")

    } catch (error) {
        console.error("Upload failed", error)
    } finally {
        setUploading(false)
    }
  }

  const toggleMaterial = (id: string) => {
    setSelectedMaterials(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleExam = (id: string) => {
    setSelectedExams(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar - Context Selector */}
      <AnimatePresence mode="popLayout">
        {isSidebarOpen && (
            <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 300 }}
                exit={{ opacity: 0, width: 0 }}
                className="flex flex-col gap-4 shrink-0"
            >
                <GlassCard className="flex-1 flex flex-col overflow-hidden p-0 border-white/10 bg-black/40 backdrop-blur-xl">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Brain className="text-cyan-400" size={18} />
                            Knowledge Base
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-6 w-6 text-slate-400 hover:text-white">
                            <X size={14} />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-6">
                            {/* Materials Section */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                                    Study Materials
                                    <Badge variant="secondary" className="bg-white/5 text-slate-400">{initialMaterials.length}</Badge>
                                </h4>
                                <div className="space-y-2">
                                    {initialMaterials.map(mat => (
                                        <div
                                            key={mat.id}
                                            onClick={() => toggleMaterial(mat.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                selectedMaterials.includes(mat.id)
                                                ? "bg-indigo-500/20 border-indigo-500/50"
                                                : "bg-white/5 border-transparent hover:bg-white/10"
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={`mt-1 p-1 rounded ${selectedMaterials.includes(mat.id) ? "text-indigo-400" : "text-slate-400"}`}>
                                                    <FileText size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${selectedMaterials.includes(mat.id) ? "text-indigo-200" : "text-slate-300"}`}>
                                                        {mat.title}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {new Date(mat.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {selectedMaterials.includes(mat.id) && <CheckSquare size={14} className="text-indigo-400 mt-1" />}
                                            </div>
                                        </div>
                                    ))}
                                    {initialMaterials.length === 0 && (
                                        <p className="text-xs text-slate-500 italic text-center py-2">No materials found.</p>
                                    )}
                                </div>
                            </div>

                            {/* Exams Section */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                                    Exam Context
                                    <Badge variant="secondary" className="bg-white/5 text-slate-400">{initialExams.length}</Badge>
                                </h4>
                                <div className="space-y-2">
                                    {initialExams.map(sheet => (
                                        <div
                                            key={sheet.id}
                                            onClick={() => toggleExam(sheet.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                selectedExams.includes(sheet.id)
                                                ? "bg-cyan-500/20 border-cyan-500/50"
                                                : "bg-white/5 border-transparent hover:bg-white/10"
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                <div className={`mt-1 p-1 rounded ${selectedExams.includes(sheet.id) ? "text-cyan-400" : "text-slate-400"}`}>
                                                    <FileText size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${selectedExams.includes(sheet.id) ? "text-cyan-200" : "text-slate-300"}`}>
                                                        {sheet.exams?.exam_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {sheet.exams?.subject} • {sheet.total_score}/{sheet.exams?.total_marks}
                                                    </p>
                                                </div>
                                                {selectedExams.includes(sheet.id) && <CheckSquare size={14} className="text-cyan-400 mt-1" />}
                                            </div>
                                        </div>
                                    ))}
                                    {initialExams.length === 0 && (
                                        <p className="text-xs text-slate-500 italic text-center py-2">No graded exams found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </GlassCard>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <GlassCard className="flex-1 flex flex-col overflow-hidden border-white/10 bg-black/40 backdrop-blur-xl relative">
            {!isSidebarOpen && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-4 left-4 z-10 bg-black/40 hover:bg-black/60 text-slate-300 border border-white/10"
                >
                    <Maximize2 size={16} />
                </Button>
            )}

            {/* Empty State / Welcome */}
            {!hasStarted && messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
                        <Sparkles size={40} className="text-white" />
                    </div>
                    <div className="space-y-2 max-w-md">
                        <h2 className="text-2xl font-bold text-white">Your Personal AI Guide</h2>
                        <p className="text-slate-400">
                            Select materials or past exams from the sidebar to give me context, then ask me anything!
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                        {[
                            "Explain the mistakes I made in my last Math exam",
                            "Create a practice quiz based on 'Chapter 4 Notes'",
                            "Summarize the key concepts from my uploaded Physics PDF",
                            "What should I focus on to improve my grade?"
                        ].map((suggestion, i) => (
                            <button
                                key={i}
                                onClick={() => { setInput(suggestion); }}
                                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left text-sm text-slate-300 hover:text-white"
                            >
                                "{suggestion}"
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages */}
            {(hasStarted || messages.length > 0) && (
                <ScrollArea ref={scrollRef} className="flex-1 p-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    msg.role === "user" ? "bg-indigo-600 text-white" : "bg-cyan-600 text-white"
                                }`}>
                                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`flex-1 space-y-2 ${msg.role === "user" ? "text-right" : ""}`}>
                                    <div className={`inline-block p-4 rounded-2xl text-sm leading-relaxed ${
                                        msg.role === "user"
                                        ? "bg-indigo-600/20 text-indigo-100 rounded-tr-none border border-indigo-500/30"
                                        : "bg-white/5 text-slate-200 rounded-tl-none border border-white/10"
                                    }`}>
                                        <ReactMarkdown
                                            components={{
                                                strong: ({node, ...props}) => <span className="font-bold text-white" {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                                                ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                                                code: ({node, ...props}) => <code className="bg-black/30 px-1 py-0.5 rounded text-xs font-mono text-cyan-300" {...props} />
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center shrink-0 animate-pulse">
                                    <Bot size={16} className="text-white" />
                                </div>
                                <div className="flex items-center gap-1 h-8">
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
                <div className="max-w-3xl mx-auto flex gap-3 items-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white shrink-0"
                        title="Upload Context (Go to Library)"
                        onClick={() => router.push('/student/vault')}
                    >
                        <Paperclip size={20} />
                    </Button>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder="Ask about your exams, notes, or progress..."
                            className="border-none bg-transparent h-12 text-slate-200 placeholder:text-slate-500 focus-visible:ring-0 px-0"
                        />
                    </div>
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="h-12 w-12 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white border-none shadow-lg shadow-cyan-500/20 shrink-0"
                    >
                        <Send size={18} />
                    </Button>
                </div>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-slate-500">AI can make mistakes. Please verify important information.</span>
                </div>
            </div>
        </GlassCard>
      </div>
    </div>
  )
}
