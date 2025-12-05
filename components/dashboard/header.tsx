"use client"

import { Bell, User } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
    userName: string
    userInitials: string
}

export const Header = ({ userName, userInitials }: HeaderProps) => {
    return (
        <header className="hidden lg:flex items-center justify-between py-4 px-8 sticky top-0 z-40 bg-background/50 backdrop-blur-sm border-b border-border/40">
            {/* Left side - Welcome Message or Breadcrumbs (optional, kept simple for now) */}
            <div>
                 {/* Placeholder for potential breadcrumbs or page title if needed */}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-4">
                <ThemeToggle />

                <button className="relative p-2 rounded-full hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-foreground">{userName}</span>
                        <span className="text-xs text-muted-foreground">Admin</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
                        {userInitials}
                    </div>
                </div>
            </div>
        </header>
    )
}
