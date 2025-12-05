"use client"

import { useState } from "react"
import { Camera, Mail, Shield, Settings, Lock, Key, Edit2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { ToggleSwitch } from "@/components/ui/toggle-switch"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifs: true,
    pushNotifs: false,
    darkMode: true,
    twoFactor: true,
    publicProfile: false,
  })

  const toggleSetting = (key: keyof typeof settings) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Profile & Bio */}
        <div className="lg:col-span-1 space-y-8">
          <GlassCard className="p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-cyan-900/20 to-transparent"></div>

            <div className="relative mb-6">
              <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-4xl text-white shadow-2xl shadow-purple-500/30 border-2 border-white/10">
                SK
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg transition-transform hover:scale-110">
                <Camera size={16} />
              </button>
            </div>

            <h3 className="text-2xl font-display font-bold text-white tracking-wide">Showmik Kumaar</h3>
            <p className="text-cyan-400 text-sm font-mono mt-1 mb-6">Administrator</p>

            <div className="w-full space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-left">
                <Mail size={18} className="text-slate-400" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Email</span>
                  <span className="text-sm text-slate-200 truncate">kumaarsk465@gmail.com</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-left">
                <Shield size={18} className="text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Role</span>
                  <span className="text-sm text-slate-200">Super Admin</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Col: Settings Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Preferences */}
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Settings size={20} className="text-cyan-400" />
              <h3 className="text-xl font-display font-bold text-white">System Preferences</h3>
            </div>

            <div className="space-y-2">
              <ToggleSwitch
                label="Email Notifications"
                checked={settings.emailNotifs}
                onChange={() => toggleSetting("emailNotifs")}
              />
              <ToggleSwitch
                label="Push Notifications"
                checked={settings.pushNotifs}
                onChange={() => toggleSetting("pushNotifs")}
              />
              <ToggleSwitch
                label="Public Profile Visibility"
                checked={settings.publicProfile}
                onChange={() => toggleSetting("publicProfile")}
              />
              <ToggleSwitch
                label="Dark Mode (System Default)"
                checked={settings.darkMode}
                onChange={() => toggleSetting("darkMode")}
              />
            </div>
          </GlassCard>

          {/* Security Section */}
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Lock size={20} className="text-purple-400" />
              <h3 className="text-xl font-display font-bold text-white">Security & API</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Gemini API Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Key size={16} className="text-slate-500" />
                    </div>
                    <input
                      type="password"
                      value="AIzaSy...XyZ"
                      disabled
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-slate-400 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors">
                    Rotate
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white">Two-Factor Authentication</h4>
                    <p className="text-xs text-slate-500 mt-1">Secure your account with 2FA.</p>
                  </div>
                  <ToggleSwitch label="" checked={settings.twoFactor} onChange={() => toggleSetting("twoFactor")} />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end">
                <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-xl shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2">
                  <Edit2 size={16} /> Save Changes
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
