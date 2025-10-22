import { X, FileText, Info, GitCommit } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useState } from 'react'

type Tab = 'diff' | 'fileInfo' | 'commitDetails'

export function Inspector() {
  const [activeTab, setActiveTab] = useState<Tab>('diff')

  return (
    <div className="h-full flex flex-col bg-elevated">
      {/* Header with tabs and close button */}
      <div className="h-10 border-b border-border flex items-center justify-between px-4">
        <div className="flex gap-1">
          <TabButton
            icon={<FileText size={14} />}
            label="Diff"
            active={activeTab === 'diff'}
            onClick={() => setActiveTab('diff')}
          />
          <TabButton
            icon={<Info size={14} />}
            label="File Info"
            active={activeTab === 'fileInfo'}
            onClick={() => setActiveTab('fileInfo')}
          />
          <TabButton
            icon={<GitCommit size={14} />}
            label="Commit"
            active={activeTab === 'commitDetails'}
            onClick={() => setActiveTab('commitDetails')}
          />
        </div>

        <button
          className="p-1 rounded hover:bg-hover text-tertiary hover:text-primary transition-colors"
          aria-label="Close inspector"
          title="Close inspector ⌘I"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'diff' && (
          <div className="text-sm text-tertiary">
            Select a file to view diff
          </div>
        )}
        {activeTab === 'fileInfo' && (
          <div className="text-sm text-tertiary">
            Select a file to view info
          </div>
        )}
        {activeTab === 'commitDetails' && (
          <div className="text-sm text-tertiary">
            Select a commit to view details
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors",
        active
          ? "bg-hover text-primary font-medium"
          : "text-tertiary hover:text-secondary hover:bg-hover/50"
      )}
    >
      {icon}
      {label}
    </button>
  )
}
