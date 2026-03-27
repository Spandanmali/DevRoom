"use client"

import { Terminal, Bot, Pencil, Timer } from "lucide-react"
import { cn } from "@/lib/utils"

type RightPanelView = "output" | "ai-review" | "whiteboard" | "interview" | null

interface RightPanelToggleProps {
  activeView: RightPanelView
  onToggle: (view: RightPanelView) => void
}

const PANEL_ITEMS = [
  { id: "output" as const, icon: Terminal, label: "Output" },
  { id: "ai-review" as const, icon: Bot, label: "AI Review" },
  { id: "whiteboard" as const, icon: Pencil, label: "Whiteboard" },
  { id: "interview" as const, icon: Timer, label: "Interview Mode" },
]

export function RightPanelToggle({ activeView, onToggle }: RightPanelToggleProps) {
  return (
    <div className="w-10 border-l border-border bg-card flex flex-col items-center py-2 gap-1">
      {PANEL_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeView === item.id

        return (
          <button
            key={item.id}
            onClick={() => onToggle(item.id)}
            title={item.label}
            className={cn(
              "h-8 w-8 flex items-center justify-center transition-colors",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
