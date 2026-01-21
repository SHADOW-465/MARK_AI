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

interface MarkingSchemeQuestion {
  question_num: number
  question_text: string
  max_marks: number
}

interface Evaluation {
  id: string
  question_num: number
  final_score: number | string | null
  teacher_score: number | null
  reasoning: string
  extracted_text?: string
  confidence: number
  root_cause?: string
}

interface GradingInterfaceProps {
  sheet: {
    id: string
    student_id: string
    exam_id: string
    file_url?: string
    file_urls?: string[]
    total_score: number
    gemini_response?: {
      overall_feedback?: string
      student_os_analysis?: {
        focus_areas?: string[]
        real_world_application?: string
        roi_analysis?: any[]
      }
    }
    exams: {
      id: string
      exam_name: string
      subject: string
      total_marks: number
      marking_scheme: MarkingSchemeQuestion[]
    }
  }
  initialEvaluations: Evaluation[]
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
  const totalScore = evaluations.reduce((sum, ev) => sum + Number(ev.final_score || 0), 0)
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

  const saveChanges = async (silent = false) => {
    setIsSaving(true)
    try {
      // Update evaluations
      for (const ev of evaluations) {
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

      if (!silent) alert("Changes saved successfully!")
    } catch (error) {
      console.error("Error saving:", error)
      if (!silent) alert("Failed to save changes.")
      throw error // Re-throw for approveGrading to catch
    } finally {
      setIsSaving(false)
    }
  }

  const approveGrading = async () => {
    if (!confirm("Are you sure you want to approve these grades? This will make results visible to the student."))
      return

    setIsSaving(true)
    try {
      await saveChanges(true) // Silent save

      // 1. Calculate refined metrics for Dashboard (Feedback Analysis)
      const rcSummary = { concept: 0, calculation: 0, keyword: 0 }
      evaluations.forEach(ev => {
        const question = sheet.exams.marking_scheme.find((q: MarkingSchemeQuestion) => q.question_num === ev.question_num)
        const max = question?.max_marks || 0
        const lost = max - Number(ev.final_score || 0)

        if (lost > 0) {
          const cause = (ev.root_cause || 'concept').toLowerCase()
          if (cause.includes('concept')) rcSummary.concept += lost
          else if (cause.includes('calc')) rcSummary.calculation += lost
          else if (cause.includes('key')) rcSummary.keyword += lost
          else rcSummary.concept += lost // default
        }
      })

      // 2. Upsert Feedback Analysis WITH EXAM METADATA (for student access)
      const { error: feedbackError } = await supabase
        .from("feedback_analysis")
        .upsert({
          answer_sheet_id: sheet.id,
          student_id: sheet.student_id,
          
          // Exam metadata for student view (denormalized snapshot)
          exam_name: sheet.exams.exam_name || 'Exam',
          exam_subject: sheet.exams.subject || '',
          exam_total_marks: sheet.exams.total_marks,
          exam_marking_scheme: sheet.exams.marking_scheme,
          
          // Feedback data
          overall_feedback: overallFeedback,
          root_cause_analysis: rcSummary,
          focus_areas: sheet.gemini_response?.student_os_analysis?.focus_areas || [],
          real_world_application: sheet.gemini_response?.student_os_analysis?.real_world_application || '',
          roi_analysis: sheet.gemini_response?.student_os_analysis?.roi_analysis || []
        }, {
          onConflict: 'answer_sheet_id'
        })

      if (feedbackError) {
        console.error("Feedback upsert error:", feedbackError)
      }

      // 3. Mark Sheet as Approved
      const { error: sheetError } = await supabase
        .from("answer_sheets")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", sheet.id)

      if (sheetError) {
        throw sheetError
      }

      alert("Grading finalized and sent to student!")
      router.push(`/dashboard/grading`)
      router.refresh()
    } catch (error) {
      console.error("Error approving:", error)
      alert("Failed to finalize grading. Please check your connection.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-background text-foreground">
      {/* Left Panel: Image Viewer */}
      <div className="flex-1 bg-muted/20 relative border-r border-border flex flex-col">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 bg-background/80 backdrop-blur-md p-1 rounded-full shadow-xl border border-border">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="flex items-center text-xs font-medium w-12 justify-center text-foreground">{zoom}%</span>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={() => setZoom((z) => Math.min(200, z + 10))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 bg-border" />
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full" onClick={() => setRotation((r) => (r + 90) % 360)}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 bg-border" />
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full ${isDrawingMode ? "text-red-500 bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            title="Toggle Pen"
          >
            <PenTool className="h-4 w-4" />
          </Button>
          {isDrawingMode && (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 rounded-full" onClick={clearCanvas} title="Clear Drawings">
              <Eraser className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Page Navigation */}
        {fileUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-4 items-center bg-background/80 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-border">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground rounded-full"
              onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentPageIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-foreground">
              Page {currentPageIndex + 1} of {fileUrls.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground rounded-full"
              onClick={() => setCurrentPageIndex(prev => Math.min(fileUrls.length - 1, prev + 1))}
              disabled={currentPageIndex === fileUrls.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-muted/30">
          <div
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-out",
            }}
            className="origin-center shadow-2xl shadow-muted/20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentFileUrl}
              alt={`Answer Sheet Page ${currentPageIndex + 1}`}
              className="max-w-full rounded-sm border border-border"
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
      <div className="w-[500px] border-l border-border flex flex-col bg-card/50 backdrop-blur-xl h-full overflow-hidden">

        {/* Tabs */}
        <div className="p-4 border-b border-border">
          <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setActiveTab('grading')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'grading' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Grading & Analysis
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'feedback' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
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
                    <GlassCard key={ev.id} className={`p-4 border-l-4 ${isOverridden ? "border-l-amber-500" : "border-l-primary"}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground font-mono mr-2">Q{ev.question_num}</span>
                          <span className="font-semibold text-foreground text-sm">{question?.question_text}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/20 rounded-lg p-1">
                          <Input
                            type="number"
                            value={ev.final_score ?? ''}
                            onChange={(e) => handleScoreChange(index, e.target.value)}
                            className="w-12 h-8 text-center bg-muted/50 border border-border hover:bg-muted focus:ring-1 focus:ring-primary text-foreground font-bold p-0"
                            max={question?.max_marks}
                            min={0}
                          />
                          <span className="text-xs text-muted-foreground">/{question?.max_marks}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-muted/20 p-3 rounded-lg text-xs font-mono text-muted-foreground border border-border/50 max-h-[150px] overflow-y-auto">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Extracted Answer</p>
                          {ev.extracted_text || <span className="italic text-muted-foreground/60">No text extracted</span>}
                        </div>

                        <div className="flex gap-2 items-start">
                          <CheckCircle size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                          <Textarea
                            value={ev.reasoning}
                            onChange={(e) => handleFeedbackChange(index, e.target.value)}
                            enableVoice
                            className="text-sm min-h-[60px] max-h-[200px] overflow-y-auto bg-transparent border-border focus:border-primary text-foreground resize-none"
                            placeholder="AI Feedback..."
                          />
                        </div>

                        {ev.confidence < 0.7 && (
                          <div className="flex gap-2 items-center text-amber-600 text-xs bg-amber-500/10 p-2 rounded">
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
                <GlassCard className="p-6 bg-gradient-to-br from-primary/10 to-accent/10">
                  <div className="flex items-center gap-3 mb-4 text-emerald-600">
                    <Sparkles size={20} />
                    <h3 className="font-bold">Personalized Growth Plan</h3>
                  </div>
                  <Textarea
                    value={overallFeedback}
                    onChange={(e) => setOverallFeedback(e.target.value)}
                    enableVoice
                    className="min-h-[150px] max-h-[300px] overflow-y-auto bg-muted/20 border-border text-foreground mb-4"
                    placeholder="Enter overall feedback for the student..."
                  />


                </GlassCard>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="secondary" className="bg-muted hover:bg-muted/80 border-border text-foreground">
                    <Mic size={16} className="mr-2" /> Record Audio
                  </Button>
                  <Button variant="secondary" className="bg-muted hover:bg-muted/80 border-border text-foreground">
                    <Share2 size={16} className="mr-2" /> Send Preview
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground text-sm">Total Score</span>
            <div className="text-right">
              <span className="text-2xl font-bold text-foreground">{totalScore}</span>
              <span className="text-muted-foreground text-sm"> / {maxScore}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-transparent border-border hover:bg-muted text-foreground" onClick={() => saveChanges()} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button className="flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" onClick={approveGrading} disabled={isSaving}>
              <Check className="mr-2 h-4 w-4" />
              Finalize & Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
