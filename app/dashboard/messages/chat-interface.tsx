"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Search, User, MoreVertical, Phone, Video } from "lucide-react"

interface Contact {
    id: string
    name: string
    role: string
    email: string
    lastMessage?: string
    lastMessageTime?: string
    unreadCount?: number
}

interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    read: boolean
}

export function ChatInterface({ currentUserId }: { currentUserId: string }) {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Fetch contacts (mock for now, should be real students/parents)
    useEffect(() => {
        const fetchContacts = async () => {
            // In a real app, we'd fetch students/parents related to the teacher
            // For now, we'll fetch all users except current one
            const { data: students } = await supabase.from("students").select("id, name, roll_number")

            if (students) {
                const formattedContacts = students.map(s => ({
                    id: s.id, // Note: This assumes student ID matches auth ID, which might not be true. 
                    // In a real app, we need to link student records to auth users.
                    // For this demo, we might need a different approach if auth is separate.
                    name: s.name,
                    role: "Student",
                    email: `Roll: ${s.roll_number}`,
                }))
                setContacts(formattedContacts)
            }
            setIsLoading(false)
        }
        fetchContacts()
    }, [])

    // Fetch messages when contact is selected
    useEffect(() => {
        if (!selectedContact) return

        const fetchMessages = async () => {
            const { data } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUserId})`)
                .order("created_at", { ascending: true })

            if (data) setMessages(data)
        }

        fetchMessages()

        // Real-time subscription
        const channel = supabase
            .channel("messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUserId}))`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedContact, currentUserId])

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedContact) return

        const msg = {
            sender_id: currentUserId,
            receiver_id: selectedContact.id,
            content: newMessage,
        }

        // Optimistic update
        const tempId = Math.random().toString()
        setMessages((prev) => [
            ...prev,
            { ...msg, id: tempId, created_at: new Date().toISOString(), read: false },
        ])
        setNewMessage("")

        const { error } = await supabase.from("messages").insert(msg)
        if (error) {
            console.error("Error sending message:", error)
            // Revert optimistic update if needed
        }
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] rounded-2xl overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md shadow-2xl">
            {/* Sidebar */}
            <div className="w-80 border-r border-white/10 flex flex-col bg-white/5">
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search messages..."
                            className="pl-9 bg-black/20 border-white/10 focus:border-cyan-500/50"
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {contacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedContact?.id === contact.id
                                        ? "bg-cyan-500/20 border border-cyan-500/30"
                                        : "hover:bg-white/5 border border-transparent"
                                    }`}
                            >
                                <div className="relative">
                                    <Avatar className="h-10 w-10 border border-white/10">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`} />
                                        <AvatarFallback>{contact.name[0]}</AvatarFallback>
                                    </Avatar>
                                    {/* Online indicator */}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black"></div>
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                    <div className="flex justify-between items-center">
                                        <span className={`font-medium truncate ${selectedContact?.id === contact.id ? "text-cyan-400" : "text-slate-200"}`}>
                                            {contact.name}
                                        </span>
                                        <span className="text-[10px] text-slate-500">12:30 PM</span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate">{contact.role}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-black/10">
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border border-white/10">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedContact.name}`} />
                                    <AvatarFallback>{selectedContact.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-slate-200">{selectedContact.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-xs text-emerald-400">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                    <Phone className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                    <Video className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {messages.map((msg, i) => {
                                    const isMe = msg.sender_id === currentUserId
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[70%] p-3 rounded-2xl ${isMe
                                                        ? "bg-cyan-600 text-white rounded-tr-none shadow-lg shadow-cyan-500/20"
                                                        : "bg-white/10 text-slate-200 rounded-tl-none border border-white/10"
                                                    }`}
                                            >
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${isMe ? "text-cyan-200" : "text-slate-400"}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-white/5">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-black/20 border-white/10 focus:border-cyan-500/50"
                                />
                                <Button type="submit" size="icon" className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <User className="h-10 w-10 opacity-50" />
                        </div>
                        <p className="text-lg font-medium">Select a contact to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    )
}
