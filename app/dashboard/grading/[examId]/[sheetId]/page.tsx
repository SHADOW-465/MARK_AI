import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Shield, ShieldAlert } from "lucide-react"
import Link from "next/link"
import GradingInterface from "./grading-interface"

// Plagiarism Badge Component
function PlagiarismBadge({ score, matchedPeers }: { score: number | null; matchedPeers?: any[] }) {
  if (score === null || score === undefined) {
    return (
      <Badge variant="outline" className="gap-1">
        <Shield className="h-3 w-3" />
        N/A
      </Badge>
    )
  }

  const getColor = (s: number) => {
    if (s <= 30) return "bg-green-500/20 text-green-400 border-green-500/30"
    if (s <= 60) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    if (s <= 80) return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const peerNames = matchedPeers?.map((p: any) => p.student_name).join(", ") || ""
  const tooltip = score > 30 && peerNames ? `Similar to: ${peerNames}` : `Similarity: ${score}%`

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 ${getColor(score)}`}
      title={tooltip}
    >
      {score > 60 ? <ShieldAlert className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
      {score}%
    </Badge>
  )
}

export default async function GradingReviewPage({
  params,
}: {
  params: Promise<{ sheetId: string }>
}) {
  const { sheetId } = await params
  const supabase = await createClient()

  // Fetch all necessary data
  const { data: sheet } = await supabase
    .from("answer_sheets")
    .select(`
      *,
      students (name, roll_number),
      exams (id, exam_name, subject, total_marks, marking_scheme)
    `)
    .eq("id", sheetId)
    .single()

  // Fetch plagiarism score
  const { data: plagiarismData } = await supabase
    .from("plagiarism_scores")
    .select("combined_score, matched_peers, status")
    .eq("answer_sheet_id", sheetId)
    .single()

  if (!sheet) {
    return <div>Answer sheet not found</div>
  }

  const { data: evaluations } = await supabase
    .from("question_evaluations")
    .select("*")
    .eq("answer_sheet_id", sheetId)
    .order("question_num", { ascending: true })

  // ---------------------------------------------

  return (
    <div className="flex flex-col overflow-hidden border border-white/10 rounded-xl bg-card/50 backdrop-blur-xl" style={{ height: 'calc(100dvh - 6rem)' }}>
      <header className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/grading/${sheet.exam_id}`}>
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              {sheet.students.name}
              <Badge variant="outline">{sheet.students.roll_number}</Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {sheet.exams.exam_name} • {sheet.exams.subject}
            </p>
          </div>
        </div>
<div className="flex items-center gap-2">
          <PlagiarismBadge 
            score={plagiarismData?.combined_score ?? null} 
            matchedPeers={plagiarismData?.matched_peers} 
          />
          <Badge
            variant={sheet.status === "approved" ? "default" : sheet.status === "graded" ? "secondary" : "outline"}
          >
            {sheet.status.toUpperCase()}
          </Badge>
        </div>
      </header>

      <GradingInterface sheet={sheet} initialEvaluations={evaluations || []} />
    </div>
  )
}
