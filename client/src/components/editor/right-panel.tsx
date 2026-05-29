"use client"

import { useState } from "react"
import { Loader2, Play, Square, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import AIReview from "@/components/AIReview"
import OutputPanel from "./OutputPanel"

type RightPanelView = "output" | "ai-review" | "whiteboard" | "interview"

interface RightPanelProps {
  view: RightPanelView
  output: any // Modifying this to accept string or object
  error: string
  input: string
  onInputChange: (input: string) => void
  isRunning: boolean
  code: string
  language: string
  onClose?: () => void
}

export function RightPanel({
  view,
  output,
  error,
  input,
  onInputChange,
  isRunning,
  code,
  language,
  onClose,
}: RightPanelProps) {
  const [interviewMode, setInterviewMode] = useState(false)
  const [timerDuration, setTimerDuration] = useState(45)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState("00:45:00")

  return (
    <div className="w-full h-full border-l border-border bg-[#111111] flex flex-col relative">
      {onClose && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 h-6 w-6 z-10 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      {/* Output View */}
      {view === "output" && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* We wrap the OutputPanel in a flex container. We still keep the stdin textarea above it. */}
          <div className="p-3 border-b border-[#222222] bg-[#161616]">
             <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Input (stdin)</Label>
             <Textarea
               value={input}
               onChange={(e) => onInputChange(e.target.value)}
               placeholder="Enter input..."
               className="h-16 bg-black border-[#222222] text-foreground text-sm font-mono resize-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-green-500/50"
             />
          </div>
          <div className="flex-1 overflow-hidden">
             {/* Pass down props to our custom OutputPanel. Note: onRun is handled by navbar, so we can omit it here or pass a mock if needed.
                 We also need to shape `output` as an object for OutputPanel. */}
             <OutputPanel 
               isRunning={isRunning} 
               output={typeof output === 'object' ? output : { stdout: output, stderr: error, status: 'Finished' }} 
             />
          </div>
        </div>
      )}

      {/* AI Review View */}
      {view === "ai-review" && (
        <div className="flex-1 flex flex-col p-3 gap-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            AI Code Review
          </h3>

          <AIReview code={code} language={language} />
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
