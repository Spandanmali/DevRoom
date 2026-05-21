import React, { useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface InterviewerViewProps {
  roomId: string;
  session: any;
  timeLeft: number;
  tabSwitches: { timestamp: string; candidateName: string }[];
  code: string;
  language: string;
  onEndSession: () => void;
  candidateName: string;
}

export default function InterviewerView({
  roomId,
  session,
  timeLeft,
  tabSwitches,
  code,
  language,
  onEndSession,
  candidateName,
}: InterviewerViewProps) {
  const [notes, setNotes] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    const savedNotes = localStorage.getItem(`devroom-notes-${roomId}`);
    if (savedNotes) setNotes(savedNotes);
  }, [roomId]);

  useEffect(() => {
    const saveNotes = () => {
      localStorage.setItem(`devroom-notes-${roomId}`, notes);
    };
    const timeout = setTimeout(saveNotes, 2000);
    return () => clearTimeout(timeout);
  }, [notes, roomId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleEndClick = () => {
    onEndSession();
    setShowEndConfirm(false);
  };

  return (
    <div className="h-full w-full flex bg-background text-foreground overflow-hidden">
      
      {/* LEFT PANEL - PRIVATE NOTES */}
      <div className="w-[25%] flex flex-col border-r border-border bg-muted/10">
        <div className="p-4 border-b border-border font-semibold">
          <h2>Interviewer Notes</h2>
        </div>
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
          <textarea
            className="flex-1 bg-muted/20 border border-border rounded-md p-4 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Add your observations here..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="h-1/3 flex flex-col border border-border rounded-md bg-muted/20">
            <div className="p-3 border-b border-border font-semibold text-sm">
              Candidate Activity
            </div>
            <div className="flex-1 overflow-auto p-3 text-sm">
              {tabSwitches.length === 0 ? (
                <div className="text-muted-foreground italic">No unusual activity detected.</div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-red-500 font-semibold mb-2">
                    Total tab switches: {tabSwitches.length}
                  </div>
                  {tabSwitches.map((ts, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-red-400 text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{ts.timestamp} - Tab switch detected</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER PANEL - EDITOR */}
      <div className="w-[50%] flex flex-col border-r border-border">
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-muted/10">
          <div className="flex items-center gap-3">
            <span className="font-semibold">{candidateName}'s Code</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Watching live
            </div>
          </div>
          <div className="flex items-center gap-2 font-mono bg-muted/30 px-3 py-1 rounded text-sm">
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <Editor
            height="100%"
            language={language === "javascript-node" ? "javascript" : language === "python3" ? "python" : language}
            theme="vs-dark"
            value={code}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </div>
      </div>

      {/* RIGHT PANEL - PROBLEM & CONTROLS */}
      <div className="w-[25%] flex flex-col bg-muted/10">
        <div className="p-4 border-b border-border font-semibold">
          <h2>Problem Statement</h2>
        </div>
        <div className="flex-1 overflow-auto p-6 whitespace-pre-wrap text-sm">
          {session?.problem_statement || "Loading problem..."}
        </div>
        
        <div className="p-6 border-t border-border flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Time Remaining</div>
            <div className={`text-4xl font-mono font-bold ${timeLeft < 120 ? 'text-red-500' : 'text-foreground'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          
          <Button 
            onClick={() => setShowEndConfirm(true)} 
            variant="destructive"
            className="w-full"
          >
            End Session
          </Button>
        </div>
      </div>

      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End interview and generate AI evaluation?</DialogTitle>
            <DialogDescription>
              This will stop the timer for the candidate and finalize the code for AI review.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleEndClick}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}