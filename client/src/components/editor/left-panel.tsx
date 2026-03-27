"use client"

import { useState } from "react"
import { Send, Bot, Bug, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface User {
  id: string
  name: string
  color: string
  isOnline: boolean
  isCurrentUser?: boolean
}

interface Message {
  id: string
  userId: string
  username: string
  color: string
  message: string
  time: string
}

interface LeftPanelProps {
  users: User[]
  messages: Message[]
  onSendMessage: (message: string) => void
  onAIReview: () => void
  onAIFix: () => void
}

export function LeftPanel({
  users,
  messages,
  onSendMessage,
  onAIReview,
  onAIFix,
}: LeftPanelProps) {
  const [newMessage, setNewMessage] = useState("")

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-[280px] border-r border-border bg-card flex flex-col">
      {/* Users Section */}
      <div className="p-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Users
        </h3>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: user.isOnline ? "#22c55e" : "#888" }}
              />
              <span className="text-sm text-foreground">{user.name}</span>
              <div
                className="h-3 w-3 rounded-full ml-auto"
                style={{ backgroundColor: user.color }}
                title="Cursor color"
              />
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-border" />

      {/* Chat Section */}
      <div className="flex-1 flex flex-col min-h-0 p-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Chat
        </h3>
        
        <ScrollArea className="flex-1 -mx-3 px-3">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium" style={{ color: msg.color }}>
                    {msg.username}
                  </span>
                  <span className="text-xs text-muted-foreground">{msg.time}</span>
                </div>
                <p className="text-foreground mt-0.5">{msg.message}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 mt-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 h-8 bg-input border-border text-foreground text-sm placeholder:text-muted-foreground"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSend}
            className="h-8 w-8 hover:bg-accent"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* AI Assistant Section */}
      <div className="p-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Bot className="h-3.5 w-3.5" />
          AI Assistant
        </h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-8 justify-start border-border hover:bg-accent text-sm gap-2"
            onClick={onAIReview}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Review Code
          </Button>
          <Button
            variant="outline"
            className="w-full h-8 justify-start border-border hover:bg-accent text-sm gap-2"
            onClick={onAIFix}
          >
            <Bug className="h-3.5 w-3.5" />
            Fix Bug
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Powered by Gemini</p>
      </div>
    </div>
  )
}
