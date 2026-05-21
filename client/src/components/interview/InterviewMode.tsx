import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface InterviewModeProps {
  roomId: string;
  currentUser: { id: string; name?: string };
  isHost: boolean;
  currentCode: string;
  language: string;
  isOpen: boolean;
  onClose: () => void;
  socket: any;
}

export const InterviewMode: React.FC<InterviewModeProps> = ({
  roomId,
  currentUser,
  isHost,
  currentCode,
  language,
  isOpen,
  onClose,
  socket,
}) => {
  // 1. All state declarations at top
  const [phase, setPhase] = useState<'setup' | 'active' | 'ended'>('setup');
  const [problemStatement, setProblemStatement] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<30 | 45 | 60>(45);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [session, setSession] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the active session if one exists when opening
  useEffect(() => {
    if (!isOpen) return;

    const fetchSession = async () => {
      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        const token = authSession?.access_token;
        const res = await fetch(`/api/interview/${roomId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === 'active') {
             setSession(data);
             setProblemStatement(data.problem_statement);
             setPhase('active');
             const startedAt = new Date(data.started_at).getTime();
             const now = new Date().getTime();
             const diff = Math.floor((now - startedAt) / 1000);
             const remaining = (data.duration_minutes * 60) - diff;
             setTimeLeft(remaining > 0 ? remaining : 0);
          } else if (data && data.status === 'completed') {
             setSession(data);
             setProblemStatement(data.problem_statement);
             setEvaluation(data.ai_evaluation);
             setPhase('ended');
          }
        }
      } catch (err) {
        console.error('Failed to fetch interview session', err);
      }
    };
    fetchSession();
  }, [isOpen, roomId]);

  // 2. Socket listeners in ONE useEffect
  useEffect(() => {
    if (!socket) return;
    
    const handleInterviewStarted = ({ session: newSession }: { session: any }) => {
      setSession(newSession);
      setProblemStatement(newSession.problem_statement);
      setTimeLeft(newSession.duration_minutes * 60);
      setPhase('active');
    };

    const handleTimerUpdate = ({ timeLeft: updatedTimeLeft }: { timeLeft: number }) => {
      if (!isHost) {
        setTimeLeft(updatedTimeLeft);
      }
    };

    const handleInterviewEnded = () => {
      setPhase('ended');
    };

    socket.on('interview-started', handleInterviewStarted);
    socket.on('timer-update', handleTimerUpdate);
    socket.on('interview-ended', handleInterviewEnded);

    return () => {
      socket.off('interview-started', handleInterviewStarted);
      socket.off('timer-update', handleTimerUpdate);
      socket.off('interview-ended', handleInterviewEnded);
    };
  }, [isHost, socket]);

  // 3. Timer in separate useEffect
  useEffect(() => {
    if (phase !== 'active') return;
    if (!isHost) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleEndInterview();
          return 0;
        }
        if (socket) {
          socket.emit('timer-sync', { roomId, timeLeft: prev - 1 });
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase, isHost, roomId, socket]);

  // 4. handleStartInterview function
  const handleStartInterview = async () => {
    if (!problemStatement.trim()) return;
    setIsLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId, problemStatement, durationMinutes })
      });
      const data = await res.json();
      if (res.ok) {
        setSession(data.session || data); // handle depending on backend return shape
        setTimeLeft(durationMinutes * 60);
        setPhase('active');
        if (socket) {
          socket.emit('start-interview', { roomId, session: data.session || data });
        }
      } else {
        toast.error(data.error || 'Failed to start interview');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while starting interview');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. handleEndInterview function
  const handleEndInterview = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;

      const res = await fetch('/api/interview/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: session.id,
          finalCode: currentCode,
          language
        })
      });
      const data = await res.json();
      if (res.ok) {
        setEvaluation(data.evaluation);
        setPhase('ended');
        if (socket) {
          socket.emit('end-interview', { roomId });
        }
      } else {
        toast.error(data.error || 'Failed to end interview');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while ending interview');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. handleDownloadPDF function
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("DevRoom Interview Report", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Duration: ${session?.duration_minutes} minutes`, 20, 40);
    
    doc.setFontSize(14);
    doc.text("Problem Statement:", 20, 50);
    doc.setFontSize(10);
    const splitProblem = doc.splitTextToSize(problemStatement, 170);
    doc.text(splitProblem, 20, 60);
    
    doc.addPage();
    doc.setFontSize(14);
    doc.text("AI Evaluation:", 20, 20);
    doc.setFontSize(10);
    const splitEval = doc.splitTextToSize(evaluation || "Pending evaluation", 170);
    doc.text(splitEval, 20, 30);

    doc.addPage();
    doc.setFontSize(14);
    doc.text("Final Code:", 20, 20);
    doc.setFontSize(10);
    const splitCode = doc.splitTextToSize(currentCode, 170);
    doc.text(splitCode, 20, 30);

    doc.save("devroom-interview-report.pdf");
  };

  if (!isOpen) return null;

  // 8. Timer display format
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const timerColor = timeLeft > 300 ? 'text-green-500' : timeLeft > 120 ? 'text-yellow-500' : 'text-red-500 animate-pulse';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">Interview Mode</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* 7. RENDER based on phase */}
          {phase === 'setup' && (
            <div className="space-y-6">
              {isHost ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Problem Statement</label>
                    <textarea 
                      className="w-full h-32 bg-slate-800 border border-slate-700 rounded-md p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Paste the problem statement here..."
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Duration</label>
                    <div className="flex space-x-3">
                      {[30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setDurationMinutes(mins as 30|45|60)}
                          className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                            durationMinutes === mins 
                              ? 'bg-white text-slate-900 border-white' 
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={!problemStatement.trim() || isLoading}
                    onClick={handleStartInterview}
                  >
                    {isLoading ? 'Starting...' : 'Start Interview'}
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-white animate-spin mb-4"></div>
                  <p className="text-slate-400 text-lg animate-pulse">Waiting for host to start interview...</p>
                </div>
              )}
            </div>
          )}

          {phase === 'active' && (
            <div className="space-y-6 flex flex-col items-center">
              <div className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                <h3 className="text-sm font-medium text-slate-400 mb-2">Problem Statement</h3>
                <p className="text-white whitespace-pre-wrap">{problemStatement}</p>
              </div>

              <div className="text-center py-8">
                <div className={`text-6xl font-mono font-bold tracking-wider ${timerColor}`}>
                  {timerDisplay}
                </div>
                <p className="text-slate-400 mt-2">Interview in progress</p>
              </div>

              {isHost ? (
                <Button 
                  variant="destructive" 
                  className="w-full flex items-center justify-center"
                  disabled={isLoading}
                  onClick={() => {
                    if (window.confirm("Are you sure? This will evaluate the solution.")) {
                      handleEndInterview();
                    }
                  }}
                >
                  {isLoading ? 'Evaluating...' : 'End Session'}
                </Button>
              ) : (
                <div className="text-center text-slate-500 italic">
                  Focus on your solution. Good luck!
                </div>
              )}
            </div>
          )}

          {phase === 'ended' && (
            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 h-[300px] overflow-y-auto font-mono text-sm leading-relaxed text-slate-300">
                <h3 className="text-white font-semibold text-base mb-3 border-b border-slate-700 pb-2">AI Evaluation</h3>
                {evaluation ? (
                  <div className="whitespace-pre-wrap">{evaluation}</div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">
                    Waiting for evaluation results...
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <Button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white" onClick={handleDownloadPDF}>
                  Download PDF Report
                </Button>
                <Button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};