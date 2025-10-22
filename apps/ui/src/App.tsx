import { useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { open } from '@tauri-apps/plugin-dialog'
import { FolderOpen } from 'lucide-react'
import { AppShell } from './components/layout/AppShell'
import { CommandPalette } from './components/command/CommandPalette'
import { FileTree } from './components/tree/FileTree'
import { DiffViewer } from './components/diff/DiffViewer'
import { CommitBox } from './components/commit/CommitBox'
import { useRepoStore } from './stores/repo'
import { ipc } from './lib/ipc'

function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Repo state
  const {
    repoPath,
    unstaged,
    staged,
    selectedFile,
    selectedFileStaged,
    openRepo,
    selectFile,
    clearSelection,
    stageFile,
    unstageFile,
  } = useRepoStore()

  // Diff state for selected file
  const [diffHunks, setDiffHunks] = useState<any[]>([])
  const [loadingDiff, setLoadingDiff] = useState(false)

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

  // Track inspector visibility
  const [inspectorVisible, setInspectorVisible] = useState(false)

  // Load diff when file selected
  useEffect(() => {
    if (!selectedFile || !repoPath) {
      setDiffHunks([])
      return
    }

    // Auto-open inspector when file is selected
    setInspectorVisible(true)

    const loadDiff = async () => {
      setLoadingDiff(true)
      try {
        const hunks = await ipc.getDiff(repoPath, selectedFile.path, selectedFileStaged)
        setDiffHunks(hunks)
      } catch (error) {
        console.error('Failed to load diff:', error)
        toast.error('Failed to load diff')
      } finally {
        setLoadingDiff(false)
      }
    }

    loadDiff()
  }, [selectedFile, selectedFileStaged, repoPath])

  // Handle file selection with toggle behavior
  const handleSelectFile = (file: any, isStaged: boolean) => {
    // If clicking the same file, deselect it and close inspector
    if (selectedFile && selectedFile.path === file.path && selectedFileStaged === isStaged) {
      clearSelection()
      setInspectorVisible(false)
    } else {
      // Otherwise, select the new file
      selectFile(file, isStaged)
    }
  }

  // Open repository via native dialog
  const handleOpenRepo = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Git Repository',
      })

      if (selected && typeof selected === 'string') {
        await openRepo(selected)
        toast.success(`Opened repository: ${selected}`)
      }
    } catch (error) {
      console.error('Failed to open repository:', error)
      toast.error('Failed to open repository')
    }
  }

  // Handle commit
  const handleCommit = async (message: string) => {
    if (!repoPath) return

    try {
      await ipc.commit(repoPath, message)
      toast.success('Committed successfully')

      // Refresh status after commit
      const status = await ipc.status(repoPath)
      useRepoStore.setState({
        unstaged: status.unstaged,
        staged: status.staged,
      })
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Commit failed: ${msg}`)
      throw error
    }
  }

  // Handle file staging with error handling
  const handleStageFile = async (path: string) => {
    try {
      await stageFile(path)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to stage file: ${msg}`)
    }
  }

  // Handle file unstaging with error handling
  const handleUnstageFile = async (path: string) => {
    try {
      await unstageFile(path)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to unstage file: ${msg}`)
    }
  }

  // Handle hunk staging
  const handleStageHunk = async (hunk: any) => {
    if (!repoPath || !selectedFile) return

    try {
      await ipc.stageHunk(repoPath, selectedFile.path, hunk)
      toast.success('Hunk staged')

      // Refresh status and diff
      const status = await ipc.status(repoPath)
      useRepoStore.setState({
        unstaged: status.unstaged,
        staged: status.staged,
      })

      // Reload diff to show updated hunks
      const hunks = await ipc.getDiff(repoPath, selectedFile.path, selectedFileStaged)
      setDiffHunks(hunks)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to stage hunk: ${msg}`)
    }
  }

  // Handle hunk unstaging
  const handleUnstageHunk = async (hunk: any) => {
    if (!repoPath || !selectedFile) return

    try {
      await ipc.unstageHunk(repoPath, selectedFile.path, hunk)
      toast.success('Hunk unstaged')

      // Refresh status and diff
      const status = await ipc.status(repoPath)
      useRepoStore.setState({
        unstaged: status.unstaged,
        staged: status.staged,
      })

      // Reload diff to show updated hunks
      const hunks = await ipc.getDiff(repoPath, selectedFile.path, selectedFileStaged)
      setDiffHunks(hunks)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      toast.error(`Failed to unstage hunk: ${msg}`)
    }
  }

  // Prepare inspector content (DiffViewer)
  const inspectorContent = selectedFile ? (
    loadingDiff ? (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-foreground-dim">Loading diff...</p>
      </div>
    ) : (
      <DiffViewer
        hunks={diffHunks}
        onStageHunk={selectedFileStaged ? undefined : handleStageHunk}
        onUnstageHunk={selectedFileStaged ? handleUnstageHunk : undefined}
        isStaged={selectedFileStaged}
        isNewFile={selectedFile.status === 'U'}
        filePath={selectedFile.path}
        fileSize={0} // TODO: Add file size tracking
      />
    )
  ) : null

  return (
    <>
      <AppShell
        inspectorContent={inspectorContent}
        inspectorVisible={inspectorVisible}
        inspectorFilePath={selectedFile?.path}
        onInspectorToggle={(visible) => setInspectorVisible(visible)}
      >
        {!repoPath ? (
          // Empty state - no repo open
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FolderOpen size={64} className="mx-auto mb-4" style={{ color: '#a1a1aa' }} />
              <h2 className="text-lg font-medium mb-2" style={{ color: '#fafafa' }}>
                Open a Repository
              </h2>
              <p className="text-sm mb-6" style={{ color: '#a1a1aa' }}>
                Open a folder to view its Git history
              </p>
              <button
                onClick={handleOpenRepo}
                className="px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                }}
              >
                Open Folder
              </button>
              <p className="text-xs mt-4" style={{ color: '#a1a1aa' }}>
                or press ⌘O
              </p>
            </div>
          </div>
        ) : (
          // Repo is open - show FileTree + CommitBox only (DiffViewer is in Inspector)
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-hidden">
              <FileTree
                unstaged={unstaged}
                staged={staged}
                selectedFilePath={selectedFile?.path}
                selectedFileStaged={selectedFileStaged}
                onSelectFile={handleSelectFile}
                onStageFile={handleStageFile}
                onUnstageFile={handleUnstageFile}
              />
            </div>
            <CommitBox
              onCommit={handleCommit}
              stagedCount={staged.length}
              disabled={staged.length === 0}
            />
          </div>
        )}
      </AppShell>

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#27272a',
            border: '1px solid #3f3f46',
            color: '#fafafa',
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          },
          duration: 4000,
        }}
      />
    </>
  )
}

export default App
