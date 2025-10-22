import { useEffect, useState, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Commit } from '@gitfrisky/shared-types'
import { ipc } from '../../lib/ipc'
import { computeLaneLayout, applyLaneLayout, type LaneLayout } from '../../lib/laneLayout'
import { CommitRow } from './CommitRow'
import { FolderGit2 } from 'lucide-react'

type CommitGraphProps = {
  repoPath: string | null
  headCommitOid?: string | null // OID of the HEAD commit
  selectedCommitOid?: string | null // Externally controlled selection
  onCommitSelect?: (oid: string) => void // Callback when commit is clicked
}

export function CommitGraph({
  repoPath,
  headCommitOid,
  selectedCommitOid,
  onCommitSelect,
}: CommitGraphProps) {
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(false)
  const [laneLayout, setLaneLayout] = useState<LaneLayout>(new Map())

  // Load commits when repo opens
  useEffect(() => {
    if (!repoPath) {
      setCommits([])
      return
    }

    const loadCommits = async () => {
      setLoading(true)
      try {
        const rawCommits = await ipc.log(repoPath, 500)

        // Compute lane layout
        const layout = computeLaneLayout(rawCommits)
        setLaneLayout(layout)

        // Apply layout to commits
        const commitsWithLanes = applyLaneLayout(rawCommits, layout)
        setCommits(commitsWithLanes)
      } catch (error) {
        console.error('Failed to load commits:', error)
        setCommits([])
      } finally {
        setLoading(false)
      }
    }

    loadCommits()
  }, [repoPath])

  // Virtualization setup
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null)
  const virtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => parentRef,
    estimateSize: () => 44, // 44px row height from UI_DESIGN.md
    overscan: 20, // Render 20 rows above/below viewport
  })

  // Calculate max lane for graph width
  const maxLane = useMemo(() => {
    return Math.max(...Array.from(laneLayout.values()).map(l => l.lane), 0)
  }, [laneLayout])

  // Determine HEAD commit OID
  // If not provided explicitly, use first commit (log walks from HEAD by default)
  const actualHeadOid = headCommitOid || (commits.length > 0 ? commits[0].oid : null)

  // Auto-scroll to HEAD commit when commits load
  useEffect(() => {
    if (commits.length > 0 && actualHeadOid) {
      // Find the index of HEAD commit
      const headIndex = commits.findIndex(c => c.oid === actualHeadOid)
      if (headIndex >= 0 && parentRef) {
        // Scroll to HEAD (usually index 0, but could be elsewhere)
        virtualizer.scrollToIndex(headIndex, { align: 'start' })
      }
    }
  }, [commits.length, actualHeadOid]) // Only run when commits first load

  // Keyboard navigation (↑↓ arrows, Home, End)
  useEffect(() => {
    if (!parentRef || commits.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = selectedCommitOid
        ? commits.findIndex(c => c.oid === selectedCommitOid)
        : -1

      switch (e.key) {
        case 'ArrowDown':
        case 'j': // Vim-style
          e.preventDefault()
          if (currentIndex < commits.length - 1) {
            const nextIndex = currentIndex + 1
            onCommitSelect?.(commits[nextIndex].oid)
            virtualizer.scrollToIndex(nextIndex, { align: 'auto' })
          }
          break

        case 'ArrowUp':
        case 'k': // Vim-style
          e.preventDefault()
          if (currentIndex > 0) {
            const prevIndex = currentIndex - 1
            onCommitSelect?.(commits[prevIndex].oid)
            virtualizer.scrollToIndex(prevIndex, { align: 'auto' })
          } else if (currentIndex < 0 && commits.length > 0) {
            // No selection - select first commit
            onCommitSelect?.(commits[0].oid)
            virtualizer.scrollToIndex(0, { align: 'start' })
          }
          break

        case 'Home':
          e.preventDefault()
          // Jump to HEAD commit
          if (actualHeadOid) {
            const headIndex = commits.findIndex(c => c.oid === actualHeadOid)
            if (headIndex >= 0) {
              onCommitSelect?.(commits[headIndex].oid)
              virtualizer.scrollToIndex(headIndex, { align: 'start' })
            }
          }
          break

        case 'End':
          e.preventDefault()
          // Jump to last commit
          if (commits.length > 0) {
            const lastIndex = commits.length - 1
            onCommitSelect?.(commits[lastIndex].oid)
            virtualizer.scrollToIndex(lastIndex, { align: 'end' })
          }
          break
      }
    }

    // Add listener to parent container (graph viewport)
    parentRef.addEventListener('keydown', handleKeyDown)

    // Make parent focusable so it can receive keyboard events
    parentRef.setAttribute('tabindex', '0')

    return () => {
      parentRef.removeEventListener('keydown', handleKeyDown)
    }
  }, [parentRef, commits, selectedCommitOid, actualHeadOid, virtualizer])

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-foreground-dim border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-foreground-dim">Loading commits...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (commits.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-base">
        <div className="flex flex-col items-center gap-4 text-center">
          <FolderGit2 size={64} className="text-foreground-dim" strokeWidth={1.5} />
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">No commits yet</h3>
            <p className="text-base text-foreground-dim">
              Make your first commit to see the graph.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main graph view
  return (
    <div
      ref={setParentRef}
      className="h-full overflow-auto bg-base focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-inset"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const commit = commits[virtualRow.index]
          const layout = laneLayout.get(commit.oid)

          return (
            <div
              key={commit.oid}
              data-index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <CommitRow
                commit={commit}
                lane={layout?.lane ?? 0}
                parentLanes={layout?.parentLanes ?? []}
                activeLanes={layout?.activeLanes ?? []}
                branchOffLanes={layout?.branchOffLanes ?? new Map()}
                maxLane={maxLane}
                isSelected={commit.oid === selectedCommitOid}
                isHead={commit.oid === actualHeadOid}
                isFirstRow={virtualRow.index === 0}
                hasNoParents={layout?.hasNoParents ?? false}
                lanesFromAbove={layout?.lanesFromAbove ?? []}
                onClick={() => onCommitSelect?.(commit.oid)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
