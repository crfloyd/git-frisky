import { useState } from 'react'
import { ChevronRight, ChevronDown, Plus, Pencil, Trash, FileCheck, AlertCircle, MoveRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { FileChange } from '@gitfrisky/shared-types'

type FileTreeProps = {
  unstaged: FileChange[]
  staged: FileChange[]
  selectedFilePath?: string
  selectedFileStaged?: boolean
  onSelectFile?: (file: FileChange, isStaged: boolean) => void
  onStageFile?: (path: string) => void
  onUnstageFile?: (path: string) => void
}

type TreeNode = {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: TreeNode[]
  file?: FileChange
  depth: number
}

// Helper to build tree with path prefix tracking
function buildTreeWithPrefix(files: FileChange[], pathPrefix: string, depth: number): TreeNode[] {
  const tree: TreeNode[] = []
  const folders = new Map<string, FileChange[]>()

  for (const file of files) {
    const relativePath = pathPrefix ? file.path.substring(pathPrefix.length) : file.path
    const parts = relativePath.split('/').filter(p => p.length > 0)

    if (parts.length === 1) {
      // Direct file in this level
      tree.push({
        name: parts[0],
        path: file.path, // Keep original full path
        type: 'file',
        file, // Keep original file object with full path
        depth,
      })
    } else {
      // File in subfolder
      const folderName = parts[0]
      if (!folders.has(folderName)) {
        folders.set(folderName, [])
      }
      folders.get(folderName)!.push(file) // Keep original file object
    }
  }

  // Add folders to tree
  for (const [folderName, folderFiles] of folders.entries()) {
    const newPrefix = pathPrefix ? `${pathPrefix}${folderName}/` : `${folderName}/`
    tree.push({
      name: folderName,
      path: newPrefix,
      type: 'folder',
      children: buildTreeWithPrefix(folderFiles, newPrefix, depth + 1),
      depth,
    })
  }

  return tree.sort((a, b) => {
    // Folders first, then files
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}

// Build tree structure from flat file list
function buildTree(files: FileChange[], depth = 0): TreeNode[] {
  return buildTreeWithPrefix(files, '', depth)
}

// Status badge component with icons
function StatusBadge({ status }: { status: string }) {
  const iconMap = {
    M: { Icon: Pencil, className: 'text-modified' },        // Modified - orange
    A: { Icon: FileCheck, className: 'text-added' },        // Added - green
    D: { Icon: Trash, className: 'text-removed' },          // Deleted - red
    U: { Icon: Plus, className: 'text-added' },             // Untracked - green (changed from blue)
    C: { Icon: AlertCircle, className: 'text-conflict' },   // Conflict - yellow
    R: { Icon: MoveRight, className: 'text-accent' },       // Renamed - purple
  }

  const config = iconMap[status as keyof typeof iconMap] || { Icon: FileCheck, className: 'text-foreground-dim' }
  const { Icon, className } = config

  return (
    <div className="flex items-center justify-center ml-2">
      <Icon size={12} className={className} strokeWidth={2} />
    </div>
  )
}

// Tree item component
function TreeItem({
  node,
  isStaged,
  selectedFilePath,
  selectedFileStaged,
  onSelectFile,
  onToggleStage,
}: {
  node: TreeNode
  isStaged: boolean
  selectedFilePath?: string
  selectedFileStaged?: boolean
  onSelectFile?: (file: FileChange, isStaged: boolean) => void
  onToggleStage?: (path: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Calculate if this specific item is selected (only files, not folders, and only when something is actually selected)
  const isSelected = selectedFilePath !== undefined && node.file?.path === selectedFilePath && isStaged === selectedFileStaged

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded)
    } else if (node.file) {
      onSelectFile?.(node.file, isStaged)
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (node.file) {
      onToggleStage?.(node.file.path)
    }
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center py-0.5 px-1.5 cursor-pointer',
          'hover:bg-hover transition-colors',
          'text-xs font-mono text-foreground-muted',
          isSelected && 'bg-active'
        )}
        style={{ paddingLeft: `${6 + node.depth * 12}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' ? (
          <>
            {isExpanded ? (
              <ChevronDown size={12} className="text-foreground-dim mr-1" />
            ) : (
              <ChevronRight size={12} className="text-foreground-dim mr-1" />
            )}
            <span className="flex-1">{node.name}</span>
          </>
        ) : (
          <>
            <input
              type="checkbox"
              checked={isStaged}
              onChange={handleCheckboxChange}
              className="mr-1.5 w-2.5 h-2.5"
            />
            <span className="flex-1 mr-1.5 truncate">{node.name}</span>
            {node.file && <StatusBadge status={node.file.status} />}
          </>
        )}
      </div>

      {node.type === 'folder' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              isStaged={isStaged}
              selectedFilePath={selectedFilePath}
              selectedFileStaged={selectedFileStaged}
              onSelectFile={onSelectFile}
              onToggleStage={onToggleStage}
            />
          ))}
        </div>
      )}
    </>
  )
}

export function FileTree({
  unstaged,
  staged,
  selectedFilePath,
  selectedFileStaged,
  onSelectFile,
  onStageFile,
  onUnstageFile,
}: FileTreeProps) {
  const [unstagedExpanded, setUnstagedExpanded] = useState(true)
  const [stagedExpanded, setStagedExpanded] = useState(true)

  const unstagedTree = buildTree(unstaged)
  const stagedTree = buildTree(staged)

  const handleStageAll = () => {
    unstaged.forEach((file) => {
      onStageFile?.(file.path)
    })
  }

  const handleUnstageAll = () => {
    staged.forEach((file) => {
      onUnstageFile?.(file.path)
    })
  }

  return (
    <div className="h-full flex flex-col bg-elevated">
      {/* UNSTAGED Section - Independent scrollable area */}
      <div className="flex flex-col flex-1 min-h-0 border-b border-border">
        {/* Sticky Header */}
        <div
          className="flex items-center justify-between px-3 py-1.5 bg-elevated/50 border-b border-border cursor-pointer hover:bg-hover transition-colors sticky top-0 z-10"
          onClick={() => setUnstagedExpanded(!unstagedExpanded)}
        >
          <div className="flex items-center gap-1.5">
            {unstagedExpanded ? (
              <ChevronDown size={12} className="text-foreground-dim" />
            ) : (
              <ChevronRight size={12} className="text-foreground-dim" />
            )}
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
              Unstaged Changes
            </span>
            <span className="text-[10px] font-medium text-foreground-dim">({unstaged.length})</span>
          </div>
          {unstaged.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStageAll()
              }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-hover hover:bg-active transition-colors text-foreground-muted"
            >
              Stage All
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        {unstagedExpanded && (
          <div className="flex-1 overflow-y-auto px-1.5 py-1">
            {unstaged.length > 0 ? (
              unstagedTree.map((node) => (
                <TreeItem
                  key={node.path}
                  node={node}
                  isStaged={false}
                  selectedFilePath={selectedFilePath}
                  selectedFileStaged={selectedFileStaged}
                  onSelectFile={onSelectFile}
                  onToggleStage={onStageFile}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[10px] text-foreground-dim">No unstaged changes</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STAGED Section - Independent scrollable area */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Sticky Header */}
        <div
          className="flex items-center justify-between px-3 py-1.5 bg-elevated/50 border-b border-border cursor-pointer hover:bg-hover transition-colors sticky top-0 z-10"
          onClick={() => setStagedExpanded(!stagedExpanded)}
        >
          <div className="flex items-center gap-1.5">
            {stagedExpanded ? (
              <ChevronDown size={12} className="text-foreground-dim" />
            ) : (
              <ChevronRight size={12} className="text-foreground-dim" />
            )}
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
              Staged Changes
            </span>
            <span className="text-[10px] font-medium text-foreground-dim">({staged.length})</span>
          </div>
          {staged.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleUnstageAll()
              }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-hover hover:bg-active transition-colors text-foreground-muted"
            >
              Unstage All
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        {stagedExpanded && (
          <div className="flex-1 overflow-y-auto px-1.5 py-1">
            {staged.length > 0 ? (
              stagedTree.map((node) => (
                <TreeItem
                  key={node.path}
                  node={node}
                  isStaged={true}
                  selectedFilePath={selectedFilePath}
                  selectedFileStaged={selectedFileStaged}
                  onSelectFile={onSelectFile}
                  onToggleStage={onUnstageFile}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[10px] text-foreground-dim">No staged changes</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
