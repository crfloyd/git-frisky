import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { Titlebar } from './Titlebar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { Inspector } from './Inspector'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Titlebar />

      <PanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar: 240px default, min 200px, max 320px */}
        <Panel
          defaultSize={20}
          minSize={16}
          maxSize={27}
          className="bg-background"
        >
          <Sidebar />
        </Panel>

        <PanelResizeHandle className="w-px bg-border hover:bg-border-strong transition-colors" />

        {/* Main Content: fluid, min 400px */}
        <Panel
          defaultSize={60}
          minSize={33}
          className="bg-background"
        >
          {children}
        </Panel>

        <PanelResizeHandle className="w-px bg-border hover:bg-border-strong transition-colors" />

        {/* Inspector: 360px default, min 280px, max 50% */}
        <Panel
          defaultSize={20}
          minSize={23}
          maxSize={50}
          className="bg-elevated"
        >
          <Inspector />
        </Panel>
      </PanelGroup>

      <StatusBar />
    </div>
  )
}
