import { useMemo } from 'react'
import type { Commit } from '@gitfrisky/shared-types'
import { cn } from '../../lib/utils'
import { GraphLanes } from './GraphLanes'

// Short time format: "2h ago", "3d ago", "5mo ago"
function formatShortTime(timestamp: number): string {
  const now = Date.now()
  const date = new Date(timestamp * 1000)
  const seconds = Math.floor((now - date.getTime()) / 1000)

  const intervals = {
    y: 31536000,
    mo: 2592000,
    d: 86400,
    h: 3600,
    m: 60,
  }

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval}${unit} ago`
    }
  }

  return 'just now'
}

type CommitRowProps = {
  commit: Commit
  lane: number
  parentLanes: number[]
  activeLanes: number[] // Lanes with active branches
  branchOffLanes: Map<number, number> // Map of lane -> sourceLane for branches starting here
  maxLane: number
  isSelected: boolean
  isHead: boolean // Is this the HEAD commit?
  isFirstRow: boolean // Is this the first visible row?
  hasNoParents: boolean // Does this commit have no parents? (final commit in branch)
  onClick: () => void
}

// Parse Conventional Commits format
function parseConventionalCommit(message: string): {
  type?: string
  scope?: string
  isBreaking: boolean
  subject: string
} {
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)/)
  if (!match) {
    return { subject: message, isBreaking: false }
  }

  return {
    type: match[1],
    scope: match[2],
    isBreaking: !!match[3],
    subject: match[4],
  }
}

// Type badge colors
const TYPE_COLORS: Record<string, string> = {
  feat: 'bg-info',
  fix: 'bg-danger',
  docs: 'bg-accent',
  style: 'bg-modified',
  refactor: 'bg-warning',
  test: 'bg-success',
  chore: 'bg-subtle',
}

export function CommitRow({
  commit,
  lane,
  parentLanes,
  activeLanes,
  branchOffLanes,
  maxLane,
  isSelected,
  isHead,
  isFirstRow,
  hasNoParents,
  onClick,
}: CommitRowProps) {
  // Parse commit message for conventional commits badge
  const parsed = useMemo(() => parseConventionalCommit(commit.summary), [commit.summary])
  const typeColor = parsed.type ? TYPE_COLORS[parsed.type] : undefined

  // Format relative time (short format: "2h ago")
  const relativeTime = useMemo(() => formatShortTime(commit.timestamp), [commit.timestamp])

  // Calculate dynamic graph width based on number of lanes
  // Min 120px, max 400px (accommodates up to ~25 lanes at full width)
  const LANE_WIDTH = 16
  const graphWidth = Math.min(Math.max((maxLane + 1) * LANE_WIDTH, 120), 400)

  return (
    <div
      className={cn(
        'h-11 flex items-center cursor-pointer transition-colors',
        'border-l-2 pl-3',
        isHead && !isSelected
          ? 'bg-base hover:bg-hover border-l-success' // HEAD: green border
          : isSelected
          ? 'bg-active border-l-accent' // Selected: blue border
          : 'border-transparent bg-base hover:bg-hover' // Default: no border
      )}
      onClick={onClick}
    >
      {/* Graph area - dynamic width based on lanes */}
      <div className="flex-shrink-0 h-full" style={{ width: `${graphWidth}px` }}>
        <GraphLanes
          currentLane={lane}
          parentLanes={parentLanes}
          activeLanes={activeLanes}
          branchOffLanes={branchOffLanes}
          maxLane={maxLane}
          commitOid={commit.oid}
          containerWidth={graphWidth}
          isFirstRow={isFirstRow}
          hasNoParents={hasNoParents}
        />
      </div>

      {/* Commit info - fluid */}
      <div className="flex-1 min-w-0 flex items-center gap-2 pr-3">
        {/* Type badge */}
        {parsed.type && (
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded text-white font-medium flex-shrink-0 uppercase',
              typeColor
            )}
          >
            {parsed.type}
            {parsed.isBreaking && '!'}
          </span>
        )}

        {/* Subject */}
        <span className="text-sm font-normal text-foreground truncate">
          {parsed.subject}
        </span>
      </div>

      {/* Time - fixed 80px */}
      <div className="w-[80px] flex-shrink-0 pr-3 text-right">
        <span className="text-xs text-foreground-dim">
          {relativeTime}
        </span>
      </div>
    </div>
  )
}
