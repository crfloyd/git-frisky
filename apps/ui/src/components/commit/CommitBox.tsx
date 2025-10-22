import { useState } from 'react'
import { cn } from '../../lib/utils'

type CommitBoxProps = {
  onCommit: (message: string) => Promise<void>
  stagedCount: number
  disabled?: boolean
}

// Conventional Commits types
const COMMIT_TYPES = [
  { value: 'feat', label: 'feat', color: 'bg-info' },
  { value: 'fix', label: 'fix', color: 'bg-danger' },
  { value: 'docs', label: 'docs', color: 'bg-accent' },
  { value: 'style', label: 'style', color: 'bg-modified' },
  { value: 'refactor', label: 'refactor', color: 'bg-warning' },
  { value: 'test', label: 'test', color: 'bg-success' },
  { value: 'chore', label: 'chore', color: 'bg-subtle' },
]

// Parse Conventional Commit format
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

export function CommitBox({ onCommit, stagedCount, disabled }: CommitBoxProps) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)

  const parsed = parseConventionalCommit(subject)
  const commitType = COMMIT_TYPES.find((t) => t.value === parsed.type)

  // Character count with color coding per UI_DESIGN.md
  const subjectLength = subject.length
  const subjectColor =
    subjectLength < 50
      ? 'text-foreground-dim'
      : subjectLength <= 72
        ? 'text-warning'
        : 'text-danger'

  const handleCommit = async () => {
    if (!subject.trim() || isCommitting || disabled || stagedCount === 0) {
      return
    }

    setIsCommitting(true)
    try {
      const fullMessage = description.trim()
        ? `${subject}\n\n${description}`
        : subject
      await onCommit(fullMessage)

      // Clear form on success
      setSubject('')
      setDescription('')
    } catch (error) {
      console.error('Commit failed:', error)
    } finally {
      setIsCommitting(false)
    }
  }

  const canCommit =
    subject.trim().length > 0 && stagedCount > 0 && !isCommitting && !disabled

  return (
    <div className="border-t border-border p-4 bg-elevated">
      {/* Subject input */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-medium text-foreground-muted">
            Commit message
          </label>
          {commitType && (
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded text-white',
                commitType.color
              )}
            >
              {commitType.label}
              {parsed.isBreaking && '!'}
            </span>
          )}
          <span className={cn('text-xs ml-auto', subjectColor)}>
            {subjectLength}/72
          </span>
        </div>

        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey && canCommit) {
              handleCommit()
            }
          }}
          placeholder="type: subject (max 72 chars)"
          className={cn(
            'w-full h-9 px-3 bg-base border rounded text-base font-mono',
            'border-border focus:border-focus focus:outline-none',
            'text-foreground placeholder:text-foreground-dim'
          )}
          disabled={disabled}
        />

        <p className="text-xs text-foreground-dim mt-1">
          Tip: Use Conventional Commits format: type(scope): subject
        </p>
      </div>

      {/* Description textarea */}
      <div className="mb-3">
        <label className="text-sm font-medium text-foreground-muted block mb-2">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional context or details..."
          rows={4}
          className={cn(
            'w-full px-3 py-2 bg-base border rounded text-sm font-mono resize-y',
            'border-border focus:border-focus focus:outline-none',
            'text-foreground placeholder:text-foreground-dim',
            'min-h-[80px]'
          )}
          disabled={disabled}
        />
      </div>

      {/* Commit button */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCommit}
          disabled={!canCommit}
          className={cn(
            'px-4 h-9 rounded text-sm font-medium transition-colors',
            canCommit
              ? 'bg-accent text-white hover:opacity-90'
              : 'bg-subtle text-disabled cursor-not-allowed'
          )}
        >
          {isCommitting ? 'Committing...' : `Commit (${stagedCount})`}
        </button>

        <span className="text-xs text-foreground-dim">⌘↵</span>
      </div>
    </div>
  )
}
