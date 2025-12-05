"use client"

import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, Users, MessageSquare, Settings, LogOut, CheckCircle, Menu } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { NavButton } from "@/components/ui/nav-button"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface MobileHeaderProps {
    isTeacher: boolean
    userName: string
    userEmail: string
    userInitials: string
}

export const MobileHeader = ({ isTeacher, userName, userEmail, userInitials }: MobileHeaderProps) => {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    // Determine active view based on pathname
    const getActiveId = () => {
        if (pathname === "/dashboard") return "overview"
        if (pathname.includes("/dashboard/exams")) return "exams"
        if (pathname.includes("/dashboard/grading")) return "grading"
        if (pathname.includes("/dashboard/students")) return "students"
        if (pathname.includes("/dashboard/results")) return "results"
        if (pathname.includes("/dashboard/messages")) return "messages"
        if (pathname.includes("/dashboard/settings")) return "settings"
        return "overview"
    }

    const activeId = getActiveId()

    return (
        <header className="p-6 flex justify-between items-center sticky top-0 z-40 bg-[#022c22]/80 backdrop-blur-xl lg:hidden border-b border-white/10 shadow-lg">
            <div className="flex items-center gap-2">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="mr-2 text-slate-300">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="bg-[#022c22] border-r border-white/10 text-slate-200 p-0">
                        <div className="flex flex-col h-full">
                            <div className="p-6">
                                <Logo />
                            </div>
                            <div className="flex flex-col px-2 gap-1">
                                <NavButton id="overview" activeId={activeId} href="/dashboard" icon={LayoutDashboard} label="Overview" isMobile={true} onClick={() => setOpen(false)} />

                                {isTeacher ? (
                                    <>
                                        <NavButton id="exams" activeId={activeId} href="/dashboard/exams" icon={FileText} label="Exams" isMobile={true} onClick={() => setOpen(false)} />
                                        <NavButton id="grading" activeId={activeId} href="/dashboard/grading" icon={CheckCircle} label="Grading" isMobile={true} onClick={() => setOpen(false)} />
                                        <NavButton id="students" activeId={activeId} href="/dashboard/students" icon={Users} label="Students" isMobile={true} onClick={() => setOpen(false)} />
                                    </>
                                ) : (
                                    <NavButton id="results" activeId={activeId} href="/dashboard/results" icon={FileText} label="Results" isMobile={true} onClick={() => setOpen(false)} />
                                )}

                                <NavButton id="messages" activeId={activeId} href="/dashboard/messages" icon={MessageSquare} label="Messages" isMobile={true} onClick={() => setOpen(false)} />
                                <NavButton id="settings" activeId={activeId} href="/dashboard/settings" icon={Settings} label="Settings" isMobile={true} onClick={() => setOpen(false)} />
                            </div>

                            {/* Bottom Profile Section */}
                            <div className="mt-auto p-4 border-t border-white/5">
                                <div className="flex items-center justify-between p-2.5 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg flex-shrink-0">{userInitials}</div>
                                        <div className="flex flex-col overflow-hidden min-w-0">
                                            <span className="text-sm font-bold text-white leading-none truncate">{userName}</span>
                                            <span className="text-[10px] text-slate-400 mt-1 truncate">{userEmail}</span>
                                        </div>
                                    </div>

                                    <form action="/auth/sign-out" method="post">
                                        <button className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Sign Out">
                                            <LogOut size={16} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
                <Logo />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">{userInitials}</div>
        </header>
    )
}
