import React, { useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import { Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

interface CandidateViewProps {
  session: any;
  timeLeft: number;
  tabSwitchCount: number;
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
}

export default function CandidateView({
  session,
  timeLeft,
  tabSwitchCount,
  code,
  onCodeChange,
  language,
  onLanguageChange,
}: CandidateViewProps) {
  const [output, setOutput] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  const [prevTabSwitchCount, setPrevTabSwitchCount] = useState(tabSwitchCount);

  useEffect(() => {
    if (tabSwitchCount > prevTabSwitchCount) {
      setShowWarning(true);
      setPrevTabSwitchCount(tabSwitchCount);
    }
  }, [tabSwitchCount, prevTabSwitchCount]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (timeLeft < 120) return "text-red-500 animate-pulse";
    if (timeLeft < 300) return "text-yellow-500";
    return "text-green-500";
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);
    setError("");

    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/code/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authSession?.access_token}`,
        },
        body: JSON.stringify({
          script: code,
          language,
          stdin: "",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Execution failed");
        setOutput({
          statusCode: data.statusCode || 500,
          output: data.error || data.message || "Execution failed",
        });
      } else {
        setOutput(data);
      }
    } catch (err: any) {
      setError(err.message || "Network error occurred");
      setOutput({ statusCode: 500, output: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full w-full flex bg-background text-foreground overflow-hidden">
      
      {/* LEFT PANEL */}
      <div className="w-[30%] flex flex-col border-r border-border bg-muted/20">
        <div className="p-4 border-b border-border font-semibold flex items-center justify-between">
          <h2>Problem</h2>
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        </div>
        <div className="flex-1 overflow-auto p-6 whitespace-pre-wrap text-sm">
          {session?.problem_statement || "Loading problem..."}
        </div>
        
        {/* Timer Section */}
        <div className="p-6 border-t border-border flex flex-col items-center justify-center">
          <div className={`text-5xl font-mono font-bold ${getTimeColor()}`}>
            {formatTime(timeLeft)}
          </div>
          {tabSwitchCount > 0 && (
            <div className="mt-4 text-red-500 flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-5 h-5" />
              Tab switches: {tabSwitchCount}
            </div>
          )}
        </div>
      </div>

      {/* CENTER PANEL */}
      <div className="w-[70%] flex flex-col h-full">
        {/* TOP BAR */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-muted/10">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="font-semibold">Interview in Progress</span>
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={language} 
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-background border border-border rounded px-3 py-1.5 text-sm"
            >
              <option value="javascript-node">JavaScript</option>
              <option value="python3">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>

            <Button 
              onClick={handleRunCode} 
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              size="sm"
            >
              <Play className="w-4 h-4" />
              {isRunning ? "Running..." : "Run Code"}
            </Button>
          </div>
        </div>

        {/* EDITOR */}
        <div className="flex-1 overflow-hidden relative">
          <Editor
            height="100%"
            language={language === "javascript-node" ? "javascript" : language === "python3" ? "python" : language}
            theme="vs-dark"
            value={code}
            onChange={(val) => onCodeChange(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </div>

        {/* OUTPUT PANEL */}
        <div className="h-[30%] border-t border-border bg-muted/30 flex flex-col">
          <div className="px-4 py-2 border-b border-border font-semibold text-sm">Output</div>
          <div className="flex-1 overflow-auto p-4 font-mono text-sm whitespace-pre-wrap">
            {error && <div className="text-red-500 mb-2">{error}</div>}
            {output?.output ? (
              <div className={output.statusCode !== 200 ? "text-red-400" : "text-green-400"}>
                {output.output}
              </div>
            ) : (
              <div className="text-muted-foreground">Run code to see output...</div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-6 h-6" /> Tab Switch Detected
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Your interviewer has been notified. Please stay on this tab during the interview.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowWarning(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}