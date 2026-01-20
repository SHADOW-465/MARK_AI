import { createClient } from "@/lib/supabase/client"
import { ChatInterface } from "./chat-interface"

export default async function MessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <div>Please log in</div>

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-white">
          Messages
        </h1>
        <p className="text-muted-foreground">Communicate with students.</p>
      </div>

      <ChatInterface currentUserId={user.id} />
    </div>
  )
}
