import { X } from 'lucide-react'

type InspectorProps = {
  children?: React.ReactNode
  onClose: () => void
  filePath?: string
}

export function Inspector({ children, onClose, filePath }: InspectorProps) {
  return (
    <div className="h-full flex flex-col bg-elevated">
      {/* Header with file path and close button */}
      <div className="h-10 border-b border-border flex items-center justify-between px-4">
        <div className="flex-1 min-w-0">
          {filePath && (
            <p className="text-xs text-foreground-dim font-mono truncate">
              {filePath}
            </p>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-hover text-foreground-dim hover:text-foreground transition-colors ml-2 flex-shrink-0"
          aria-label="Close inspector"
          title="Close inspector ⌘I"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {children || (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-foreground-dim">Select a file to view diff</p>
          </div>
        )}
      </div>
    </div>
  )
}
