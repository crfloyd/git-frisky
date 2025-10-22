import { useState } from 'react'
import { ipc } from './lib/ipc'
import type { RepoSummary } from '@gitfrisky/shared-types'

function App() {
  const [summary, setSummary] = useState<RepoSummary | null>(null)
  const [repoPath, setRepoPath] = useState('/Users/coreyfloyd/git/personal/git-frisky')
  const [error, setError] = useState<string | null>(null)

  const openRepo = async () => {
    try {
      setError(null)
      const result = await ipc.openRepo(repoPath)
      setSummary(result)
      console.log('Repo opened:', result)
    } catch (e: any) {
      setError(e.message)
      console.error('Error opening repo:', e)
    }
  }

  return (
    <div className="p-6 h-screen bg-background text-foreground">
      <h1 className="text-xl font-medium mb-6">GitFrisky - IPC Test</h1>

      <div className="mb-6 flex gap-3">
        <input
          type="text"
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
          placeholder="Path to git repository"
          className="flex-1 max-w-xl px-3 py-2 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={openRepo}
          className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Open Repository
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[hsl(var(--color-removed-bg))] border border-[hsl(var(--color-removed))] rounded text-sm">
          <span className="text-[hsl(var(--color-removed))] font-medium">Error:</span> {error}
        </div>
      )}

      {summary && (
        <div className="space-y-6">
          <div>
            <h2 className="text-md font-medium mb-3">Repository Summary</h2>
            <pre className="p-4 bg-secondary border border-border rounded text-xs font-mono overflow-auto max-h-64">
              {JSON.stringify(summary, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="text-md font-medium mb-3">Branches ({summary.branches.length})</h3>
            <ul className="space-y-2">
              {summary.branches.map(branch => (
                <li key={branch.fullName} className="text-sm">
                  {branch.isHead && <span className="text-[hsl(var(--color-success))] mr-2">✓</span>}
                  <span className="font-medium">{branch.name}</span>
                  {branch.ahead > 0 && <span className="ml-2 text-[hsl(var(--color-info))]">↑{branch.ahead}</span>}
                  {branch.behind > 0 && <span className="ml-2 text-[hsl(var(--color-warning))]">↓{branch.behind}</span>}
                  {branch.upstream && <span className="ml-2 text-secondary-foreground">→ {branch.upstream}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
