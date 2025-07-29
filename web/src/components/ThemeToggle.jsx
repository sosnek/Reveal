import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        "relative h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm",
        "border border-border/50 shadow-lg hover:shadow-xl",
        "hover:bg-accent/80 transition-all duration-300",
        "focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500 ease-in-out",
            "text-amber-500",
            theme === 'dark' 
              ? "rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500 ease-in-out",
            "text-slate-700 dark:text-slate-300",
            theme === 'light' 
              ? "rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100"
          )}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
} 