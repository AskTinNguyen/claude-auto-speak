#!/usr/bin/env bash
# Piper TTS Setup Script for Claude Auto-Speak
# Installs Piper for high-quality neural text-to-speech
#
# Usage: ./piper-setup.sh
#
# This is OPTIONAL - auto-speak works with macOS 'say' by default

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m' # No Color

INSTALL_DIR="${HOME}/.claude-auto-speak"
PIPER_DIR="${INSTALL_DIR}/piper"
VOICES_DIR="${PIPER_DIR}/voices"

echo ""
echo -e "${CYAN}=== Piper TTS Setup for Claude Auto-Speak ===${NC}"
echo ""
echo "Piper is a fast, local neural text-to-speech system."
echo "It provides higher quality voices than macOS 'say' command."
echo ""

# Check platform
PLATFORM=$(uname -s)
ARCH=$(uname -m)

case "$PLATFORM" in
  Darwin)
    if [[ "$ARCH" == "arm64" ]]; then
      PIPER_RELEASE="piper_macos_aarch64.tar.gz"
    else
      PIPER_RELEASE="piper_macos_x64.tar.gz"
    fi
    ;;
  Linux)
    if [[ "$ARCH" == "aarch64" ]]; then
      PIPER_RELEASE="piper_linux_aarch64.tar.gz"
    else
      PIPER_RELEASE="piper_linux_x86_64.tar.gz"
    fi
    ;;
  *)
    echo -e "${RED}Error: Unsupported platform: $PLATFORM${NC}"
    exit 1
    ;;
esac

# Check if already installed
if [[ -f "${PIPER_DIR}/piper" ]]; then
  echo -e "${GREEN}✓${NC} Piper is already installed at ${PIPER_DIR}"

  # Check for voices
  if [[ -d "$VOICES_DIR" ]] && ls "$VOICES_DIR"/*.onnx &>/dev/null; then
    echo -e "${GREEN}✓${NC} Voice models found"
    echo ""
    echo -e "${GREEN}Piper is ready to use!${NC}"
    echo "Enable with: auto-speak config tts piper"
    exit 0
  fi
fi

# Prompt for installation
echo -e "${YELLOW}Piper will be downloaded (~50MB) plus voice models (~50MB each).${NC}"
echo ""
read -p "Install Piper TTS? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Installation cancelled."
  exit 0
fi

# Create directories
mkdir -p "$PIPER_DIR"
mkdir -p "$VOICES_DIR"

# Download Piper
echo ""
echo -e "${CYAN}Downloading Piper...${NC}"

PIPER_URL="https://github.com/rhasspy/piper/releases/latest/download/${PIPER_RELEASE}"
TEMP_FILE=$(mktemp)

curl -L -o "$TEMP_FILE" "$PIPER_URL" || {
  echo -e "${RED}Error: Failed to download Piper${NC}"
  rm -f "$TEMP_FILE"
  exit 1
}

# Extract
echo -e "${CYAN}Extracting...${NC}"
tar -xzf "$TEMP_FILE" -C "$PIPER_DIR" --strip-components=1
rm -f "$TEMP_FILE"

# Verify installation
if [[ ! -f "${PIPER_DIR}/piper" ]]; then
  echo -e "${RED}Error: Piper binary not found after extraction${NC}"
  exit 1
fi

chmod +x "${PIPER_DIR}/piper"
echo -e "${GREEN}✓${NC} Piper installed"

# Download voice model
echo ""
echo -e "${CYAN}Downloading voice model...${NC}"
echo ""
echo "Available voices:"
echo "  1. amy (US English female, medium quality) - ~50MB"
echo "  2. lessac (US English male, high quality) - ~100MB"
echo "  3. alba (Scottish English female) - ~50MB"
echo ""
read -p "Select voice [1-3, default=1]: " -r VOICE_CHOICE
VOICE_CHOICE=${VOICE_CHOICE:-1}

case "$VOICE_CHOICE" in
  1)
    VOICE_NAME="en_US-amy-medium"
    VOICE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx"
    CONFIG_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json"
    ;;
  2)
    VOICE_NAME="en_US-lessac-high"
    VOICE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx"
    CONFIG_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/high/en_US-lessac-high.onnx.json"
    ;;
  3)
    VOICE_NAME="en_GB-alba-medium"
    VOICE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium/en_GB-alba-medium.onnx"
    CONFIG_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alba/medium/en_GB-alba-medium.onnx.json"
    ;;
  *)
    echo -e "${YELLOW}Invalid choice, using amy${NC}"
    VOICE_NAME="en_US-amy-medium"
    VOICE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx"
    CONFIG_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json"
    ;;
esac

echo ""
echo -e "${CYAN}Downloading ${VOICE_NAME}...${NC}"

# Download model and config
curl -L -o "${VOICES_DIR}/${VOICE_NAME}.onnx" "$VOICE_URL" || {
  echo -e "${RED}Error: Failed to download voice model${NC}"
  exit 1
}

curl -L -o "${VOICES_DIR}/${VOICE_NAME}.onnx.json" "$CONFIG_URL" || {
  echo -e "${RED}Error: Failed to download voice config${NC}"
  exit 1
}

echo -e "${GREEN}✓${NC} Voice model downloaded"

# Update config
echo ""
echo -e "${CYAN}Updating auto-speak configuration...${NC}"

node -e "
import { loadConfig, saveConfig } from '${INSTALL_DIR}/lib/config.mjs';
const config = loadConfig();
config.ttsEngine = 'piper';
config.piperPath = '${PIPER_DIR}/piper';
config.piperVoice = '${VOICES_DIR}/${VOICE_NAME}.onnx';
saveConfig(config);
console.log('Config updated');
"

echo -e "${GREEN}✓${NC} Configuration updated"

# Test
echo ""
echo -e "${CYAN}Testing Piper TTS...${NC}"

echo "Auto-speak is now using Piper for high-quality text-to-speech." | "${PIPER_DIR}/piper" \
  --model "${VOICES_DIR}/${VOICE_NAME}.onnx" \
  --output_file /tmp/piper-test.wav 2>/dev/null

if [[ -f /tmp/piper-test.wav ]]; then
  # Play on macOS
  if command -v afplay &>/dev/null; then
    afplay /tmp/piper-test.wav
  # Play on Linux
  elif command -v aplay &>/dev/null; then
    aplay /tmp/piper-test.wav
  fi
  rm -f /tmp/piper-test.wav
  echo -e "${GREEN}✓${NC} Piper TTS working"
fi

echo ""
echo -e "${GREEN}=== Piper Setup Complete ===${NC}"
echo ""
echo "Piper TTS is now configured for auto-speak."
echo ""
echo "To switch TTS engines:"
echo "  auto-speak config tts piper     # Use Piper (high quality)"
echo "  auto-speak config tts macos     # Use macOS say (default)"
echo ""
echo "To download more voices, visit:"
echo "  https://huggingface.co/rhasspy/piper-voices"
echo ""
