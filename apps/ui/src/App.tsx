import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { AppShell } from './components/layout/AppShell'
import { CommandPalette } from './components/command/CommandPalette'

function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Global keyboard shortcut for Command Palette (⌘K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <AppShell>
        {/* Main content area - will house commit graph, file tree, etc. */}
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium text-primary mb-2">GitFrisky</p>
            <p className="text-sm text-tertiary">Open a repository to get started</p>
            <p className="text-xs text-tertiary mt-4">Press ⌘K to open command palette</p>
          </div>
        </div>
      </AppShell>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--color-bg-elevated))',
            border: '1px solid hsl(var(--color-border-strong))',
            color: 'hsl(var(--color-text-primary))',
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          },
          duration: 4000, // 4s for success/default
        }}
      />
    </>
  )
}

export default App
