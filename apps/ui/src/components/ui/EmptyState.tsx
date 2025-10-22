import { FolderOpen, GitCommit, Check } from 'lucide-react'

type EmptyStateProps = {
  variant: 'no-repo' | 'no-commits' | 'no-changes'
}

export function EmptyState({ variant }: EmptyStateProps) {
  const config = {
    'no-repo': {
      icon: <FolderOpen size={64} className="text-foreground-dim" />,
      title: 'Open a Repository',
      description: 'Open a folder to view its Git history',
      action: (
        <button className="mt-4 px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
          Open Folder
        </button>
      ),
      hint: 'or press ⌘O',
    },
    'no-commits': {
      icon: <GitCommit size={64} className="text-foreground-dim" />,
      title: 'No commits yet',
      description: 'Make your first commit to see the graph.',
      action: null,
      hint: null,
    },
    'no-changes': {
      icon: <Check size={64} className="text-foreground-dim" />,
      title: 'Working tree clean',
      description: 'No changes to commit.',
      action: null,
      hint: null,
    },
  }

  const { icon, title, description, action, hint } = config[variant]

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {icon}
      <h2 className="text-lg font-medium text-foreground mt-4">{title}</h2>
      <p className="text-base text-foreground-dim mt-2">{description}</p>
      {action}
      {hint && <p className="text-xs text-foreground-dim mt-4">{hint}</p>}
    </div>
  )
}
