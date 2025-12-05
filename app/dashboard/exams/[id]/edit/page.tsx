"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useParams } from "next/navigation"
import { Loader2, Plus, Trash2, Wand2, FileText, Save, Sparkles } from "lucide-react"

interface Question {
    question_num: number
    question_text: string
    max_marks: number
    rubric: string
    model_answer: string
}

export default function EditExamPage() {
    const params = useParams()
    const examId = params.id as string

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const router = useRouter()

    // Exam Details
    const [examName, setExamName] = useState("")
    const [subject, setSubject] = useState("")
    const [className, setClassName] = useState("")
    const [examDate, setExamDate] = useState("")
    const [totalMarks, setTotalMarks] = useState(0)
    const [passingMarks, setPassingMarks] = useState(0)
    const [markingPrecision, setMarkingPrecision] = useState("whole")

    // AI Generation State
    const [importText, setImportText] = useState("")
    const [generationPrompt, setGenerationPrompt] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Questions
    const [questions, setQuestions] = useState<Question[]>([])

    useEffect(() => {
        const fetchExam = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from("exams")
                .select("*")
                .eq("id", examId)
                .single()

            if (error) {
                console.error("Error fetching exam:", error)
                alert("Failed to load exam")
                router.push("/dashboard/exams")
                return
            }

            if (data) {
                setExamName(data.exam_name)
                setSubject(data.subject)
                setClassName(data.class)
                setExamDate(data.exam_date)
                setTotalMarks(data.total_marks)
                setPassingMarks(data.passing_marks || 0)
                setMarkingPrecision(data.marking_precision || "whole")
                setQuestions(data.marking_scheme as Question[] || [])
            }
            setIsLoading(false)
        }

        if (examId) {
            fetchExam()
        }
    }, [examId, router])

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                question_num: questions.length + 1,
                question_text: "",
                max_marks: 0,
                rubric: "",
                model_answer: "",
            },
        ])
    }

    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index)
        // Renumber questions
        const renumbered = newQuestions.map((q, i) => ({ ...q, question_num: i + 1 }))
        setQuestions(renumbered)
    }

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions]
        newQuestions[index] = { ...newQuestions[index], [field]: value }
        setQuestions(newQuestions)

        // Auto-calculate total marks
        if (field === "max_marks") {
            const total = newQuestions.reduce((sum, q) => sum + Number(q.max_marks || 0), 0)
            setTotalMarks(total)
        }
    }

    // AI Generation Functions
    const handleGenerateFromText = async () => {
        if (!importText) return
        setIsGenerating(true)
        try {
            const res = await fetch("/api/gemini/generate-exam", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: importText,
                    mode: "generate",
                    context: subject,
                }),
            })

            const data = await res.json()
            if (data.success) {
                setQuestions(data.data)
                // Recalculate total marks
                const total = data.data.reduce((sum: number, q: Question) => sum + Number(q.max_marks || 0), 0)
                setTotalMarks(total)
                setIsDialogOpen(false)
            } else {
                alert("Failed to generate questions: " + data.error)
            }
        } catch (error) {
            console.error(error)
            alert("Error generating questions")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAutoCompleteAnswers = async () => {
        setIsGenerating(true)
        try {
            // Extract just the questions text
            const questionsText = questions
                .map((q) => `Q${q.question_num}: ${q.question_text} (${q.max_marks} marks)`)
                .join("\n")

            const res = await fetch("/api/gemini/generate-exam", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: questionsText,
                    mode: "complete",
                    context: subject,
                }),
            })

            const data = await res.json()
            if (data.success) {
                // Merge generated answers with existing questions
                const merged = questions.map((q, i) => {
                    const generated = data.data.find((g: Question) => g.question_num === q.question_num) || data.data[i]
                    return {
                        ...q,
                        rubric: generated?.rubric || q.rubric,
                        model_answer: generated?.model_answer || q.model_answer,
                        question_text: q.question_text || generated?.question_text,
                        max_marks: q.max_marks || generated?.max_marks,
                    }
                })
                setQuestions(merged)

                // Recalculate total marks
                const total = merged.reduce((sum: number, q: Question) => sum + Number(q.max_marks || 0), 0)
                setTotalMarks(total)
            }
        } catch (error) {
            console.error(error)
            alert("Error completing answers")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        const supabase = createClient()

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error } = await supabase.from("exams").update({
                exam_name: examName,
                subject,
                class: className,
                exam_date: examDate,
                total_marks: totalMarks,
                passing_marks: passingMarks,
                marking_precision: markingPrecision,
                marking_scheme: questions,
            }).eq("id", examId)

            if (error) throw error
            router.push("/dashboard/exams")
            router.refresh()
        } catch (error) {
            console.error("Error updating exam:", error)
            alert("Failed to update exam")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        Edit Exam
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Modify exam details, questions, and grading criteria.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" className="gap-2 shadow-lg shadow-primary/10 border border-primary/20">
                                <Wand2 className="h-4 w-4 text-primary" />
                                AI Import / Generate
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] bg-card border-border">
                            <DialogHeader>
                                <DialogTitle>AI Exam Assistant</DialogTitle>
                                <DialogDescription>Import questions from text or generate them from a topic.</DialogDescription>
                            </DialogHeader>
                            <Tabs defaultValue="paste" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="paste">Paste Text</TabsTrigger>
                                    <TabsTrigger value="topic">Generate from Topic</TabsTrigger>
                                </TabsList>
                                <TabsContent value="paste" className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Paste Question Paper / Answer Key</Label>
                                        <Textarea
                                            placeholder="Paste your questions here. e.g.&#10;1. What is the speed of light? (2 marks)&#10;2. Explain Newton's First Law. (5 marks)"
                                            className="min-h-[200px] bg-background/50"
                                            value={importText}
                                            onChange={(e) => setImportText(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Tip: You can paste raw text from a PDF or Word doc. The AI will structure it for you.
                                        </p>
                                    </div>
                                    <Button onClick={handleGenerateFromText} disabled={isGenerating || !importText} className="w-full">
                                        {isGenerating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="mr-2 h-4 w-4" />
                                        )}
                                        Process & Import
                                    </Button>
                                </TabsContent>
                                <TabsContent value="topic" className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Topic / Subject Area</Label>
                                        <Input
                                            placeholder="e.g. Thermodynamics, Shakespeare's Hamlet, World War II"
                                            className="bg-background/50"
                                            value={importText}
                                            onChange={(e) => setImportText(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Additional Instructions</Label>
                                        <Textarea
                                            placeholder="e.g. Create 5 questions. Mix of multiple choice and short answer. Hard difficulty."
                                            className="bg-background/50"
                                            value={generationPrompt}
                                            onChange={(e) => setGenerationPrompt(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleGenerateFromText} disabled={isGenerating || !importText} className="w-full">
                                        {isGenerating ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Wand2 className="mr-2 h-4 w-4" />
                                        )}
                                        Generate Questions
                                    </Button>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Exam Details Card */}
                <Card className="border-border bg-card/40 backdrop-blur-md shadow-xl">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <CardTitle>Exam Details</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 p-6">
                        <div className="grid gap-2">
                            <Label htmlFor="examName">Exam Name</Label>
                            <Input
                                id="examName"
                                placeholder="e.g. Midterm Physics"
                                required
                                value={examName}
                                onChange={(e) => setExamName(e.target.value)}
                                className="bg-background/50 border-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                placeholder="e.g. Physics"
                                required
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-background/50 border-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="class">Class</Label>
                            <Input
                                id="class"
                                placeholder="e.g. 10-A"
                                required
                                value={className}
                                onChange={(e) => setClassName(e.target.value)}
                                className="bg-background/50 border-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                required
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                className="bg-background/50 border-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="precision">Marking Precision</Label>
                            <Select value={markingPrecision} onValueChange={setMarkingPrecision}>
                                <SelectTrigger className="bg-background/50 border-primary/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="whole">Whole Numbers (1, 2, 3)</SelectItem>
                                    <SelectItem value="half">Half Marks (0.5, 1.0, 1.5)</SelectItem>
                                    <SelectItem value="quarter">Quarter Marks (0.25, 0.5, 0.75)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="passingMarks">Passing Marks</Label>
                            <Input
                                id="passingMarks"
                                type="number"
                                required
                                min="0"
                                value={passingMarks}
                                onChange={(e) => setPassingMarks(Number(e.target.value))}
                                className="bg-background/50 border-primary/20 focus:border-primary"
                            />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label>Total Marks (Auto-calculated)</Label>
                            <div className="flex h-10 w-full items-center rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-bold text-primary">
                                {totalMarks}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between sticky top-20 z-10 bg-background/80 backdrop-blur-md p-4 rounded-lg border border-border shadow-sm">
                        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                            <span className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">{questions.length}</span>
                            Questions
                        </h2>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleAutoCompleteAnswers}
                                disabled={isGenerating}
                                className="border-primary/20 hover:bg-primary/10"
                            >
                                {isGenerating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
                                )}
                                Auto-Complete Answers
                            </Button>
                            <Button
                                type="button"
                                onClick={addQuestion}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Question
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {questions.map((question, index) => (
                            <Card
                                key={index}
                                className="border-border bg-card/40 backdrop-blur-sm hover:border-primary/30 transition-colors group"
                            >
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 border-b border-border/50 bg-muted/10">
                                    <CardTitle className="text-base font-medium flex items-center gap-2">
                                        <span className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">
                                            {question.question_num}
                                        </span>
                                        Question {question.question_num}
                                    </CardTitle>
                                    {questions.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-50 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeQuestion(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="grid gap-6 p-6">
                                    <div className="grid md:grid-cols-[1fr_150px] gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-muted-foreground">Question Text</Label>
                                            <Textarea
                                                placeholder="Enter the question here..."
                                                value={question.question_text}
                                                onChange={(e) => updateQuestion(index, "question_text", e.target.value)}
                                                required
                                                className="bg-background/50 min-h-[80px] border-primary/10 focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-muted-foreground">Max Marks</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.25"
                                                value={question.max_marks}
                                                onChange={(e) => updateQuestion(index, "max_marks", e.target.value)}
                                                required
                                                className="bg-background/50 border-primary/10 focus:border-primary/50 font-mono text-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="grid gap-2">
                                            <Label className="text-muted-foreground">Model Answer</Label>
                                            <Textarea
                                                placeholder="What is the ideal answer?"
                                                value={question.model_answer}
                                                onChange={(e) => updateQuestion(index, "model_answer", e.target.value)}
                                                required
                                                className="bg-background/50 min-h-[100px] border-primary/10 focus:border-primary/50"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-muted-foreground">Rubric / Marking Scheme</Label>
                                            <Textarea
                                                placeholder="e.g. 2 marks for definition, 3 marks for diagram..."
                                                value={question.rubric}
                                                onChange={(e) => updateQuestion(index, "rubric", e.target.value)}
                                                required
                                                className="bg-background/50 min-h-[100px] border-primary/10 focus:border-primary/50"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-4 sticky bottom-6 z-10 p-4 bg-background/80 backdrop-blur-md rounded-lg border border-border shadow-lg">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 min-w-[150px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
