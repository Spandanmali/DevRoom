"use client"

import { useState, useEffect } from "react"
import Editor from "../Editor"

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
      "javascript-node": "js",
      "javascript-browser": "js",
      javascript: "js",
      python: "py",
      cpp: "cpp",
      java: "java",
      html: "html",
      css: "css",
    }
    return extensions[lang] || "txt"
  }

  // Monaco editor expects 'javascript', not 'javascript-node'
  const monacoLanguage = language.startsWith("javascript") ? "javascript" : language

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background">
      {/* File Tab Bar */}
      <div className="h-8 border-b border-border bg-card flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground font-mono">
            {language === 'html' ? 'index' : language === 'css' ? 'style' : 'main'}.{getFileExtension(language)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Code Editor
        </span>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <Editor 
          value={code}
          onChange={onChange}
          language={monacoLanguage}
          envLanguage={language}
          theme="vs-dark"
        />
      </div>
    </div>
  )
}
