import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import {
  FolderOpen,
  RefreshCw,
  GitCommit,
  Upload,
  Download,
  GitPullRequest,
  GitBranch,
  Settings,
  Keyboard,
  Info,
} from 'lucide-react'
import { cn } from '../../lib/utils'

type CommandPaletteProps = {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('')

  // Close on Escape key
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onClose])

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-overlay/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
        <Command
          className={cn(
            "w-[600px] bg-elevated border-2 border-strong rounded-lg shadow-2xl",
            "overflow-hidden"
          )}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              onClose()
            }
          }}
        >
          {/* Search Input */}
          <Command.Input
            placeholder="Type a command or search..."
            value={search}
            onValueChange={setSearch}
            className={cn(
              "w-full h-14 px-4 bg-elevated text-lg text-primary placeholder:text-tertiary",
              "border-0 outline-none focus:outline-none"
            )}
          />

          <Command.List className="max-h-[400px] overflow-y-auto border-t border-border px-2 py-2">
            <Command.Empty className="py-8 text-center text-sm text-tertiary">
              No results found.
            </Command.Empty>

            {/* Git Operations */}
            <CommandGroup heading="Git">
              <CommandItem icon={<GitCommit size={16} />} shortcut="⌘↵">
                Commit staged changes
              </CommandItem>
              <CommandItem icon={<Upload size={16} />} shortcut="⌘P">
                Push to remote
              </CommandItem>
              <CommandItem icon={<Download size={16} />} shortcut="⌘⇧P">
                Pull from remote
              </CommandItem>
              <CommandItem icon={<GitPullRequest size={16} />} shortcut="⌘F">
                Fetch from remote
              </CommandItem>
              <CommandItem icon={<GitBranch size={16} />} shortcut="⌘B">
                Create new branch
              </CommandItem>
            </CommandGroup>

            {/* Navigation */}
            <CommandGroup heading="Navigation">
              <CommandItem icon={<FolderOpen size={16} />} shortcut="⌘O">
                Open repository
              </CommandItem>
              <CommandItem icon={<RefreshCw size={16} />} shortcut="⌘R">
                Refresh status
              </CommandItem>
              <CommandItem icon={<Info size={16} />} shortcut="⌘I">
                Toggle inspector
              </CommandItem>
            </CommandGroup>

            {/* Settings */}
            <CommandGroup heading="Settings">
              <CommandItem icon={<Settings size={16} />} shortcut="⌘,">
                Open settings
              </CommandItem>
              <CommandItem icon={<Keyboard size={16} />} shortcut="?">
                Keyboard shortcuts
              </CommandItem>
            </CommandGroup>
          </Command.List>
        </Command>
      </div>
    </>
  )
}

// Command item component
function CommandItem({
  icon,
  children,
  shortcut,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  shortcut?: string
}) {
  return (
    <Command.Item
      className={cn(
        "flex items-center gap-3 px-3 h-11 rounded cursor-pointer",
        "text-base text-secondary",
        "data-[selected=true]:bg-hover data-[selected=true]:text-primary",
        "data-[selected=true]:border-l-2 data-[selected=true]:border-primary"
      )}
    >
      <span className="text-tertiary">{icon}</span>
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="text-xs text-tertiary font-mono">{shortcut}</span>
      )}
    </Command.Item>
  )
}

// Group heading component
function CommandGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group className="mb-2">
      <div className="px-3 py-2 text-xs font-medium text-tertiary uppercase tracking-wide">
        {heading}
      </div>
      {children}
    </Command.Group>
  )
}
