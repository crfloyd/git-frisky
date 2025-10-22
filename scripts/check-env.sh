#!/usr/bin/env bash
# Environment validation script for GitFrisky development
# Run this before starting development to ensure all dependencies are installed

set -e

echo "🔍 Checking development environment for GitFrisky..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check function
check_version() {
    local name=$1
    local command=$2
    local min_version=$3
    local current_version

    if command -v "$command" &> /dev/null; then
        current_version=$($command --version 2>&1 | head -n 1 | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -n 1)
        if [ -n "$current_version" ]; then
            echo -e "${GREEN}✓${NC} $name: $current_version (minimum: $min_version)"
        else
            echo -e "${GREEN}✓${NC} $name: installed"
        fi
    else
        echo -e "${RED}✗${NC} $name: NOT FOUND (required: $min_version+)"
        ERRORS=$((ERRORS + 1))
    fi
}

# Required tools
echo "Required Dependencies:"
check_version "Node.js" "node" "20.0.0"
check_version "pnpm" "pnpm" "9.0.0"
check_version "Rust" "rustc" "1.75.0"
check_version "Cargo" "cargo" "1.75.0"
check_version "Git" "git" "2.30.0"

echo ""
echo "Platform-Specific Dependencies:"

# Platform-specific checks
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if xcode-select -p &> /dev/null; then
        echo -e "${GREEN}✓${NC} Xcode Command Line Tools: installed"
    else
        echo -e "${RED}✗${NC} Xcode Command Line Tools: NOT FOUND"
        echo "   Install with: xcode-select --install"
        ERRORS=$((ERRORS + 1))
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    check_version "build-essential" "gcc" "9.0.0"

    if pkg-config --exists libssl; then
        echo -e "${GREEN}✓${NC} libssl-dev: installed"
    else
        echo -e "${RED}✗${NC} libssl-dev: NOT FOUND"
        echo "   Install with: sudo apt-get install libssl-dev pkg-config libssh2-1-dev"
        ERRORS=$((ERRORS + 1))
    fi
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    echo -e "${YELLOW}⚠${NC}  Windows detected - ensure Visual Studio 2022 Build Tools are installed"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "Optional Tools (recommended):"

# Optional but recommended
if command -v "cargo-watch" &> /dev/null; then
    echo -e "${GREEN}✓${NC} cargo-watch: installed (auto-reload on Rust changes)"
else
    echo -e "${YELLOW}○${NC} cargo-watch: not installed (install with: cargo install cargo-watch)"
    WARNINGS=$((WARNINGS + 1))
fi

if command -v "ripgrep" &> /dev/null; then
    echo -e "${GREEN}✓${NC} ripgrep: installed (faster repo search, V1.5 feature)"
else
    echo -e "${YELLOW}○${NC} ripgrep: not installed (install with: cargo install ripgrep)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "──────────────────────────────────────"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Environment check passed!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS optional tool(s) missing (recommended but not required)${NC}"
    fi
    echo ""
    echo "Next steps:"
    echo "  1. pnpm install          # Install Node dependencies"
    echo "  2. cd apps/desktop/src-tauri && cargo build  # Build Rust backend"
    echo "  3. pnpm dev              # Start development"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Environment check failed with $ERRORS error(s)${NC}"
    echo ""
    echo "Please install missing dependencies and run this script again."
    exit 1
fi
