"use client"

import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NotificationDropdownProps {
  items?: { id: string; title: string; time: string }[]
}

const DEFAULT_ITEMS = [
  { id: "n1", title: "New submissions awaiting review", time: "2m ago" },
  { id: "n2", title: "AI guide session completed", time: "18m ago" },
  { id: "n3", title: "Upcoming exam reminder", time: "1h ago" },
]

export function NotificationDropdown({ items = DEFAULT_ITEMS }: NotificationDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/70 text-muted-foreground transition-colors hover:text-foreground">
        <Bell size={18} />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[290px] rounded-xl border-border/70 bg-popover/98 p-2">
        <DropdownMenuLabel className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={item.id} className="flex cursor-pointer flex-col items-start gap-0.5 rounded-lg p-3">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <span className="text-xs text-muted-foreground">{item.time}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
