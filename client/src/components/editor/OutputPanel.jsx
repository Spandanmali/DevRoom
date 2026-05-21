import React from "react";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function OutputPanel({ onRun, isRunning, output }) {
  const hasError = output?.statusCode && output.statusCode !== 200;

  return (
    <div className="flex flex-col h-full bg-[#111111] border border-[#222222] font-mono text-sm overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#222222] bg-[#111111]">
        <div className="text-gray-400 text-xs">Output</div>

        <div className="flex items-center gap-3">
          {output && (
            <div
              className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${
                hasError
                  ? "bg-red-500/10 text-red-500"
                  : "bg-green-500/10 text-green-500"
              }`}
            >
              {hasError ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
              {hasError ? "Error" : "Accepted"}
            </div>
          )}
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded transition-colors"
          >
            {isRunning ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} className="fill-current" />
            )}
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {!isRunning && !output && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
            <Play size={24} className="mb-2 opacity-50" />
            <p>Click Run to execute your code</p>
          </div>
        )}

        {isRunning && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm animate-pulse">
            <Loader2 size={24} className="mb-2 animate-spin text-green-500" />
            <p>Running your code...</p>
          </div>
        )}

        {!isRunning && output && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-gray-500 text-xs">Output</span>
              <pre
                className={`bg-[#111111] border border-[#222222] p-3 rounded whitespace-pre-wrap overflow-x-auto min-h-[60px] ${hasError ? "text-[#ef4444]" : "text-[#22c55e]"}`}
              >
                {output.output ? (
                  output.output
                ) : (
                  <span className="text-gray-500 italic">No output</span>
                )}
              </pre>
            </div>

            <div className="flex gap-4 text-xs text-gray-400">
              {output.cpuTime && <div>CPU Time: {output.cpuTime} sec</div>}
              {output.memory && <div>Memory: {output.memory} KB</div>}
            </div>

            <div
              className={`mt-2 font-semibold ${
                hasError ? "text-[#ef4444]" : "text-green-500"
              }`}
            >
              Status Code: {output.statusCode || "Unknown"}{" "}
              {hasError ? "(Failed)" : "(Success)"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
