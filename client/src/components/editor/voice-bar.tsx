"use client"

import { useState } from "react"
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  color: string
  isOnline: boolean
  isCurrentUser?: boolean
}

interface VoiceBarProps {
  users: User[]
}

export function VoiceBar({ users }: VoiceBarProps) {
  const [isJoined, setIsJoined] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Simulate users in voice (when joined)
  const voiceUsers = isJoined ? users.filter((u) => !u.isCurrentUser) : []

  return (
    <div className="h-10 border-t border-border bg-card flex items-center px-4 gap-3">
      {/* Voice Label */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Volume2 className="h-4 w-4" />
        <span className="text-xs">Voice</span>
      </div>

      {!isJoined ? (
        /* Join Voice Button */
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsJoined(true)}
          className="h-7 text-xs border-border hover:bg-accent"
        >
          <Phone className="h-3.5 w-3.5 mr-1.5" />
          Join Voice
        </Button>
      ) : (
        <>
          {/* Voice Users */}
          <div className="flex items-center -space-x-1">
            {voiceUsers.map((user) => (
              <div
                key={user.id}
                className="h-6 w-6 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-medium text-white"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>

          {/* Mute Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "h-7 w-7 p-0",
              isMuted ? "text-destructive hover:text-destructive" : "text-foreground hover:text-foreground"
            )}
          >
            {isMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          {/* Leave Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsJoined(false)}
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
          >
            <PhoneOff className="h-3.5 w-3.5 mr-1.5" />
            Leave
          </Button>
        </>
      )}
    </div>
  )
}
