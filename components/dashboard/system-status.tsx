import { Activity, Server, Zap, Database } from "lucide-react"

export function SystemStatus() {
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center">
                <Server className="h-5 w-5 text-emerald-400 mb-2" />
                <span className="text-xs text-slate-400">System Status</span>
                <span className="text-sm font-bold text-emerald-400">Online</span>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center text-center">
                <Zap className="h-5 w-5 text-cyan-400 mb-2" />
                <span className="text-xs text-slate-400">AI Latency</span>
                <span className="text-sm font-bold text-cyan-400">45ms</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-center">
                <Database className="h-5 w-5 text-amber-400 mb-2" />
                <span className="text-xs text-slate-400">Storage</span>
                <span className="text-sm font-bold text-amber-400">24% Used</span>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center text-center">
                <Activity className="h-5 w-5 text-purple-400 mb-2" />
                <span className="text-xs text-slate-400">Daily Scans</span>
                <span className="text-sm font-bold text-purple-400">1,240</span>
            </div>
        </div>
    )
}
