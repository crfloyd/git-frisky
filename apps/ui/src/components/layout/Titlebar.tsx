import { ChevronLeft, ChevronRight, Command, Search, Settings } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Titlebar() {
  return (
    <div
      data-tauri-drag-region
      className="h-10 bg-elevated border-b border-border flex items-center px-4 select-none"
    >
      {/* Left: Back/Forward buttons (76px inset for macOS traffic lights) */}
      <div className="flex items-center gap-2 ml-[52px]">
        <button
          className="p-1 rounded hover:bg-hover transition-colors text-tertiary hover:text-primary"
          aria-label="Go back"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="p-1 rounded hover:bg-hover transition-colors text-tertiary hover:text-primary"
          aria-label="Go forward"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Center: Repository name */}
      <div className="flex-1 flex justify-center px-4">
        <h1 className="text-md font-medium text-primary truncate max-w-lg" title="/Users/coreyfloyd/git/personal/git-frisky">
          git-frisky
        </h1>
      </div>

      {/* Right: Search, Command palette, Settings */}
      <div className="flex items-center gap-3">
        {/* Global search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={14} />
          <input
            type="text"
            placeholder="Search..."
            className={cn(
              "w-[200px] h-7 pl-8 pr-3 bg-base border border-border rounded",
              "text-sm text-primary placeholder:text-tertiary",
              "focus:outline-none focus:border-focus focus:ring-2 focus:ring-primary/20"
            )}
          />
        </div>

        {/* Command palette trigger */}
        <button
          className="p-1.5 rounded hover:bg-hover transition-colors text-secondary hover:text-primary"
          aria-label="Command palette"
          title="Command palette ⌘K"
        >
          <Command size={16} />
        </button>

        {/* Settings */}
        <button
          className="p-1.5 rounded hover:bg-hover transition-colors text-secondary hover:text-primary"
          aria-label="Settings"
          title="Settings ⌘,"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  )
}
