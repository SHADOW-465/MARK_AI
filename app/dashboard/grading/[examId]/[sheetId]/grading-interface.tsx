"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Check, Save, AlertTriangle, ZoomIn, ZoomOut, RotateCw, Sparkles, Mic, Share2, Zap, CheckCircle, ChevronLeft, ChevronRight, PenTool, Eraser, Undo } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"

interface GradingInterfaceProps {
  sheet: any
  initialEvaluations: any[]
}

export default function GradingInterface({ sheet, initialEvaluations }: GradingInterfaceProps) {
  const [evaluations, setEvaluations] = useState(initialEvaluations)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [overallFeedback, setOverallFeedback] = useState(sheet.gemini_response?.overall_feedback || "")
  const [activeTab, setActiveTab] = useState<'grading' | 'feedback'>('grading')
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 })
  
  // Drawing Functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    ctx.beginPath()
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
    ctx.lineCap = "round"
    ctx.strokeStyle = "red"
    ctx.lineWidth = 4
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // Handle multiple files or single file legacy
  const fileUrls = sheet.file_urls && sheet.file_urls.length > 0
    ? sheet.file_urls
    : (sheet.file_url ? [sheet.file_url] : ["/placeholder.svg"])

  const currentFileUrl = fileUrls[currentPageIndex]

  // Calculate totals
  const totalScore = evaluations.reduce((sum, ev) => sum + (ev.final_score || 0), 0)
  const maxScore = sheet.exams.total_marks
  const percentage = Math.round((totalScore / maxScore) * 100)

  const handleScoreChange = (index: number, newScore: string) => {
    // Allow clearing the input
    if (newScore === "") {
      const newEvaluations = [...evaluations]
      newEvaluations[index] = {
        ...newEvaluations[index],
        final_score: "", // Temporarily allow string for UI
        teacher_score: null,
      }
      setEvaluations(newEvaluations)
      return
    }

    const score = Number.parseFloat(newScore)
    if (isNaN(score)) return

    const newEvaluations = [...evaluations]
    newEvaluations[index] = {
      ...newEvaluations[index],
      final_score: score,
      teacher_score: score, // Mark as overridden
    }
    setEvaluations(newEvaluations)
  }

  const handleFeedbackChange = (index: number, newFeedback: string) => {
    const newEvaluations = [...evaluations]
    newEvaluations[index] = {
      ...newEvaluations[index],
      reasoning: newFeedback,
    }
    setEvaluations(newEvaluations)
  }

  const saveChanges = async () => {
    setIsSaving(true)
    try {
      // Update evaluations
      for (const ev of evaluations) {
        // Skip if score is empty/invalid
        if (ev.final_score === "" || ev.final_score === null) continue

        await supabase
          .from("question_evaluations")
          .update({
            final_score: ev.final_score,
            teacher_score: ev.teacher_score,
            reasoning: ev.reasoning,
          })
          .eq("id", ev.id)
      }

      // Update sheet totals
      await supabase
        .from("answer_sheets")
        .update({
          total_score: totalScore,
          gemini_response: {
            ...sheet.gemini_response,
            overall_feedback: overallFeedback,
          },
        })
        .eq("id", sheet.id)

      alert("Changes saved successfully!")
    } catch (error) {
      console.error("Error saving:", error)
      alert("Failed to save changes.")
    } finally {
      setIsSaving(false)
    }
  }

  const approveGrading = async () => {
    if (!confirm("Are you sure you want to approve these grades? This will make results visible to the student."))
      return

    setIsSaving(true)
    try {
      await saveChanges() // Save first

      await supabase
        .from("answer_sheets")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", sheet.id)

      router.push(`/dashboard/grading`) // Redirect to queue
    } catch (error) {
      console.error("Error approving:", error)
      alert("Failed to approve.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0f172a] text-slate-100">
      {/* Left Panel: Image Viewer */}
      <div className="flex-1 bg-black/40 relative border-r border-white/10 flex flex-col">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-black/60 backdrop-blur-md p-1 rounded-full shadow-xl border border-white/10">
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white rounded-full" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="flex items-center text-xs font-medium w-12 justify-center text-white">{zoom}%</span>
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white rounded-full" onClick={() => setZoom((z) => Math.min(200, z + 10))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white rounded-full" onClick={() => setRotation((r) => (r + 90) % 360)}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full ${isDrawingMode ? "text-red-400 bg-white/10" : "text-slate-300 hover:text-white"}`} 
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            title="Toggle Pen"
          >
            <PenTool className="h-4 w-4" />
          </Button>
          {isDrawingMode && (
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-400 rounded-full" onClick={clearCanvas} title="Clear Drawings">
                <Eraser className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Page Navigation */}
        {fileUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-4 items-center bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white rounded-full"
              onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentPageIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-white">
              Page {currentPageIndex + 1} of {fileUrls.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white rounded-full"
              onClick={() => setCurrentPageIndex(prev => Math.min(fileUrls.length - 1, prev + 1))}
              disabled={currentPageIndex === fileUrls.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[url('/grid.svg')] bg-repeat opacity-80">
          <div
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-out",
            }}
            className="origin-center shadow-2xl shadow-black/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentFileUrl}
              alt={`Answer Sheet Page ${currentPageIndex + 1}`}
              className="max-w-full rounded-sm border border-white/10"
              onLoad={(e) => setImgDimensions({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
            />
            <canvas
                ref={canvasRef}
                width={imgDimensions.width}
                height={imgDimensions.height}
                className={`absolute inset-0 w-full h-full ${isDrawingMode ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"}`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
            />
          </div>
        </div>
      </div>

      {/* Right Panel: Grading & Feedback */}
      <div className="w-[500px] border-l border-white/10 flex flex-col bg-slate-900/50 backdrop-blur-xl">

        {/* Tabs */}
        <div className="p-4 border-b border-white/10">
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('grading')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'grading' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              Grading & Analysis
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'feedback' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              Student Feedback
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'grading' ? (
              <motion.div
                key="grading"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {evaluations.map((ev, index) => {
                  const question = sheet.exams.marking_scheme.find((q: any) => q.question_num === ev.question_num)
                  const isOverridden = ev.teacher_score !== null

                  return (
                    <GlassCard key={ev.id} className={`p-4 border-l-4 ${isOverridden ? "border-l-amber-500" : "border-l-indigo-500"}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="px-2 py-1 bg-white/5 rounded text-xs text-slate-400 font-mono mr-2">Q{ev.question_num}</span>
                          <span className="font-semibold text-white text-sm">{question?.question_text}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                          <Input
                            type="number"
                            value={ev.final_score ?? ''}
                            onChange={(e) => handleScoreChange(index, e.target.value)}
                            className="w-12 h-8 text-center bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold p-0 focus:ring-1 focus:ring-indigo-500"
                            max={question?.max_marks}
                            min={0}
                          />
                          <span className="text-xs text-slate-500">/{question?.max_marks}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-black/20 p-3 rounded-lg text-xs font-mono text-slate-300 border border-white/5 max-h-[150px] overflow-y-auto">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Extracted Answer</p>
                          {ev.extracted_text || <span className="italic text-slate-600">No text extracted</span>}
                        </div>

                        <div className="flex gap-2 items-start">
                          <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                          <Textarea
                            value={ev.reasoning}
                            onChange={(e) => handleFeedbackChange(index, e.target.value)}
                            className="text-sm min-h-[60px] max-h-[200px] overflow-y-auto bg-transparent border-white/10 focus:border-indigo-500/50 text-slate-300 resize-none"
                            placeholder="AI Feedback..."
                          />
                        </div>

                        {ev.confidence < 0.7 && (
                          <div className="flex gap-2 items-center text-amber-400 text-xs bg-amber-500/10 p-2 rounded">
                            <AlertTriangle size={14} />
                            <span>Low confidence ({Math.round(ev.confidence * 100)}%). Verify manually.</span>
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <GlassCard className="p-6 bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
                  <div className="flex items-center gap-3 mb-4 text-emerald-400">
                    <Sparkles size={20} />
                    <h3 className="font-bold">Personalized Growth Plan</h3>
                  </div>
                  <Textarea
                    value={overallFeedback}
                    onChange={(e) => setOverallFeedback(e.target.value)}
                    className="min-h-[150px] max-h-[300px] overflow-y-auto bg-black/20 border-white/10 text-slate-300 mb-4"
                    placeholder="Enter overall feedback for the student..."
                  />


                </GlassCard>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="secondary" className="bg-white/5 hover:bg-white/10 border-white/10 text-slate-300">
                    <Mic size={16} className="mr-2" /> Record Audio
                  </Button>
                  <Button variant="secondary" className="bg-white/5 hover:bg-white/10 border-white/10 text-slate-300">
                    <Share2 size={16} className="mr-2" /> Send Preview
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400 text-sm">Total Score</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-white">{totalScore}</span>
              <span className="text-slate-500 text-sm"> / {maxScore}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-transparent border-white/10 hover:bg-white/5 text-slate-300" onClick={saveChanges} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button className="flex-[2] bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-none shadow-lg shadow-indigo-500/20" onClick={approveGrading} disabled={isSaving}>
              <Check className="mr-2 h-4 w-4" />
              Finalize & Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
