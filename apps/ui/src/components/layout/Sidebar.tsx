import { Plus, Check, Circle, Diamond, Tag } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Sidebar() {
  return (
    <div className="h-full bg-base border-r border-border overflow-auto">
      <div className="px-4 py-3">
        {/* REPOSITORIES Section */}
        <div className="mb-6">
          <h2 className="text-xs font-medium text-foreground-dim uppercase tracking-wide mb-6">
            Repositories
          </h2>
          <div className="space-y-1">
            <SidebarItem icon={<Circle size={14} />} active badge={<Check size={12} className="text-success" />}>
              git-frisky
            </SidebarItem>
            <SidebarItem icon={<Circle size={14} />}>
              my-website
            </SidebarItem>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-dim hover:text-foreground hover:bg-hover rounded transition-colors">
              <Plus size={14} />
              Open Repository
            </button>
          </div>
        </div>

        {/* BRANCHES Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-medium text-foreground-dim uppercase tracking-wide">
              Branches
            </h2>
            <button
              className="p-0.5 rounded hover:bg-hover text-foreground-dim hover:text-foreground transition-colors"
              aria-label="Create branch"
              title="Create branch ⌘B"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            <SidebarItem icon={<Diamond size={14} />} active badge={<span className="text-xs text-foreground">•2↑</span>}>
              main
            </SidebarItem>
            <SidebarItem icon={<Circle size={14} />}>
              feature/login
            </SidebarItem>
            <SidebarItem icon={<Circle size={14} />} badge={<span className="text-xs text-foreground-dim">↓3</span>}>
              fix/typo
            </SidebarItem>
          </div>
        </div>

        {/* TAGS Section */}
        <div className="mb-6">
          <h2 className="text-xs font-medium text-foreground-dim uppercase tracking-wide mb-6">
            Tags
          </h2>
          <div className="space-y-1">
            <SidebarItem icon={<Tag size={14} />}>
              v1.2.0
            </SidebarItem>
            <SidebarItem icon={<Tag size={14} />}>
              v1.1.0
            </SidebarItem>
          </div>
        </div>

        {/* STASHES Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-medium text-foreground-dim uppercase tracking-wide">
              Stashes
            </h2>
            <span className="text-xs bg-hover text-foreground-dim px-1.5 py-0.5 rounded">3</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reusable sidebar item component
function SidebarItem({
  icon,
  children,
  active = false,
  badge,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  active?: boolean
  badge?: React.ReactNode
}) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors",
        active
          ? "bg-active text-foreground border-l-2 border-accent"
          : "text-foreground-muted hover:text-foreground hover:bg-hover"
      )}
    >
      <span className="text-foreground-dim">{icon}</span>
      <span className="flex-1 text-left truncate">{children}</span>
      {badge && <span>{badge}</span>}
    </button>
  )
}
