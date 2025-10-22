import { useState, useEffect } from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { Titlebar } from './Titlebar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { Inspector } from './Inspector'

type AppShellProps = {
  children: React.ReactNode
  inspectorContent?: React.ReactNode
  inspectorVisible?: boolean
  inspectorFilePath?: string
  onInspectorToggle?: (visible: boolean) => void
}

export function AppShell({
  children,
  inspectorContent,
  inspectorVisible = false,
  inspectorFilePath,
  onInspectorToggle
}: AppShellProps) {
  // Global keyboard shortcut for toggling inspector (⌘I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onInspectorToggle?.(!inspectorVisible)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [inspectorVisible, onInspectorToggle])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Titlebar />

      <PanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar: Hidden until implemented */}
        {/*
        <Panel
          defaultSize={20}
          minSize={16}
          maxSize={27}
          className="bg-background"
        >
          <Sidebar />
        </Panel>
        <PanelResizeHandle className="w-px bg-border hover:bg-border-strong transition-colors" />
        */}

        {/* Main Content: narrower to give more space to diff viewer */}
        <Panel
          defaultSize={inspectorVisible ? 35 : 100}
          minSize={25}
          maxSize={inspectorVisible ? 50 : 40}
          className="bg-background"
        >
          {children}
        </Panel>

        {/* Inspector: larger default to show diff viewer prominently */}
        {inspectorVisible && (
          <>
            <PanelResizeHandle className="w-px bg-border hover:bg-border-strong transition-colors" />
            <Panel
              defaultSize={65}
              minSize={50}
              maxSize={75}
              className="bg-elevated"
            >
              <Inspector onClose={() => onInspectorToggle?.(false)} filePath={inspectorFilePath}>
                {inspectorContent}
              </Inspector>
            </Panel>
          </>
        )}
      </PanelGroup>

      <StatusBar />
    </div>
  )
}
