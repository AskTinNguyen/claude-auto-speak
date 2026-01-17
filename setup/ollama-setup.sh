#!/usr/bin/env bash
# Ollama + Qwen Setup Script for Claude Auto-Speak
# Installs Ollama and downloads the Qwen 2.5:1.5b model for smart summarization
#
# Usage: ./ollama-setup.sh
#
# This is OPTIONAL - auto-speak works without Ollama using regex-based cleanup

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}=== Ollama + Qwen Setup for Claude Auto-Speak ===${NC}"
echo ""

# Check if already installed
if command -v ollama &>/dev/null; then
  echo -e "${GREEN}✓${NC} Ollama is already installed"
  OLLAMA_INSTALLED=true
else
  OLLAMA_INSTALLED=false
fi

# Check if Qwen model is available
check_qwen() {
  if $OLLAMA_INSTALLED; then
    if ollama list 2>/dev/null | grep -q "qwen2.5:1.5b"; then
      return 0
    fi
  fi
  return 1
}

if check_qwen; then
  echo -e "${GREEN}✓${NC} Qwen 2.5:1.5b model is already downloaded"
  echo ""
  echo -e "${GREEN}Setup complete! Smart summarization is ready.${NC}"
  exit 0
fi

# Prompt for installation
if ! $OLLAMA_INSTALLED; then
  echo -e "${YELLOW}Ollama is not installed.${NC}"
  echo ""
  echo "Ollama is required for smart LLM-based summarization of Claude responses."
  echo "Without it, auto-speak will use simpler regex-based cleanup (still works, less intelligent)."
  echo ""
  read -p "Install Ollama? (y/N) " -n 1 -r
  echo ""

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${CYAN}Installing Ollama...${NC}"

    # Install Ollama
    curl -fsSL https://ollama.com/install.sh | sh

    if command -v ollama &>/dev/null; then
      echo -e "${GREEN}✓${NC} Ollama installed successfully"
      OLLAMA_INSTALLED=true
    else
      echo -e "${RED}✗${NC} Ollama installation failed"
      exit 1
    fi
  else
    echo ""
    echo -e "${YELLOW}Skipping Ollama installation.${NC}"
    echo "Auto-speak will use regex-based cleanup instead of LLM summarization."
    exit 0
  fi
fi

# Download Qwen model
echo ""
echo -e "${CYAN}Downloading Qwen 2.5:1.5b model...${NC}"
echo "This is a small (~1GB) but capable model optimized for summarization."
echo ""

ollama pull qwen2.5:1.5b

if check_qwen; then
  echo ""
  echo -e "${GREEN}✓${NC} Qwen 2.5:1.5b model downloaded successfully"
else
  echo ""
  echo -e "${RED}✗${NC} Failed to download Qwen model"
  exit 1
fi

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Smart summarization is now available for Claude Auto-Speak."
echo "Ollama will start automatically when needed."
echo ""
echo "To test:"
echo "  auto-speak on"
echo "  auto-speak test"
echo ""
