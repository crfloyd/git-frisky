import { cn } from '../../lib/utils'

// Spinner for inline loading (16×16px)
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-block w-4 h-4 border-2 border-tertiary border-t-primary rounded-full animate-spin",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

// Skeleton loader for list items
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-hover via-active to-hover bg-[length:200%_100%] animate-shimmer rounded",
        className
      )}
      {...props}
    />
  )
}

// Progress bar for long operations (push, fetch)
export function ProgressBar({ progress, className }: { progress: number; className?: string }) {
  return (
    <div className={cn("h-1 bg-hover rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
}
