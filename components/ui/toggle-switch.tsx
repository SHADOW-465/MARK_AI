"use client"

import { motion } from "framer-motion"

interface ToggleSwitchProps {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}

export const ToggleSwitch = ({ label, checked, onChange }: ToggleSwitchProps) => (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <span className="text-sm text-slate-300">{label}</span>
        <div
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${checked ? "bg-cyan-500/20 border border-cyan-400/50" : "bg-white/10 border border-white/10"}`}
            onClick={() => onChange(!checked)}
        >
            <motion.div
                className={`w-4 h-4 rounded-full shadow-md ${checked ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee]" : "bg-slate-400"}`}
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                animate={{ x: checked ? 20 : 0 }}
            />
        </div>
    </div>
)
