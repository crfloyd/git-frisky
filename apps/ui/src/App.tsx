import { useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { open } from '@tauri-apps/plugin-dialog'
import { FolderOpen } from 'lucide-react'
import { AppShell } from './components/layout/AppShell'
import { CommandPalette } from './components/command/CommandPalette'
import { FileTree } from './components/tree/FileTree'
import { DiffViewer } from './components/diff/DiffViewer'
import { CommitBox } from './components/commit/CommitBox'
import { CommitGraph } from './components/graph/CommitGraph'
import { CommitDetails } from './components/graph/CommitDetails'
import { useRepoStore } from './stores/repo'
import { ipc } from './lib/ipc'

function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Repo state
  const {
    repoPath,
    summary,
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

  // View mode: 'working-tree' (FileTree) or 'commit-details' (CommitDetails)
  type ViewMode = 'working-tree' | 'commit-details'
  const [viewMode, setViewMode] = useState<ViewMode>('working-tree')

  // Selected commit state (for commit details view)
  const [selectedCommitOid, setSelectedCommitOid] = useState<string | null>(null)
  const [selectedCommit, setSelectedCommit] = useState<any | null>(null)

  // Global keyboard shortcuts
  useEffect(() => {
    const down = async (e: KeyboardEvent) => {
      // ⌘K - Command Palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen((open) => !open)
        return
      }

      // ⌘O - Open Repository
      if (e.key === 'o' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        // Open repo dialog
        try {
          const selected = await open({
            directory: true,
            multiple: false,
            title: 'Select Git Repository',
          })
          if (selected && typeof selected === 'string') {
            openRepo(selected)
            setViewMode('working-tree')
            setSelectedCommitOid(null)
            setSelectedCommit(null)
            setInspectorVisible(true)
            toast.success(`Opened: ${selected.split('/').pop()}`)
          }
        } catch (error) {
          console.error('Failed to open repository:', error)
          toast.error('Failed to open repository')
        }
        return
      }

      // Escape - View Working Tree (if in commit details view)
      if (e.key === 'Escape' && viewMode === 'commit-details') {
        e.preventDefault()
        setViewMode('working-tree')
        setSelectedCommitOid(null)
        setSelectedCommit(null)
        clearSelection()
        return
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [viewMode, openRepo, clearSelection])

  // Track inspector visibility
  const [inspectorVisible, setInspectorVisible] = useState(false)

  // Auto-open inspector when repo is opened (to show commit graph)
  useEffect(() => {
    if (repoPath) {
      setInspectorVisible(true)
    }
  }, [repoPath])

  // Load diff when file selected
  useEffect(() => {
    if (!selectedFile || !repoPath) {
      setDiffHunks([])
      return
    }

    // Inspector should already be visible from repo load
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
      // Switch to working tree view and select file
      setViewMode('working-tree')
      selectFile(file, isStaged)
      setInspectorVisible(true)
    }
  }

  // Handle commit selection
  const handleSelectCommit = async (oid: string) => {
    if (!repoPath) return

    // Toggle: if clicking the same commit, go back to working tree
    if (selectedCommitOid === oid && viewMode === 'commit-details') {
      setViewMode('working-tree')
      setSelectedCommitOid(null)
      setSelectedCommit(null)
      return
    }

    // Select new commit and switch to commit details view
    setSelectedCommitOid(oid)
    setViewMode('commit-details')

    // Clear file selection
    clearSelection()

    // Fetch full commit details
    try {
      const commits = await ipc.log(repoPath, 500)
      const commit = commits.find((c: any) => c.oid === oid)
      if (commit) {
        setSelectedCommit(commit)
      }
    } catch (error) {
      console.error('Failed to load commit details:', error)
      toast.error('Failed to load commit details')
    }
  }

  // View working tree
  const handleViewWorkingTree = () => {
    setViewMode('working-tree')
    setSelectedCommitOid(null)
    setSelectedCommit(null)
    clearSelection()
  }

  // Handle copy commit SHA
  const handleCopySha = () => {
    if (selectedCommit) {
      navigator.clipboard.writeText(selectedCommit.oid)
      toast.success('Copied commit SHA to clipboard')
    }
  }

  // Close current repository
  const handleCloseRepo = async () => {
    try {
      // Use the closeRepo action from store
      const { closeRepo } = useRepoStore.getState()
      await closeRepo()

      // Reset all view state
      setViewMode('working-tree')
      setSelectedCommitOid(null)
      setSelectedCommit(null)
      setInspectorVisible(false)
      setDiffHunks([])

      toast.success('Closed repository')
    } catch (error) {
      console.error('Failed to close repository:', error)
      toast.error('Failed to close repository')
    }
  }

  // Open repository via native dialog
  const handleOpenRepo = async () => {
    try {
      // If a repo is already open, close it first
      if (repoPath) {
        await handleCloseRepo()
      }

      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Git Repository',
      })

      if (selected && typeof selected === 'string') {
        await openRepo(selected)
        // Reset view state
        setViewMode('working-tree')
        setSelectedCommitOid(null)
        setSelectedCommit(null)
        setInspectorVisible(true) // Open inspector to show commit graph
        toast.success(`Opened: ${selected.split('/').pop()}`)
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

  // Prepare inspector content (DiffViewer or CommitGraph)
  const inspectorContent = selectedFile ? (
    // Show diff viewer when file is selected
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
  ) : (
    // Always show commit graph when no file is selected
    // HEAD can be a branch name (e.g., "main") or commit OID (detached HEAD)
    // If it looks like a commit OID (40 hex chars), use it; otherwise it's a branch name
    <CommitGraph
      repoPath={repoPath}
      headCommitOid={
        summary?.head && summary.head.length === 40 ? summary.head : null
      }
      selectedCommitOid={selectedCommitOid}
      onCommitSelect={handleSelectCommit}
    />
  )

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
        ) : viewMode === 'working-tree' ? (
          // Working tree view - show FileTree + CommitBox
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
        ) : (
          // Commit details view - show CommitDetails in main area
          selectedCommit && (
            <CommitDetails
              commit={selectedCommit}
              onCopySha={handleCopySha}
              onViewWorkingTree={handleViewWorkingTree}
            />
          )
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
