import { GitBranch } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-border/50 px-6 py-4 backdrop-blur-sm bg-background/50">
      <div className="flex items-center justify-center">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <GitBranch className="h-5 w-5" />
          <span className="sr-only">GitHub</span>
        </a>
      </div>
    </footer>
  )
}
