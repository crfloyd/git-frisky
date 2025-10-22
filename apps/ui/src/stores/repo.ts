import { create } from 'zustand'
import { listen, UnlistenFn } from '@tauri-apps/api/event'
import { ipc } from '../lib/ipc'
import type { RepoSummary, FileChange } from '@gitfrisky/shared-types'

type WatchEvent = {
  kind: 'status' | 'head' | 'refs'
}

// Global unlisten function for watch events
let watchUnlisten: UnlistenFn | null = null

type RepoState = {
  // Current repo
  repoPath: string | null
  summary: RepoSummary | null

  // File changes
  unstaged: FileChange[]
  staged: FileChange[]

  // Selected file for diff view
  selectedFile: FileChange | null
  selectedFileStaged: boolean

  // Loading states
  isLoading: boolean
  error: string | null

  // Actions
  openRepo: (path: string) => Promise<void>
  closeRepo: () => void
  refreshStatus: () => Promise<void>
  selectFile: (file: FileChange, isStaged: boolean) => void
  clearSelection: () => void
  stageFile: (path: string) => Promise<void>
  unstageFile: (path: string) => Promise<void>
}

export const useRepoStore = create<RepoState>((set, get) => ({
  // Initial state
  repoPath: null,
  summary: null,
  unstaged: [],
  staged: [],
  selectedFile: null,
  selectedFileStaged: false,
  isLoading: false,
  error: null,

  // Open a repository
  openRepo: async (path: string) => {
    set({ isLoading: true, error: null })
    try {
      const summary = await ipc.openRepo(path)
      set({ repoPath: path, summary })

      // Load initial status
      await get().refreshStatus()

      // Start file watcher
      await ipc.startWatch(path)

      // Set up event listener for file changes
      if (watchUnlisten) {
        watchUnlisten()
      }
      watchUnlisten = await listen<WatchEvent>('repo-changed', (event) => {
        const { kind } = event.payload
        switch (kind) {
          case 'status':
            // Working tree or index changed - refresh status
            get().refreshStatus()
            break
          case 'head':
          case 'refs':
            // Branches changed - could refresh branches here in the future
            get().refreshStatus()
            break
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      set({ error: message })
      console.error('Failed to open repo:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  // Close current repository
  closeRepo: async () => {
    // Stop file watcher
    try {
      await ipc.stopWatch()
    } catch (error) {
      console.error('Failed to stop watcher:', error)
    }

    // Clean up event listener
    if (watchUnlisten) {
      watchUnlisten()
      watchUnlisten = null
    }

    set({
      repoPath: null,
      summary: null,
      unstaged: [],
      staged: [],
      selectedFile: null,
      selectedFileStaged: false,
      error: null,
    })
  },

  // Refresh file status
  refreshStatus: async () => {
    const { repoPath } = get()
    if (!repoPath) return

    try {
      const status = await ipc.status(repoPath)
      set({
        unstaged: status.unstaged,
        staged: status.staged,
        error: null,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      set({ error: message })
      console.error('Failed to refresh status:', error)
    }
  },

  // Select a file to view diff
  selectFile: (file: FileChange, isStaged: boolean) => {
    set({
      selectedFile: file,
      selectedFileStaged: isStaged,
    })
  },

  // Clear file selection (close diff viewer)
  clearSelection: () => {
    set({
      selectedFile: null,
      selectedFileStaged: false,
    })
  },

  // Stage a file
  stageFile: async (path: string) => {
    const { repoPath, unstaged, staged } = get()
    if (!repoPath) return

    // Find the file in unstaged
    const fileToStage = unstaged.find((f) => f.path === path)
    if (!fileToStage) return

    // Optimistic update: move file from unstaged to staged
    const newUnstaged = unstaged.filter((f) => f.path !== path)
    const newStaged = [...staged, fileToStage]
    set({ unstaged: newUnstaged, staged: newStaged })

    try {
      await ipc.stage(repoPath, [path])
      // Refresh to get the real state from backend
      await get().refreshStatus()
    } catch (error) {
      // Rollback on error
      set({ unstaged, staged })
      console.error('Failed to stage file:', error)
      throw error // Re-throw so UI can show error toast
    }
  },

  // Unstage a file
  unstageFile: async (path: string) => {
    const { repoPath, unstaged, staged } = get()
    if (!repoPath) return

    // Find the file in staged
    const fileToUnstage = staged.find((f) => f.path === path)
    if (!fileToUnstage) return

    // Optimistic update: move file from staged to unstaged
    const newStaged = staged.filter((f) => f.path !== path)
    const newUnstaged = [...unstaged, fileToUnstage]
    set({ unstaged: newUnstaged, staged: newStaged })

    try {
      await ipc.unstage(repoPath, [path])
      // Refresh to get the real state from backend
      await get().refreshStatus()
    } catch (error) {
      // Rollback on error
      set({ unstaged, staged })
      console.error('Failed to unstage file:', error)
      throw error // Re-throw so UI can show error toast
    }
  },
}))
