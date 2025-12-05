"use client"

import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { deleteStudent } from "./actions"
import { useState } from "react"

export function DeleteStudentButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  // We don't have useToast hook in the default setup unless requested,
  // but I'll just use alert or console for now if it's missing,
  // or better, just handle state.

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this student?")) return

    setIsDeleting(true)
    try {
      await deleteStudent(id)
    } catch (error) {
      console.error("Failed to delete", error)
      alert("Failed to delete student")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      <span className="sr-only">Delete</span>
    </Button>
  )
}
