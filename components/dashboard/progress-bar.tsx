import { Progress } from "@/components/ui/progress"

interface ProgressBarProps {
  value: number
  label?: string
}

export function ProgressBar({ value, label = "Completion" }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{Math.max(0, Math.min(100, value))}%</span>
      </div>
      <Progress value={value} />
    </div>
  )
}
