"use client"

import { Switch } from "@/components/ui/switch"
import { Zap, Trophy } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function ChallengeModeToggle({
    initialState,
    studentId
}: {
    initialState: boolean
    studentId: string
}) {
    const [enabled, setEnabled] = useState(initialState)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const handleToggle = async (checked: boolean) => {
        setEnabled(checked)
        setLoading(true)
        try {
            const { error } = await supabase
                .from("students")
                .update({ challenge_mode: checked })
                .eq("id", studentId)

            if (error) throw error
        } catch (err) {
            console.error("Failed to update challenge mode", err)
            setEnabled(!checked) // Revert
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-full px-4 py-2">
            <div className={`p-1.5 rounded-full ${enabled ? 'bg-neon-purple text-black' : 'bg-white/10 text-muted-foreground'}`}>
                {enabled ? <Trophy size={14} /> : <Zap size={14} />}
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">
                    {enabled ? "Challenge Mode" : "Standard Mode"}
                </span>
            </div>
            <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={loading}
                className="data-[state=checked]:bg-neon-purple"
            />
        </div>
    )
}
