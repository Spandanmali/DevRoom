"use client"

import { useState } from "react"
import { Send, Bot, Bug, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import Chat from "@/components/Chat"

interface User {
  id: string
  name: string
  color: string
  isOnline: boolean
  isCurrentUser?: boolean
  isOwner?: boolean
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
    <div className="w-full h-full border-r border-border bg-card flex flex-col">
      <ResizablePanelGroup direction="vertical">
        {/* Users Section */}
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="p-3 h-full flex flex-col">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 shrink-0">
              Users
            </h3>
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: user.isOnline ? "#22c55e" : "#888" }}
                    />
                    <span className="text-sm text-foreground truncate">{user.name}</span>
                    {user.isOwner && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-1 shrink-0">
                        Owner
                      </span>
                    )}
                    <div
                      className="h-3 w-3 rounded-full ml-auto shrink-0"
                      style={{ backgroundColor: user.color }}
                      title="Cursor color"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Chat Section */}
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="h-full flex flex-col">
            <Chat socket={socket} roomId={roomId} currentUser={users.find(u => u.isCurrentUser)} />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* AI Assistant Section */}
        <ResizablePanel defaultSize={20} minSize={15}>
          <div className="p-3 h-full flex flex-col">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2 shrink-0">
              <Bot className="h-3.5 w-3.5" />
              AI Assistant
            </h3>
            <div className="space-y-2 flex-1">
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
            <p className="text-[10px] text-muted-foreground mt-2 shrink-0">Powered by Gemini</p>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
