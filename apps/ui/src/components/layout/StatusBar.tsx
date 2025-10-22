import { Diamond, Settings, Check } from 'lucide-react'

export function StatusBar() {
  return (
    <div className="h-7 bg-elevated border-t border-border flex items-center px-4 text-sm text-foreground-muted">
      {/* Current branch */}
      <button
        className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
        title="Switch branch"
      >
        <Diamond size={14} />
        <span>main</span>
      </button>

      <Divider />

      {/* Ahead/Behind */}
      <div className="flex items-center gap-1 text-foreground">
        <span>•2↑ 1↓</span>
      </div>

      <Divider />

      {/* Repo path */}
      <div className="flex-1 truncate" title="/Users/coreyfloyd/git/personal/git-frisky">
        ~/git/personal/git-frisky
      </div>

      <Divider />

      {/* Activity indicator (transient) */}
      <div className="flex items-center gap-1.5 text-success">
        <Check size={14} />
        <span>Synced</span>
      </div>

      {/* Settings */}
      <button
        className="ml-4 p-1 rounded hover:bg-hover hover:text-foreground transition-colors"
        aria-label="Settings"
        title="Settings ⌘,"
      >
        <Settings size={14} />
      </button>
    </div>
  )
}

function Divider() {
  return <div className="h-3 w-px bg-border mx-3" />
}
