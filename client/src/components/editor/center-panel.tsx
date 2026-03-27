"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  name: string
  color: string
}

interface CenterPanelProps {
  code: string
  onChange: (code: string) => void
  language: string
  users: User[]
}

// Simulated cursor positions for other users
const MOCK_CURSORS = [
  { userId: "1", line: 5, column: 20 },
  { userId: "2", line: 12, column: 15 },
]

export function CenterPanel({ code, onChange, language, users }: CenterPanelProps) {
  const [lineCount, setLineCount] = useState(1)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })

  useEffect(() => {
    setLineCount(code.split("\n").length)
  }, [code])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleCursorChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const text = textarea.value.substring(0, textarea.selectionStart)
    const lines = text.split("\n")
    const line = lines.length
    const column = lines[lines.length - 1].length + 1
    setCursorPosition({ line, column })
  }

  const getFileExtension = (lang: string) => {
    const extensions: Record<string, string> = {
      javascript: "js",
      python: "py",
      cpp: "cpp",
      java: "java",
      go: "go",
    }
    return extensions[lang] || "txt"
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      {/* File Tab Bar */}
      <div className="h-8 border-b border-border bg-card flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground font-mono">
            main.{getFileExtension(language)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers */}
        <div className="w-12 bg-card border-r border-border py-3 overflow-hidden">
          <div className="font-mono text-xs text-muted-foreground text-right pr-3 leading-6">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>
        </div>

        {/* Code Area */}
        <div className="flex-1 relative">
          <textarea
            value={code}
            onChange={handleTextChange}
            onSelect={handleCursorChange}
            onClick={handleCursorChange}
            onKeyUp={handleCursorChange}
            className="absolute inset-0 w-full h-full bg-background text-foreground font-mono text-sm leading-6 p-3 resize-none outline-none"
            spellCheck={false}
            style={{
              tabSize: 2,
            }}
          />

          {/* Simulated Other User Cursors */}
          {MOCK_CURSORS.map((cursor) => {
            const user = users.find((u) => u.id === cursor.userId)
            if (!user) return null
            
            // Calculate approximate position
            const top = (cursor.line - 1) * 24 + 12 // 24px line height + 12px padding
            const left = cursor.column * 8.4 + 12 // approximate character width + padding

            return (
              <div
                key={cursor.userId}
                className="absolute pointer-events-none"
                style={{
                  top: `${top}px`,
                  left: `${left}px`,
                }}
              >
                {/* Cursor Line */}
                <div
                  className="w-0.5 h-5 animate-pulse"
                  style={{ backgroundColor: user.color }}
                />
                {/* User Label */}
                <div
                  className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap rounded-sm"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
