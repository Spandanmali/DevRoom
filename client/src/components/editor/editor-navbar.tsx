"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Play, Share2, Check, ChevronDown, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EditorUser {
  id: string
  name: string
  color: string
  isOnline: boolean
  isCurrentUser?: boolean
}

interface EditorNavbarProps {
  roomId: string
  roomName: string
  onRoomNameChange: (name: string) => void
  language: string
  onLanguageChange: (lang: string) => void
  users: EditorUser[]
  onRun: () => void
  isRunning: boolean
}

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "go", label: "Go" },
]

export function EditorNavbar({
  roomId,
  roomName,
  onRoomNameChange,
  language,
  onLanguageChange,
  users,
  onRun,
  isRunning,
}: EditorNavbarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/room/${roomId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNameClick = () => {
    setIsEditing(true)
  }

  const handleNameBlur = () => {
    setIsEditing(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false)
    }
  }

  const currentUser = users.find(u => u.isCurrentUser)
  const displayedUsers = users.filter(u => !u.isCurrentUser).slice(0, 4)
  const remainingCount = users.filter(u => !u.isCurrentUser).length - 4

  return (
    <header className="h-12 border-b border-border bg-card flex items-center px-4 gap-4">
      {/* Left: Logo + Room Name */}
      <div className="flex items-center gap-3">
        <Link to="/" className="font-mono text-sm font-semibold text-foreground">
          DevRoom
        </Link>
        <span className="text-border">/</span>
        {isEditing ? (
          <input
            type="text"
            value={roomName}
            onChange={(e) => onRoomNameChange(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="bg-transparent text-sm text-foreground border-b border-border focus:border-foreground outline-none px-1"
            autoFocus
          />
        ) : (
          <button
            onClick={handleNameClick}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {roomName}
          </button>
        )}
      </div>

      {/* Center: Language Selector */}
      <div className="flex-1 flex items-center justify-center gap-4">
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-[140px] h-8 bg-input border-border text-foreground text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value} className="text-sm">
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right: Actions + Users */}
      <div className="flex items-center gap-3">
        {/* Share Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="h-8 border-border hover:bg-accent text-sm gap-2"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              Share
            </>
          )}
        </Button>

        {/* Run Button */}
        <Button
          size="sm"
          onClick={onRun}
          disabled={isRunning}
          className="h-8 bg-[#22c55e] hover:bg-[#22c55e]/90 text-white border-0 text-sm gap-2"
        >
          <Play className="h-3.5 w-3.5" fill="currentColor" />
          {isRunning ? "Running..." : "Run"}
        </Button>

        {/* Active Users */}
        <div className="flex items-center -space-x-2 ml-2">
          {displayedUsers.map((user) => (
            <div
              key={user.id}
              className="h-7 w-7 rounded-full border-2 border-card flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="h-7 w-7 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              +{remainingCount}
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 ml-2">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: currentUser?.color || "#888" }}
              >
                {currentUser?.name.charAt(0).toUpperCase() || "U"}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem className="text-sm gap-2">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
