# GitFrisky

**Fast, minimal, keyboard-first Git client for power users**

Built with Tauri + React + Rust (libgit2). Single-repo focus, <100ms graph rendering, professional UI.

---

## Quick Start

### 1. Check Environment
```bash
pnpm check-env
```
This validates all prerequisites (Node, Rust, platform dependencies).

### 2. Install Dependencies
```bash
pnpm install
```
Installs frontend (React) and Tauri CLI. Rust dependencies build on first run.

### 3. Start Development
```bash
pnpm dev
```
Opens Tauri window with React dev server (hot reload enabled).

---

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** — Complete technical architecture, IPC API, implementation guide
- **[UI_DESIGN.md](./UI_DESIGN.md)** — Design system, component specs, color palette
- **[REVIEW_SUMMARY.md](./REVIEW_SUMMARY.md)** — VP review, handoff checklist, quality gates

**Start here if implementing:**
1. Read CLAUDE.md Sections 0-7 (architecture, security, types, git2 patterns)
2. Read UI_DESIGN.md (design system, all 12 components)
3. Follow CLAUDE.md Section 24 (200+ task checklist, phase-by-phase)

### 4. Scaffolded structure

```
apps/
  ui/                → React frontend (Vite)
  desktop/
    src-tauri/       → Tauri backend (Rust)
packages/
  shared-types/      → Shared TS types
  parsers/           → Diff & graph utilities
```

---

## Development Workflow

```bash
# Run full dev environment (Tauri + React with HMR)
pnpm dev

# Run only React dev server (for UI-only work)
pnpm dev:ui

# Type checking
pnpm typecheck

# Linting (ESLint + Clippy)
pnpm lint

# Formatting (Prettier + rustfmt)
pnpm format

# Testing
pnpm test              # Run all tests (Rust + React)
pnpm test:e2e          # Run Playwright E2E tests

# Build production bundle
pnpm build             # Builds UI + native app (DMG/MSI/AppImage)
```

---

## Project Structure

```
git-frisky/
├── apps/
│   ├── ui/                      # React frontend (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── components/      # UI components (layout, graph, diff, etc.)
│   │   │   ├── stores/          # Zustand state (repo, diff, graph, ui)
│   │   │   ├── lib/             # Utilities (ipc, format, keyboard)
│   │   │   └── styles/          # Tailwind CSS
│   │   └── package.json
│   │
│   └── desktop/
│       └── src-tauri/           # Tauri backend (Rust)
│           ├── src/
│           │   ├── api/         # IPC commands (repo, graph, diff, etc.)
│           │   ├── domain/      # Domain types (Commit, Branch, etc.)
│           │   └── util/        # Utilities (errors, git_ext, io)
│           └── Cargo.toml
│
├── packages/
│   ├── shared-types/            # TypeScript types (mirrors Rust types)
│   └── parsers/                 # Diff/graph utilities
│
├── docs/
│   ├── decisions/               # Architecture Decision Records (ADRs)
│   └── screenshots/             # UI screenshots
│
├── CLAUDE.md                    # Technical architecture (1300+ lines)
├── UI_DESIGN.md                 # Design system (1100+ lines)
└── REVIEW_SUMMARY.md            # VP review, quality gates
```

---

## Architecture Overview

- **Frontend**: React 19 + TypeScript + Tailwind + shadcn/ui + Zustand + React Query
- **Backend**: Rust + Tauri v2 + libgit2 (git2 crate) + notify (file watching)
- **IPC**: Tauri commands (request/response) + events (streaming progress)
- **Performance**: Virtualized rendering (react-virtual), Rust for heavy git ops, <100ms targets

**Key Design Decisions:**
- Single-repo model (like Sublime Merge, not multi-tab)
- libgit2 over shell git (speed, control)
- Keyboard-first UX (command palette, shortcuts)
- Minimal UI (information-dense without clutter)

See [CLAUDE.md](./CLAUDE.md) for complete architecture.

---

## Performance Targets

- App launch: <2s
- Status refresh: <50ms (1000 files)
- Commit graph render: <100ms (1000 commits)
- Diff display: <100ms (1000 lines)

See CLAUDE.md Section 0 for all targets.

---

## Contributing

**Before submitting PRs:**
1. Read [CLAUDE.md](./CLAUDE.md) Sections 0-7 (architecture)
2. Follow phase-by-phase checklist (CLAUDE.md Section 24)
3. Meet quality gates (REVIEW_SUMMARY.md)

**Before committing:**
```bash
pnpm format            # Format code
pnpm lint              # Check lint (0 warnings required)
pnpm typecheck         # TypeScript check
pnpm test              # Run tests (>70% Rust, >60% frontend coverage)
```

**Testing Strategy:**
- Unit tests: Rust (cargo test), React (Vitest)
- Integration: Playwright E2E
- Performance: Benchmark critical paths (see CLAUDE.md Section 12)

**Code Review Checklist:**
- [ ] Follows design system (UI_DESIGN.md)
- [ ] Meets performance targets
- [ ] Tests included (unit + integration)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

---

## License

MIT © Corey Floyd
