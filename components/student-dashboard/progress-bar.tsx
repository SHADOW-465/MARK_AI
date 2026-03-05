interface ProgressBarProps {
  value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <progress className="h-full w-full appearance-none [&::-webkit-progress-bar]:bg-border [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary" value={clamped} max={100} />
      </div>
      <p className="text-xs font-medium text-muted-foreground">{clamped}% completed</p>
    </div>
  )
}
