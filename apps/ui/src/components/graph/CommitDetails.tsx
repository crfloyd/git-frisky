import { useMemo } from 'react'
import { Copy, GitCommit, User, Calendar, GitBranch, FolderTree } from 'lucide-react'
import type { Commit } from '@gitfrisky/shared-types'
import { cn } from '../../lib/utils'

type CommitDetailsProps = {
  commit: Commit
  onCopySha?: () => void
  onViewWorkingTree?: () => void
}

// Format full date (not relative)
function formatFullDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Parse Conventional Commits format
function parseConventionalCommit(message: string): {
  type?: string
  scope?: string
  isBreaking: boolean
  subject: string
  body?: string
} {
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)/)
  if (!match) {
    // Not a conventional commit - treat entire first line as subject
    const lines = message.split('\n')
    return {
      subject: lines[0],
      body: lines.slice(1).join('\n').trim() || undefined,
      isBreaking: false,
    }
  }

  const lines = message.split('\n')
  return {
    type: match[1],
    scope: match[2],
    isBreaking: !!match[3],
    subject: match[4],
    body: lines.slice(1).join('\n').trim() || undefined,
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

export function CommitDetails({ commit, onCopySha, onViewWorkingTree }: CommitDetailsProps) {
  const parsed = useMemo(() => {
    const fullMessage = commit.message || commit.summary
    return parseConventionalCommit(fullMessage)
  }, [commit.message, commit.summary])

  const typeColor = parsed.type ? TYPE_COLORS[parsed.type] : undefined
  const fullDate = useMemo(() => formatFullDate(commit.timestamp), [commit.timestamp])

  // Short SHA (first 7 chars)
  const shortSha = commit.oid.substring(0, 7)

  return (
    <div className="h-full overflow-auto bg-base">
      {/* Top bar with "View Working Tree" button */}
      <div className="border-b border-border bg-elevated px-4 py-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Commit Details</h3>
        <button
          onClick={onViewWorkingTree}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-accent text-white hover:opacity-90"
        >
          <FolderTree size={14} />
          View Working Tree
        </button>
      </div>

      {/* Header */}
      <div className="border-b border-border p-4 bg-elevated">
        {/* Type badge + Subject */}
        <div className="flex items-start gap-2 mb-3">
          {parsed.type && (
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded text-white font-medium flex-shrink-0 uppercase mt-1',
                typeColor
              )}
            >
              {parsed.type}
              {parsed.isBreaking && '!'}
            </span>
          )}
          <h2 className="text-lg font-medium text-foreground leading-tight">
            {parsed.subject}
          </h2>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
          {/* SHA with copy button */}
          <div className="flex items-center gap-1.5">
            <GitCommit size={14} className="text-foreground-dim" />
            <code className="font-mono text-foreground">{shortSha}</code>
            <button
              onClick={onCopySha}
              className="p-0.5 rounded hover:bg-hover transition-colors"
              title="Copy full SHA"
            >
              <Copy size={12} className="text-foreground-dim hover:text-foreground" />
            </button>
          </div>

          {/* Author */}
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-foreground-dim" />
            <span>{commit.author}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-foreground-dim" />
            <span>{fullDate}</span>
          </div>
        </div>

        {/* Refs (branches/tags) */}
        {commit.refs && commit.refs.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <GitBranch size={14} className="text-foreground-dim" />
            {commit.refs.map((ref) => (
              <span
                key={ref}
                className="text-xs px-2 py-0.5 rounded bg-hover text-foreground-muted border border-border"
              >
                {ref}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      {parsed.body && (
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">Message</h3>
          <pre className="text-sm text-foreground-muted whitespace-pre-wrap font-normal">
            {parsed.body}
          </pre>
        </div>
      )}

      {/* Parent commits */}
      {commit.parents && commit.parents.length > 0 && (
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">
            {commit.parents.length === 1 ? 'Parent' : 'Parents'} ({commit.parents.length})
          </h3>
          <div className="space-y-1">
            {commit.parents.map((parentOid) => (
              <div
                key={parentOid}
                className="text-xs font-mono text-foreground-muted hover:text-foreground cursor-pointer"
              >
                {parentOid.substring(0, 7)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TODO: Files changed section */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-2">Files Changed</h3>
        <p className="text-xs text-foreground-dim italic">
          (Coming soon - will show file list with +/- stats)
        </p>
      </div>
    </div>
  )
}
