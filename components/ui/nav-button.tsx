"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

interface NavButtonProps {
    id: string
    activeId: string
    icon: LucideIcon
    label: string
    onClick?: (id: string) => void
    href?: string
    isMobile?: boolean
}

export const NavButton = ({ id, activeId, icon: Icon, label, onClick, href, isMobile = false }: NavButtonProps) => {
    const isActive = activeId === id

    const content = (
        <>
            {/* Active Indicator Bar - Adjusted for icon-only mode */}
            {isActive && (
                <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-emerald-400 rounded-r-full shadow-[0_0_15px_rgba(34,211,238,0.8)] z-30"
                />
            )}

            {/* Background Highlight */}
            {isActive && (
                <motion.div
                    layoutId="nav-bg"
                    className="absolute inset-0 holographic-active rounded-xl border border-white/5"
                    transition={{ duration: 0.3 }}
                />
            )}

            {/* Hover background for non-active items */}
            {!isActive && (
                <div className="absolute inset-0 bg-white/0 group-hover/btn:bg-white/5 transition-colors duration-300 rounded-xl" />
            )}

            {/* Icon Container - FIXED WIDTH to match collapsed sidebar width (w-20 minus padding) */}
            <div className="w-16 h-14 flex items-center justify-center flex-shrink-0 relative z-20">
                <Icon
                    size={22}
                    className={`transition-transform duration-300 ${isActive ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] scale-110" : ""}`}
                />
            </div>

            {/* Label - Hidden by default, visible on hover */}
            <span
                className={`relative z-20 text-sm font-display font-semibold tracking-wider whitespace-nowrap ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-300 delay-75 pl-1 ${isActive ? "text-white shadow-black drop-shadow-sm" : ""}`}
            >
                {label}
            </span>
        </>
    )

    const className = `relative flex flex-row items-center justify-start rounded-xl transition-all duration-300 w-full h-14 mb-1 overflow-hidden group/btn ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`

    if (href) {
        return (
            <Link href={href} className={className} onClick={() => onClick && onClick(id)}>
                {content}
            </Link>
        )
    }

    return (
        <button onClick={() => onClick && onClick(id)} className={className}>
            {content}
        </button>
    )
}
