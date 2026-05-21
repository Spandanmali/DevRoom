import React, { useState, useEffect } from "react";
import CandidateView from "./CandidateView";
import InterviewerView from "./InterviewerView";
import InterviewResults from "./InterviewResults";
import { supabase } from "@/lib/supabase";

interface InterviewRoomProps {
  roomId: string;
  currentUser: { id: string; name?: string };
  isHost: boolean;
  socket: any;
  onInterviewEnd: () => void;
  code: string;
  onCodeChange: (newCode: string) => void;
  language: string;
  onLanguageChange: (newLang: string) => void;
}

export default function InterviewRoom({
  roomId,
  currentUser,
  isHost,
  socket,
  onInterviewEnd,
  code,
  onCodeChange,
  language,
  onLanguageChange,
}: InterviewRoomProps) {
  const [session, setSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState<"active" | "ended">("active");
  const [evaluation, setEvaluation] = useState<string>("");
  const [tabSwitches, setTabSwitches] = useState<{timestamp: string, candidateName: string}[]>([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0); // For candidate

  // Fetch session info if joining while active
  useEffect(() => {
    let isMounted = true;
    const fetchSession = async () => {
      try {
        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();
        const token = authSession?.access_token;
        const res = await fetch(`/api/interview/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok && isMounted) {
          const data = await res.json();
          setSession(data);
          if (data.status === "completed") {
            setPhase("ended");
            setEvaluation(data.ai_evaluation || "");
          } else if (data.status === "active") {
            const startedAt = new Date(data.started_at).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((now - startedAt) / 1000);
            const remaining = data.duration_minutes * 60 - diff;
            setTimeLeft(remaining > 0 ? remaining : 0);
          }
        }
      } catch (err) {
        console.error("Failed to fetch interview session", err);
      }
    };
    fetchSession();
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // Timers and Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleTimerUpdate = ({ timeLeft: updatedTimeLeft }: { timeLeft: number }) => {
      if (!isHost) setTimeLeft(updatedTimeLeft);
    };

    const handleInterviewEnded = () => {
      // Re-fetch session to get evaluation
      const fetchEndedSession = async () => {
        const {
          data: { session: authSession },
        } = await supabase.auth.getSession();
        const token = authSession?.access_token;
        const res = await fetch(`/api/interview/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data);
          setEvaluation(data.ai_evaluation || "");
          setPhase("ended");
        }
      };
      fetchEndedSession();
    };

    const handleCandidateTabSwitch = (data: {candidateName: string, timestamp: string}) => {
      if (isHost) {
        setTabSwitches(prev => [...prev, data]);
      }
    };

    socket.on("timer-update", handleTimerUpdate);
    socket.on("interview-ended", handleInterviewEnded);
    socket.on("candidate-tab-switch", handleCandidateTabSwitch);

    return () => {
      socket.off("timer-update", handleTimerUpdate);
      socket.off("interview-ended", handleInterviewEnded);
      socket.off("candidate-tab-switch", handleCandidateTabSwitch);
    };
  }, [socket, isHost, roomId]);

  // Host Timer
  useEffect(() => {
    if (phase !== "active" || !isHost || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEndSession();
          return 0;
        }
        if (socket) {
          socket.emit("timer-sync", { roomId, timeLeft: prev - 1 });
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, isHost, roomId, socket, timeLeft]);

  // Candidate Tab Switch Detection
  useEffect(() => {
    if (phase !== "active" || isHost) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        // We will show warning in CandidateView based on count/triggers
        socket.emit("tab-switch", {
          roomId,
          candidateName: currentUser?.name || "Candidate",
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [phase, isHost, roomId, currentUser, socket]);

  const handleEndSession = async () => {
    if (!session) return;
    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      const res = await fetch("/api/interview/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: session.id,
          finalCode: code,
          language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvaluation(data.evaluation);
        setPhase("ended");
        if (socket) {
          socket.emit("end-interview", { roomId });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseResults = () => {
    onInterviewEnd();
  };

  if (phase === "ended") {
    return (
      <InterviewResults 
        session={session} 
        evaluation={evaluation} 
        isHost={isHost} 
        onClose={handleCloseResults} 
        code={code}
        tabSwitches={tabSwitches}
        roomId={roomId}
      />
    );
  }

  if (isHost) {
    return (
      <InterviewerView
        roomId={roomId}
        session={session}
        timeLeft={timeLeft}
        tabSwitches={tabSwitches}
        code={code}
        language={language}
        onEndSession={handleEndSession}
        candidateName={session?.candidate_name || "Candidate"} // If provided
      />
    );
  }

  return (
    <CandidateView
      session={session}
      timeLeft={timeLeft}
      tabSwitchCount={tabSwitchCount}
      code={code}
      onCodeChange={onCodeChange}
      language={language}
      onLanguageChange={onLanguageChange}
    />
  );
}