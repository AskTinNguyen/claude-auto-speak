#!/usr/bin/env bash
# Claude Auto-Speak Installer
# One-line installation for Claude Code auto-speak functionality
#
# Install:
#   curl -fsSL https://raw.githubusercontent.com/AskTinNguyen/claude-auto-speak/main/install.sh | bash
#
# Or clone and run:
#   git clone https://github.com/AskTinNguyen/claude-auto-speak.git
#   cd claude-auto-speak
#   ./install.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m' # No Color

INSTALL_DIR="${HOME}/.claude-auto-speak"
REPO_URL="https://github.com/AskTinNguyen/claude-auto-speak.git"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          Claude Auto-Speak Installer                       ║${NC}"
echo -e "${CYAN}║   Automatic TTS for Claude Code responses                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check platform
if [[ "$(uname)" != "Darwin" ]]; then
  echo -e "${RED}Error: Claude Auto-Speak requires macOS${NC}"
  echo "The 'say' command is only available on macOS."
  exit 1
fi

# Check for Node.js
if ! command -v node &>/dev/null; then
  echo -e "${RED}Error: Node.js is required${NC}"
  echo "Install with: brew install node"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [[ "$NODE_VERSION" -lt 18 ]]; then
  echo -e "${YELLOW}Warning: Node.js 18+ recommended (found v${NODE_VERSION})${NC}"
fi

# Check for jq (optional but recommended)
if ! command -v jq &>/dev/null; then
  echo -e "${YELLOW}Note: jq is recommended for robust JSON parsing${NC}"
  echo -e "${DIM}Install with: brew install jq${NC}"
  echo ""
fi

# Determine source directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if running from cloned repo or via curl
if [[ -f "${SCRIPT_DIR}/lib/summarize.mjs" ]]; then
  SOURCE_DIR="$SCRIPT_DIR"
  echo -e "${DIM}Installing from local source: ${SOURCE_DIR}${NC}"
else
  # Clone the repo to a temp directory
  echo -e "${CYAN}Downloading Claude Auto-Speak...${NC}"
  TEMP_DIR=$(mktemp -d)
  trap "rm -rf $TEMP_DIR" EXIT

  git clone --depth 1 "$REPO_URL" "$TEMP_DIR" 2>/dev/null || {
    echo -e "${RED}Error: Failed to clone repository${NC}"
    echo "Check your internet connection and try again."
    exit 1
  }

  SOURCE_DIR="$TEMP_DIR"
  echo -e "${GREEN}✓${NC} Downloaded"
fi

# Create install directory
echo -e "${CYAN}Installing to ${INSTALL_DIR}...${NC}"

if [[ -d "$INSTALL_DIR" ]]; then
  echo -e "${YELLOW}Existing installation found. Backing up...${NC}"
  BACKUP_DIR="${INSTALL_DIR}.backup-$(date +%s)"
  mv "$INSTALL_DIR" "$BACKUP_DIR"
  echo -e "${DIM}  Backup: ${BACKUP_DIR}${NC}"
fi

mkdir -p "$INSTALL_DIR"

# Copy files
cp -r "${SOURCE_DIR}/lib" "$INSTALL_DIR/"
cp -r "${SOURCE_DIR}/bin" "$INSTALL_DIR/"
cp -r "${SOURCE_DIR}/hooks" "$INSTALL_DIR/"
cp -r "${SOURCE_DIR}/setup" "$INSTALL_DIR/"

# Make scripts executable
chmod +x "$INSTALL_DIR/bin/auto-speak"
chmod +x "$INSTALL_DIR/bin/speak"
chmod +x "$INSTALL_DIR/hooks/stop-hook.sh"
chmod +x "$INSTALL_DIR/setup/ollama-setup.sh"

echo -e "${GREEN}✓${NC} Files installed"

# Add to PATH
BIN_DIR="$INSTALL_DIR/bin"
SHELL_RC=""

if [[ "$SHELL" == *"zsh"* ]]; then
  SHELL_RC="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
  if [[ -f "$HOME/.bash_profile" ]]; then
    SHELL_RC="$HOME/.bash_profile"
  else
    SHELL_RC="$HOME/.bashrc"
  fi
fi

# Check if already in PATH
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  if [[ -n "$SHELL_RC" ]]; then
    echo "" >> "$SHELL_RC"
    echo "# Claude Auto-Speak" >> "$SHELL_RC"
    echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$SHELL_RC"
    echo -e "${GREEN}✓${NC} Added to PATH in ${SHELL_RC}"
    echo -e "${YELLOW}  Run: source ${SHELL_RC}${NC}"
  else
    echo -e "${YELLOW}Add to your shell profile:${NC}"
    echo -e "${DIM}  export PATH=\"\$PATH:$BIN_DIR\"${NC}"
  fi
else
  echo -e "${GREEN}✓${NC} Already in PATH"
fi

# Configure Claude Code hooks
echo ""
echo -e "${CYAN}Configuring Claude Code hooks...${NC}"
node "$INSTALL_DIR/setup/configure-hooks.mjs"

# Create initial config
echo ""
echo -e "${CYAN}Creating default configuration...${NC}"
node -e "
import { ensureConfigDir, saveConfig, DEFAULT_CONFIG } from '${INSTALL_DIR}/lib/config.mjs';
ensureConfigDir();
saveConfig(DEFAULT_CONFIG);
console.log('Config created at: ~/.claude-auto-speak/config.json');
"

# Offer Ollama setup
echo ""
echo -e "${CYAN}Ollama Setup (Optional)${NC}"
echo ""
echo "Ollama provides smart LLM-based summarization of Claude responses."
echo "Without it, auto-speak uses simpler regex-based cleanup."
echo ""
read -p "Install Ollama + Qwen model? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  bash "$INSTALL_DIR/setup/ollama-setup.sh"
else
  echo -e "${DIM}Skipped. You can install later with: ${INSTALL_DIR}/setup/ollama-setup.sh${NC}"
fi

# Done!
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Installation Complete!                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Enable auto-speak:${NC}    auto-speak on"
echo -e "  ${CYAN}Test TTS:${NC}             auto-speak test"
echo -e "  ${CYAN}Check status:${NC}         auto-speak status"
echo -e "  ${CYAN}Disable:${NC}              auto-speak off"
echo ""
echo -e "${DIM}For smart summarization, ensure Ollama is running:${NC}"
echo -e "${DIM}  ollama serve${NC}"
echo ""
echo -e "${DIM}Documentation: ${INSTALL_DIR}/SKILL.md${NC}"
echo ""

# Reload PATH for current session
export PATH="$PATH:$BIN_DIR"
