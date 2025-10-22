import { AppShell } from './components/layout/AppShell'

function App() {
  return (
    <AppShell>
      {/* Main content area - will house commit graph, file tree, etc. */}
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-primary mb-2">GitFrisky</p>
          <p className="text-sm text-tertiary">Open a repository to get started</p>
          <p className="text-xs text-tertiary mt-4">Press ⌘O or use the sidebar</p>
        </div>
      </div>
    </AppShell>
  )
}

export default App
