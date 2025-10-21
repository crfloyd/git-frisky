# GitFrisky

A modern Git client built with **Tauri** and **React** — fast diffs, clean commit graphs, and a lightweight native runtime.

---

## Setup

### 1. Prerequisites
Make sure you have:
- **Node.js ≥ 20** (includes Corepack)
- **pnpm ≥ 9** (`corepack enable && corepack prepare pnpm@9.12.1 --activate`)
- **Rust ≥ 1.76** (`rustup update`)
- **Cargo** and **Git**

### 2. Clone the repo
```bash
git clone https://github.com/<your-username>/git-frisky.git
cd git-frisky
````

### 3. Install dependencies

```bash
pnpm install
```

This installs both the frontend (Vite + React) and the Tauri backend CLI.

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

## Running the app (development)

Run the frontend and Tauri app side by side:

```bash
# Terminal 1: run the Vite dev server
pnpm -C apps/ui dev
```

```bash
# Terminal 2: launch Tauri with the Vite dev server
pnpm tauri dev --config apps/desktop/src-tauri/tauri.conf.json
```

This opens a desktop window that loads the live React UI.

---

## Building for release

```bash
# Build UI
pnpm -C apps/ui build

# Bundle native app (macOS, Windows, Linux)
pnpm tauri build --config apps/desktop/src-tauri/tauri.conf.json
```

Output binaries and installers will be under:

```
apps/desktop/src-tauri/target/release/bundle/
```

---

## Notes

* `apps/ui` uses Vite’s default dev port (`5173`).
* `tauri.conf.json` maps `devUrl` → [http://localhost:5173](http://localhost:5173) and `frontendDist` → `../../ui/dist`.
* Everything is workspace-managed via **pnpm** and **Cargo**.

---

## Contributing

Pull requests welcome!
Before committing, ensure:

```bash
pnpm lint && pnpm typecheck
cargo fmt && cargo clippy
```

---

## License

MIT © Corey Floyd
