import { redirect } from "next/navigation"

// Redirect to exams list where teacher can select a class to view insights for
export default function ClassIndexPage() {
  redirect("/dashboard/exams")
}
