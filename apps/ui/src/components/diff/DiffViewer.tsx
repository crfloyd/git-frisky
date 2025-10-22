import React from 'react'
import { cn } from '../../lib/utils'
import type { DiffHunk } from '@gitfrisky/shared-types'

type DiffViewerProps = {
  hunks: DiffHunk[]
  onStageHunk?: (hunk: DiffHunk) => void
  onUnstageHunk?: (hunk: DiffHunk) => void
  isStaged?: boolean
  isNewFile?: boolean
  filePath?: string
  fileSize?: number
}

function DiffLineComponent({
  content,
  lineType,
  oldLineno,
  newLineno,
}: {
  content: string
  lineType: 'context' | 'addition' | 'deletion'
  oldLineno?: number | null
  newLineno?: number | null
}) {
  const colors = {
    context: 'bg-base text-foreground',
    addition: 'bg-added-bg text-added',
    deletion: 'bg-removed-bg text-removed',
  }

  const prefix = {
    context: ' ',
    addition: '+',
    deletion: '-',
  }

  return (
    <div className={cn('flex font-mono text-sm', colors[lineType])}>
      {/* Old line number */}
      <div className="w-8 flex-shrink-0 text-right px-1 text-xs text-foreground-dim select-none border-r border-border">
        {lineType !== 'addition' && oldLineno !== null && oldLineno !== undefined
          ? oldLineno
          : ''}
      </div>

      {/* New line number */}
      <div className="w-8 flex-shrink-0 text-right px-1 text-xs text-foreground-dim select-none border-r border-border">
        {lineType !== 'deletion' && newLineno !== null && newLineno !== undefined
          ? newLineno
          : ''}
      </div>

      {/* Line content with prefix */}
      <div className="flex-1 pl-2 whitespace-pre overflow-x-auto">
        <span className="text-foreground-dim select-none mr-1">{prefix[lineType]}</span>
        {content}
      </div>
    </div>
  )
}

function HunkHeader({
  header,
  onStage,
  onUnstage,
  isStaged = false,
  disabled = false,
}: {
  header: string
  onStage?: () => void
  onUnstage?: () => void
  isStaged?: boolean
  disabled?: boolean
}) {
  const hasAction = onStage || onUnstage
  const buttonText = isStaged ? 'Unstage Hunk' : 'Stage Hunk'
  const handleClick = isStaged ? onUnstage : onStage

  return (
    <div className="flex items-center justify-between bg-subtle border-y border-border px-3 py-2 sticky top-0 z-10 group">
      <span className="text-xs font-mono text-foreground-dim">{header}</span>
      {hasAction && handleClick && (
        <button
          onClick={handleClick}
          disabled={disabled}
          className="text-xs px-2 py-1 rounded bg-hover hover:bg-active transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonText}
        </button>
      )}
    </div>
  )
}

export function DiffViewer({
  hunks,
  onStageHunk,
  onUnstageHunk,
  isStaged = false,
  isNewFile = false,
  filePath,
  fileSize = 0
}: DiffViewerProps) {
  const [forceShow, setForceShow] = React.useState(false)

  // Warn for large files (>10KB or >500 lines)
  const totalLines = hunks.reduce((sum, hunk) => sum + hunk.lines.length, 0)
  const isLargeFile = fileSize > 10 * 1024 || totalLines > 500

  if (hunks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-foreground-dim">No diff to display</p>
      </div>
    )
  }

  if (isLargeFile && !forceShow) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-sm text-foreground mb-2">
          Large file detected ({Math.round(fileSize / 1024)}KB, {totalLines} lines)
        </p>
        <p className="text-xs text-foreground-dim mb-4">
          Displaying large diffs may impact performance
        </p>
        <button
          onClick={() => setForceShow(true)}
          className="px-4 py-2 text-sm rounded bg-accent text-foreground hover:opacity-90 transition-opacity"
        >
          Load Anyway
        </button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-base">
      {hunks.map((hunk, hunkIndex) => (
        <div key={hunkIndex} className="border-b border-border last:border-b-0">
          <HunkHeader
            header={hunk.header}
            onStage={isNewFile ? undefined : (onStageHunk ? () => onStageHunk(hunk) : undefined)}
            onUnstage={isNewFile ? undefined : (onUnstageHunk ? () => onUnstageHunk(hunk) : undefined)}
            isStaged={isStaged}
          />
          <div>
            {hunk.lines.map((line, lineIndex) => (
              <DiffLineComponent
                key={lineIndex}
                content={line.content}
                lineType={line.lineType}
                oldLineno={line.oldLineno}
                newLineno={line.newLineno}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
