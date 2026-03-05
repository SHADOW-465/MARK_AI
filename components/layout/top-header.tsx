"use client"

import { LanguageSwitcher } from "@/components/language-switcher"
import { Bell, Search, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TopHeaderProps {
    onMenuClick?: () => void
}

export function TopHeader({ onMenuClick }: TopHeaderProps) {
    return (
        <header className="h-20 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between transition-all">
            <div className="flex items-center gap-4">
                {onMenuClick && (
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                        <Menu className="h-5 w-5" />
                    </Button>
                )}

                {/* Search Bar - Aesthetic only for now */}
                <div className="hidden sm:flex items-center bg-secondary rounded-full px-4 py-2 border border-border/50 w-64 md:w-80 focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all">
                    <Search size={16} className="text-muted-foreground mr-2" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder-muted-foreground"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
                <LanguageSwitcher />
                <button className="relative p-2.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-background"></span>
                </button>
            </div>
        </header>
    )
}
