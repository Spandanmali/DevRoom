import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface NavbarProps {
  showAuthButtons?: boolean
}

export function Navbar({ showAuthButtons = true }: NavbarProps) {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    let isMounted = true

    if (!isSupabaseConfigured || !supabase) {
      setIsAuthenticated(false)
      return
    }

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (isMounted) {
        setIsAuthenticated(Boolean(session))
        setUserEmail(session?.user?.email ?? null)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) {
          setIsAuthenticated(Boolean(session))
          setUserEmail(session?.user?.email ?? null)
        }
      }
    )

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase?.auth.signOut()
    navigate("/login", { replace: true })
  }

  return (
    <header className="relative z-10 border-b border-border/50 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-background/50">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="relative">
          <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center">
            <span className="text-background font-bold text-sm font-mono">{'<>'}</span>
          </div>
          <div className="absolute -inset-1 bg-foreground/20 rounded blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">
          DevRoom
        </span>
      </Link>
      {showAuthButtons && isAuthenticated !== null && (
        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button 
                className="bg-foreground text-background hover:bg-foreground/90"
                onClick={() => navigate("/register")}
              >
                Sign Up
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center relative h-10 w-10 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <User className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail || "Signed In"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer" 
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-100 focus:text-red-600 dark:focus:bg-red-900 dark:focus:text-red-100" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </header>
  )
}
