import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { Download, X } from "lucide-react";

interface InterviewResultsProps {
  session: any;
  evaluation: string;
  isHost: boolean;
  onClose: () => void;
  code: string;
  roomId: string;
  tabSwitches?: { timestamp: string; candidateName: string }[];
}

export default function InterviewResults({
  session,
  evaluation,
  isHost,
  onClose,
  code,
  roomId,
  tabSwitches = [],
}: InterviewResultsProps) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isHost && roomId) {
      const savedNotes = localStorage.getItem(`devroom-notes-${roomId}`);
      if (savedNotes) {
        setNotes(savedNotes);
      }
    }
  }, [isHost, roomId]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Helper for multiline text
    const addText = (text: string, title?: string) => {
      if (title) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(title, 14, y);
        y += 8;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const splitText = doc.splitTextToSize(text || "N/A", pageWidth - 28);
      
      // Check page break
      if (y + splitText.length * 5 > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(splitText, 14, y);
      y += splitText.length * 5 + 10;
    };

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("DevRoom Interview Report", pageWidth / 2, y, { align: "center" });
    y += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Candidate: ${session?.candidate_name || "Candidate"}`, 14, y);
    y += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, y);
    y += 15;

    addText(session?.problem_statement || "", "Problem Statement");
    addText(evaluation || "", "AI Evaluation");
    addText(code || "", "Final Code Submitted");
    
    if (notes) {
      addText(notes, "Interviewer Private Notes");
    }

    if (tabSwitches && tabSwitches.length > 0) {
      const tsText = `Total Switches: ${tabSwitches.length}\n` + tabSwitches.map(t => `${t.timestamp}: Tab switch detected`).join("\n");
      addText(tsText, "Tab Switch Log");
    }

    doc.save(`Interview_Report_${session?.candidate_name || "Candidate"}.pdf`);
  };

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground overflow-auto">
      {/* TOP SECTION */}
      <div className="flex-none p-8 border-b border-border bg-muted/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Interview Complete</h1>
            <p className="text-muted-foreground">
              Date: {new Date().toLocaleDateString()} | Duration: {session?.duration_minutes || "--"} minutes
            </p>
          </div>
          <div className="flex gap-4">
            {isHost && (
              <Button onClick={generatePDF} className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            )}
            <Button variant="outline" onClick={onClose} className="flex items-center gap-2">
              <X className="w-4 h-4" /> Close
            </Button>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8 h-full">
          {/* Left: Problem */}
          <div className="flex flex-col border border-border rounded-lg bg-card">
            <div className="p-4 border-b border-border font-semibold bg-muted/50 rounded-t-lg">
              Problem Statement
            </div>
            <div className="p-6 overflow-auto whitespace-pre-wrap flex-1 text-sm">
              {session?.problem_statement}
            </div>
          </div>

          {/* Right: AI Evaluation */}
          <div className="flex flex-col border border-border rounded-lg bg-card text-sm">
            <div className="p-4 border-b border-border font-semibold bg-muted/50 rounded-t-lg">
              AI Evaluation
            </div>
            <div className="p-6 overflow-auto whitespace-pre-wrap flex-1">
              {evaluation || "Pending evaluation..."}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION - ONLY FOR HOST */}
      {isHost && notes && (
        <div className="flex-none p-8 pt-0">
          <div className="max-w-6xl mx-auto">
            <div className="border border-border rounded-lg bg-card">
              <div className="p-4 border-b border-border font-semibold bg-muted/50 rounded-t-lg">
                Your Private Notes
              </div>
              <div className="p-6 whitespace-pre-wrap text-sm">
                {notes}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}