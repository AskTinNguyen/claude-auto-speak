#!/usr/bin/env bash
# Claude Auto-Speak Uninstaller
# Cleanly removes auto-speak and all its configuration
#
# Usage: ./uninstall.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m' # No Color

INSTALL_DIR="${HOME}/.claude-auto-speak"
CLAUDE_SETTINGS="${HOME}/.claude/settings.local.json"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          Claude Auto-Speak Uninstaller                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Confirm uninstall
read -p "Remove Claude Auto-Speak and all configuration? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Uninstall cancelled."
  exit 0
fi

echo ""

# Remove Claude Code hooks
if [[ -f "$INSTALL_DIR/setup/configure-hooks.mjs" ]]; then
  echo -e "${CYAN}Removing Claude Code hooks...${NC}"
  node "$INSTALL_DIR/setup/configure-hooks.mjs" --remove 2>/dev/null || true
  echo -e "${GREEN}✓${NC} Hooks removed"
fi

# Remove install directory
if [[ -d "$INSTALL_DIR" ]]; then
  echo -e "${CYAN}Removing installation directory...${NC}"
  rm -rf "$INSTALL_DIR"
  echo -e "${GREEN}✓${NC} Removed ${INSTALL_DIR}"
else
  echo -e "${DIM}Installation directory not found${NC}"
fi

# Remove from PATH (show instructions)
BIN_DIR="$INSTALL_DIR/bin"

echo ""
echo -e "${YELLOW}Manual cleanup needed:${NC}"
echo ""
echo "Remove this line from your shell profile (~/.zshrc or ~/.bash_profile):"
echo -e "${DIM}  export PATH=\"\$PATH:$BIN_DIR\"${NC}"
echo ""

# Check for backup directories
BACKUPS=$(ls -d "${INSTALL_DIR}.backup-"* 2>/dev/null || true)
if [[ -n "$BACKUPS" ]]; then
  echo -e "${YELLOW}Backup directories found:${NC}"
  echo "$BACKUPS"
  echo ""
  read -p "Remove backup directories? (y/N) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "${INSTALL_DIR}.backup-"*
    echo -e "${GREEN}✓${NC} Backups removed"
  fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Uninstall Complete                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${DIM}Claude Auto-Speak has been removed from your system.${NC}"
echo -e "${DIM}Ollama and Qwen model were not removed (they may be used by other tools).${NC}"
echo ""
echo "To remove Ollama manually:"
echo -e "${DIM}  ollama rm qwen2.5:1.5b${NC}"
echo -e "${DIM}  rm -rf ~/.ollama${NC}"
echo ""
