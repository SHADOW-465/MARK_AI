"use client"

import { LanguageSwitcher } from "@/components/language-switcher"
import { Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "@/components/dashboard/notification-dropdown"

interface TopHeaderProps {
  onMenuClick?: () => void
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-20 border-b border-border/60 bg-background/92 px-4 backdrop-blur-xl md:px-6 xl:px-8">
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </Button>
          )}

          <div className="hidden h-11 items-center rounded-xl border border-border/70 bg-card/70 px-3 sm:flex sm:w-72 lg:w-96">
            <Search size={15} className="mr-2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search exams, students, resources..."
              className="w-full border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <NotificationDropdown />
        </div>
      </div>
    </header>
  )
}
