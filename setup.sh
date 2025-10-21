#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash setup-structure.sh              # minimal (safe before any tooling)
#   MODE=extended bash setup-structure.sh  # also writes root workspace files

MODE="${MODE:-minimal}"

echo "▶ git-frisky structure — mode: $MODE"

dirs=(
  "apps/desktop/src-tauri/src/api"
  "apps/desktop/src-tauri/src/domain"
  "apps/desktop/src-tauri/src/util"
  "apps/ui/src/components"
  "apps/ui/src/stores"
  "apps/ui/src/lib"
  "apps/ui/src/styles"
  "apps/ui/src/assets"
  "packages/shared-types/src"
  "packages/parsers/src"
  "docs/branding"
  "docs/decisions"
  "docs/screenshots"
  "fixtures/repo-small"
  "fixtures/repo-merge-monster"
  "scripts"
  ".github/workflows"
  ".github/ISSUE_TEMPLATE"
  ".vscode"
)

for d in "${dirs[@]}"; do mkdir -p "$d"; done

# Placeholders only (won't bother tooling)
placeholders=(
  "apps/ui/src/components/.gitkeep"
  "apps/ui/src/stores/.gitkeep"
  "apps/ui/src/lib/.gitkeep"
  "apps/ui/src/styles/.gitkeep"
  "apps/ui/src/assets/.gitkeep"
  "docs/branding/.gitkeep"
  "docs/decisions/.gitkeep"
  "docs/screenshots/.gitkeep"
  "fixtures/repo-small/.gitkeep"
  "fixtures/repo-merge-monster/.gitkeep"
)
for f in "${placeholders[@]}"; do [[ -e "$f" ]] || : > "$f"; done

# Safe meta files that won’t collide with scaffolding
safe_meta=(
  ".editorconfig"
  ".gitignore"
  "LICENSE"
  "CHANGELOG.md"
  "CONTRIBUTING.md"
  "CODE_OF_CONDUCT.md"
  "README.md"
  ".vscode/settings.json"
  ".github/ISSUE_TEMPLATE/bug_report.md"
  ".github/ISSUE_TEMPLATE/feature_request.md"
  ".github/workflows/ci.yml"
  ".github/workflows/release.yml"
  ".github/workflows/codeql.yml"
  "scripts/dev.sh"
  "scripts/build-all.sh"
  "scripts/release-notes.ts"
)
for f in "${safe_meta[@]}"; do mkdir -p "$(dirname "$f")"; [[ -e "$f" ]] || : > "$f"; done

if [[ "$MODE" == "extended" ]]; then
  # Create minimal stubs for workspace files (only if absent).
  # If you plan to let tooling generate these, skip extended mode.
  [[ -e "Cargo.toml" ]] || cat > Cargo.toml <<'TOML'
[workspace]
members = ["apps/desktop/src-tauri"]
resolver = "2"
TOML

  [[ -e "package.json" ]] || cat > package.json <<'JSON'
{
  "name": "git-frisky",
  "private": true,
  "packageManager": "pnpm@9",
  "workspaces": ["apps/ui", "packages/*"],
  "scripts": {
    "dev": "pnpm -C apps/ui dev",
    "typecheck": "pnpm -C apps/ui typecheck && pnpm -C packages/* typecheck",
    "lint": "pnpm -C apps/ui lint",
    "build": "pnpm -C apps/ui build"
  }
}
JSON

  [[ -e "pnpm-workspace.yaml" ]] || cat > pnpm-workspace.yaml <<'YAML'
packages:
  - "apps/ui"
  - "packages/*"
YAML
fi

cat <<'SKIP'
▶ Skipping tool-generated files to avoid collisions:
  apps/desktop/src-tauri/Cargo.toml
  apps/desktop/src-tauri/tauri.conf.json
  apps/desktop/src-tauri/src/main.rs
  apps/ui/package.json
  apps/ui/vite.config.ts
  apps/ui/tsconfig.json
  apps/ui/index.html
  (root) Cargo.toml, package.json, pnpm-workspace.yaml  [created only in MODE=extended]
SKIP

echo "✓ Structure created safely."

