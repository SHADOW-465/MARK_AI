"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ZoomIn, ZoomOut, RotateCw, CheckCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface StudentResultViewerProps {
  sheet: any
  evaluations: any[]
}

export default function StudentResultViewer({ sheet, evaluations }: StudentResultViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [activeTab, setActiveTab] = useState<'grading' | 'feedback'>('grading')
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  // Handle multiple files or single file legacy
  const fileUrls = sheet.file_urls && sheet.file_urls.length > 0
    ? sheet.file_urls
    : (sheet.file_url ? [sheet.file_url] : ["/placeholder.svg"])

  const currentFileUrl = fileUrls[currentPageIndex]

  // Calculate totals
  const totalScore = sheet.total_score || 0
  const maxScore = sheet.exams.total_marks
  const overallFeedback = sheet.gemini_response?.overall_feedback || "No feedback provided."

  return (
    <div className="flex-1 flex overflow-hidden bg-background text-foreground h-full">
      {/* Left Panel: Image Viewer */}
      <div className="flex-1 bg-black/40 relative border-r border-white/10 flex flex-col">
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
            />
          </div>
        </div>
      </div>

      {/* Right Panel: Grading & Feedback */}
      <div className="w-[450px] border-l border-border flex flex-col bg-card/50 backdrop-blur-xl">

        {/* Tabs */}
        <div className="p-4 border-b border-white/10">
          <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setActiveTab('grading')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'grading' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Exam Results
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === 'feedback' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Coach Feedback
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
                {evaluations.map((ev) => {
                  const question = sheet.exams.marking_scheme.find((q: any) => q.question_num === ev.question_num)

                  return (
                    <GlassCard key={ev.id} className="p-4 border-l-4 border-l-primary">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="px-2 py-1 bg-secondary/50 rounded text-xs text-muted-foreground font-mono mr-2">Q{ev.question_num}</span>
                          <span className="font-semibold text-foreground text-sm">{question?.question_text}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2 min-w-[60px] justify-center">
                          <span className="text-lg font-bold text-foreground">{ev.final_score}</span>
                          <span className="text-xs text-muted-foreground">/{question?.max_marks}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {ev.extracted_text && (
                          <div className="bg-muted/50 p-3 rounded-lg text-xs font-mono text-muted-foreground border border-border max-h-[100px] overflow-y-auto">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Your Answer</p>
                            {ev.extracted_text}
                          </div>
                        )}

                        {/* Answer Key / Marking Scheme */}
                        {question?.expected_answer && (
                          <div className="bg-emerald-500/10 p-3 rounded-lg text-xs border border-emerald-500/20 max-h-[100px] overflow-y-auto">
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 font-bold">Answer Key</p>
                            <p className="text-foreground leading-relaxed">{question.expected_answer}</p>
                          </div>
                        )}

                        {/* Key Points if available */}
                        {question?.key_points && question.key_points.length > 0 && (
                          <div className="bg-amber-500/10 p-3 rounded-lg text-xs border border-amber-500/20">
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 font-bold">Key Points</p>
                            <ul className="space-y-1">
                              {question.key_points.map((point: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-foreground">
                                  <span className="text-amber-500 mt-0.5">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {ev.reasoning && (
                          <div className="flex gap-2 items-start bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" />
                            <p className="text-sm text-muted-foreground leading-relaxed">{ev.reasoning}</p>
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
                  <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
                    <Sparkles size={20} />
                    <h3 className="font-bold">Personalized Growth Plan</h3>
                  </div>
                  <div className="min-h-[150px] text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {overallFeedback}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 backdrop-blur-md">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Total Score</span>
            <div className="text-right">
              <span className="text-3xl font-bold text-foreground">{totalScore}</span>
              <span className="text-muted-foreground text-sm"> / {maxScore}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
