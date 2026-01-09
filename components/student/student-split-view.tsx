"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ZoomIn, ZoomOut, RotateCw, CheckCircle, ChevronLeft, ChevronRight, AlertCircle, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"

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
  is_review_requested?: boolean
  student_comment?: string
}

interface StudentSplitViewProps {
  sheet: {
    id: string
    student_id: string
    file_url?: string
    file_urls?: string[]
    total_score: number
    review_status: string
    exams: {
      total_marks: number
      marking_scheme: MarkingSchemeQuestion[]
    }
  }
  initialEvaluations: Evaluation[]
}

export default function StudentSplitView({ sheet, initialEvaluations }: StudentSplitViewProps) {
  const [evaluations, setEvaluations] = useState(initialEvaluations)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 })

  // Handle multiple files or single file legacy
  const fileUrls = sheet.file_urls && sheet.file_urls.length > 0
    ? sheet.file_urls
    : (sheet.file_url ? [sheet.file_url] : ["/placeholder.svg"])

  const currentFileUrl = fileUrls[currentPageIndex]

  // Calculate totals
  const totalScore = evaluations.reduce((sum, ev) => sum + Number(ev.final_score || 0), 0)
  const maxScore = sheet.exams.total_marks

  const toggleReviewRequest = (id: string) => {
    if (activeReviewId === id) {
        setActiveReviewId(null)
    } else {
        setActiveReviewId(id)
    }
  }

  const handleStudentCommentChange = (index: number, comment: string) => {
    const newEvaluations = [...evaluations]
    newEvaluations[index] = {
      ...newEvaluations[index],
      student_comment: comment,
    }
    setEvaluations(newEvaluations)
  }

  const submitReviewRequest = async () => {
    const disputes = evaluations.filter(ev => ev.student_comment && ev.student_comment.trim().length > 0)

    if (disputes.length === 0) {
        alert("Please add a comment to at least one question to request a review.")
        return
    }

    if (!confirm(`You are about to raise a dispute for ${disputes.length} question(s). This will alert your teacher. Continue?`)) return

    setIsSaving(true)
    try {
        // 1. Update Evaluations with comments and flags
        for (const ev of disputes) {
            await supabase
                .from("question_evaluations")
                .update({
                    is_review_requested: true,
                    student_comment: ev.student_comment
                })
                .eq("id", ev.id)
        }

        // 2. Update Sheet Status
        const { error } = await supabase
            .from("answer_sheets")
            .update({
                review_status: "requested"
            })
            .eq("id", sheet.id)

        if (error) throw error

        alert("Review request submitted successfully!")
        router.refresh()
    } catch (error) {
        console.error("Error submitting review:", error)
        alert("Failed to submit review. Please try again.")
    } finally {
        setIsSaving(false)
        setActiveReviewId(null)
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0f172a] text-slate-100 h-full">
      {/* Left Panel: Image Viewer (Identical to Teacher) */}
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
          </div>
        </div>
      </div>

      {/* Right Panel: Read-Only Grading & Correction Request */}
      <div className="w-[450px] border-l border-white/10 flex flex-col bg-slate-900/50 backdrop-blur-xl overflow-hidden">

        <div className="p-4 border-b border-white/10 bg-black/20">
            <h2 className="font-bold text-white flex items-center justify-between">
                Review & Analysis
                {sheet.review_status === 'requested' && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">Review Pending</Badge>
                )}
                {sheet.review_status === 'resolved' && (
                     <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Dispute Resolved</Badge>
                )}
            </h2>
        </div>

        <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
            {evaluations.map((ev, index) => {
                const question = sheet.exams.marking_scheme.find((q: any) => q.question_num === ev.question_num)
                const isReviewActive = activeReviewId === ev.id || ev.is_review_requested

                return (
                <GlassCard key={ev.id} className={`p-4 border-l-4 ${ev.is_review_requested ? "border-l-amber-500 border-amber-500/30 bg-amber-900/10" : "border-l-indigo-500"}`}>
                    <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 mr-2">
                        <span className="px-2 py-1 bg-white/5 rounded text-xs text-slate-400 font-mono mr-2">Q{ev.question_num}</span>
                        <span className="font-semibold text-white text-sm">{question?.question_text}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-1 border border-white/5">
                        <span className="font-bold text-white">{ev.final_score}</span>
                        <span className="text-xs text-slate-500">/ {question?.max_marks}</span>
                    </div>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-black/20 p-3 rounded-lg text-xs text-slate-300 border border-white/5">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Teacher Feedback</p>
                            {ev.reasoning}
                        </div>

                        {/* Dispute / Correction Section */}
                        {sheet.review_status !== 'requested' && sheet.review_status !== 'resolved' && (
                             <div>
                                {!isReviewActive ? (
                                    <button
                                        onClick={() => toggleReviewRequest(ev.id)}
                                        className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors mt-2"
                                    >
                                        <AlertCircle size={12} />
                                        Request Correction
                                    </button>
                                ) : (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        className="mt-2"
                                    >
                                        <Textarea
                                            value={ev.student_comment || ""}
                                            onChange={(e) => handleStudentCommentChange(index, e.target.value)}
                                            placeholder="Explain why you think this grade is incorrect..."
                                            className="text-sm min-h-[80px] bg-amber-900/10 border-amber-500/30 text-slate-200 placeholder:text-slate-500 focus:border-amber-500 mb-2"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs text-slate-400"
                                                onClick={() => toggleReviewRequest(ev.id)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                             </div>
                        )}

                        {/* Display existing comment if requested/resolved */}
                        {(ev.is_review_requested || sheet.review_status === 'resolved') && ev.student_comment && (
                            <div className="mt-2 bg-amber-500/10 border border-amber-500/20 p-2 rounded text-xs">
                                <span className="font-bold text-amber-400 block mb-1">Your Comment:</span>
                                <p className="text-slate-300">{ev.student_comment}</p>
                            </div>
                        )}
                    </div>
                </GlassCard>
                )
            })}
            </div>
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

          {sheet.review_status === 'none' && (
            <Button
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-none"
                onClick={submitReviewRequest}
                disabled={isSaving || evaluations.filter(e => e.student_comment).length === 0}
            >
                <MessageCircle className="mr-2 h-4 w-4" />
                Submit Review Request
            </Button>
          )}

           {sheet.review_status === 'requested' && (
               <div className="text-center text-sm text-amber-400 bg-amber-900/20 border border-amber-900/50 p-2 rounded">
                   Review request sent to teacher.
               </div>
           )}
        </div>
      </div>
    </div>
  )
}
