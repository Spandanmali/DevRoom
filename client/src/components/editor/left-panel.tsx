"use client"

import { useState } from "react"
import { Send, Bot, Bug, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Chat from "@/components/Chat"

interface User {
  id: string
  name: string
  color: string
  isOnline: boolean
  isCurrentUser?: boolean
}

interface LeftPanelProps {
  users: User[]
  socket: any
  roomId: string
  onAIReview: () => void
  onAIFix: () => void
}

export function LeftPanel({
  users,
  socket,
  roomId,
  onAIReview,
  onAIFix,
}: LeftPanelProps) {
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
      <Chat socket={socket} roomId={roomId} currentUser={users.find(u => u.isCurrentUser)} />

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
