"use client"

import { useState } from "react"
import { Plus, Brain, Tag, BookOpen, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface CustomCardDialogProps {
    studentId: string
}

export function CustomCardDialog({ studentId }: CustomCardDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        subject: "",
        tags: "",
    })
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const tagsArray = formData.tags
                ? formData.tags.split(",").map(t => t.trim()).filter(t => t !== "")
                : []

            const { error } = await supabase
                .from("flashcards")
                .insert({
                    student_id: studentId,
                    question: formData.question,
                    answer: formData.answer,
                    subject: formData.subject,
                    tags: tagsArray,
                    level: 1,
                    next_review_at: new Date().toISOString()
                })

            if (error) throw error

            setIsOpen(false)
            setFormData({ question: "", answer: "", subject: "", tags: "" })
            router.refresh()
        } catch (error) {
            console.error("Error creating flashcard:", error)
            alert("Failed to create flashcard. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-black rounded-xl font-bold text-sm hover:bg-neon-cyan/90 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                    <Plus size={18} />
                    Custom Card
                </button>
            </DialogTrigger>
            <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 text-foreground max-w-lg rounded-2xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-display font-bold flex items-center gap-2">
                            <Brain className="text-neon-cyan" />
                            Create Custom Flashcard
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Add a manual card to your active recall vault.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="question" className="text-sm font-bold flex items-center gap-2">
                                <Plus size={14} className="text-neon-cyan" />
                                Question
                            </Label>
                            <Input
                                id="question"
                                placeholder="What is the first law of thermodynamics?"
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                required
                                className="bg-white/5 border-white/10 rounded-xl focus:border-neon-cyan/50 h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="answer" className="text-sm font-bold flex items-center gap-2">
                                <Tag size={14} className="text-neon-purple" />
                                Answer
                            </Label>
                            <Textarea
                                id="answer"
                                placeholder="Energy cannot be created or destroyed, only transformed..."
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                required
                                className="bg-white/5 border-white/10 rounded-xl focus:border-neon-purple/50 min-h-[100px] resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject" className="text-sm font-bold flex items-center gap-2">
                                    <BookOpen size={14} className="text-neon-cyan" />
                                    Subject
                                </Label>
                                <Input
                                    id="subject"
                                    placeholder="Physics"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="bg-white/5 border-white/10 rounded-xl h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tags" className="text-sm font-bold flex items-center gap-2">
                                    <Tag size={14} className="text-muted-foreground" />
                                    Tags (comma separated)
                                </Label>
                                <Input
                                    id="tags"
                                    placeholder="Laws, Heat, Energy"
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="bg-white/5 border-white/10 rounded-xl h-11"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            className="rounded-xl hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-neon-cyan text-black hover:bg-neon-cyan/90 font-bold px-8 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.2)]"
                        >
                            {isLoading ? "Creating..." : "Add to Vault"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
