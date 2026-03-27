"use client"

import { useState } from "react"
import { Loader2, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

type RightPanelView = "output" | "ai-review" | "whiteboard" | "interview"

interface RightPanelProps {
  view: RightPanelView
  output: string
  error: string
  input: string
  onInputChange: (input: string) => void
  isRunning: boolean
}

// Mock AI review data
const MOCK_AI_REVIEW = {
  bugs: [
    "Recursive fibonacci implementation has exponential time complexity O(2^n)",
    "No input validation for negative numbers in fibonacci function",
  ],
  performance: [
    "Consider using memoization or dynamic programming for fibonacci",
    "Array.map creates a new array - consider using for loop for large datasets",
  ],
  suggestions: [
    "Add JSDoc comments for better documentation",
    "Consider adding TypeScript types for better type safety",
    "Extract the API URL to a constant or environment variable",
  ],
}

export function RightPanel({
  view,
  output,
  error,
  input,
  onInputChange,
  isRunning,
}: RightPanelProps) {
  const [interviewMode, setInterviewMode] = useState(false)
  const [timerDuration, setTimerDuration] = useState(45)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState("00:45:00")
  const [isAILoading, setIsAILoading] = useState(false)

  // Simulate AI loading when opening AI review
  useState(() => {
    if (view === "ai-review") {
      setIsAILoading(true)
      setTimeout(() => setIsAILoading(false), 1500)
    }
  })

  return (
    <div className="w-[300px] border-l border-border bg-card flex flex-col">
      {/* Output View */}
      {view === "output" && (
        <div className="flex-1 flex flex-col p-3 gap-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Output
          </h3>
          
          {/* Input */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Input (stdin)</Label>
            <Textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Enter input..."
              className="h-20 bg-input border-border text-foreground text-sm font-mono resize-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Output */}
          <div className="flex-1 flex flex-col space-y-2 min-h-0">
            <Label className="text-xs text-muted-foreground">Output (stdout)</Label>
            <ScrollArea className="flex-1 min-h-0">
              <div className="bg-input border border-border p-2 min-h-[100px] font-mono text-sm">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running...
                  </div>
                ) : output ? (
                  <pre className="text-[#22c55e] whitespace-pre-wrap">{output}</pre>
                ) : (
                  <span className="text-muted-foreground">No output</span>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Error */}
          {error && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Error (stderr)</Label>
              <div className="bg-input border border-border p-2 font-mono text-sm">
                <pre className="text-destructive whitespace-pre-wrap">{error}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Review View */}
      {view === "ai-review" && (
        <div className="flex-1 flex flex-col p-3 gap-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            AI Code Review
          </h3>

          {isAILoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-16 w-full bg-muted" />
              <Skeleton className="h-4 w-32 bg-muted" />
              <Skeleton className="h-16 w-full bg-muted" />
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                {/* Bugs */}
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    Bugs Found
                  </h4>
                  <ul className="space-y-2">
                    {MOCK_AI_REVIEW.bugs.map((bug, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4">
                        {bug}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Performance */}
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                    Performance Issues
                  </h4>
                  <ul className="space-y-2">
                    {MOCK_AI_REVIEW.performance.map((issue, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                    Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {MOCK_AI_REVIEW.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-xs text-muted-foreground pl-4">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Whiteboard View */}
      {view === "whiteboard" && (
        <div className="flex-1 flex flex-col p-3 gap-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Whiteboard
          </h3>
          <div className="flex-1 border border-border border-dashed flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center px-4">
              Whiteboard — Excalidraw will load here
            </p>
          </div>
        </div>
      )}

      {/* Interview Mode View */}
      {view === "interview" && (
        <div className="flex-1 flex flex-col p-3 gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Interview Mode
            </h3>
            <div className="flex items-center gap-2">
              <Switch
                id="interview-mode"
                checked={interviewMode}
                onCheckedChange={setInterviewMode}
              />
              <Label htmlFor="interview-mode" className="text-xs text-muted-foreground">
                {interviewMode ? "ON" : "OFF"}
              </Label>
            </div>
          </div>

          {interviewMode && (
            <>
              {/* Problem Statement */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Problem Statement</Label>
                <Textarea
                  placeholder="Paste the interview problem here..."
                  className="h-32 bg-input border-border text-foreground text-sm resize-none placeholder:text-muted-foreground"
                />
              </div>

              {/* Timer */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Timer</Label>
                <div className="text-3xl font-mono text-foreground text-center">
                  {timeRemaining}
                </div>
                
                {/* Duration Pills */}
                <div className="flex justify-center gap-2">
                  {[30, 45, 60].map((duration) => (
                    <button
                      key={duration}
                      onClick={() => {
                        setTimerDuration(duration)
                        setTimeRemaining(`00:${duration}:00`)
                      }}
                      className={`px-3 py-1 text-xs border ${
                        timerDuration === duration
                          ? "bg-foreground text-background border-foreground"
                          : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                      }`}
                    >
                      {duration} min
                    </button>
                  ))}
                </div>

                {/* Timer Controls */}
                <div className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTimerRunning(!timerRunning)}
                    className="border-border hover:bg-accent"
                  >
                    {timerRunning ? (
                      <>
                        <Square className="h-3.5 w-3.5 mr-1" fill="currentColor" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 mr-1" fill="currentColor" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* End Session Button */}
              <Button
                variant="destructive"
                className="mt-auto bg-destructive hover:bg-destructive/90"
              >
                End Session & Evaluate
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
