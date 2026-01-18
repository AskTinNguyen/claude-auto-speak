#!/usr/bin/env bash
#
# Multi-language Piper Voice Setup
# Downloads Chinese voice models for Piper TTS
#
# NOTE: For Vietnamese TTS, use VieNeu-TTS instead (better quality)
#       Run: ./setup/vieneu-setup.sh
#
# Usage: ./setup/multilang-piper-setup.sh
#

set -e

echo "====================================="
echo "Piper Chinese Voice Setup"
echo "====================================="
echo ""

# Voice directory
VOICE_DIR="${HOME}/.local/share/piper-voices"

# Create voice directory if it doesn't exist
mkdir -p "$VOICE_DIR"

echo "Installing Chinese voice to: $VOICE_DIR"
echo ""
echo "NOTE: For Vietnamese TTS, use VieNeu-TTS (higher quality)"
echo "      Run: ./setup/vieneu-setup.sh"
echo ""

# Check if piper is installed
PIPER_BIN="${HOME}/.local/bin/piper"
if [[ ! -f "$PIPER_BIN" ]]; then
  echo "⚠️  Warning: Piper not found at $PIPER_BIN"
  echo "Please run: ./setup/piper-setup.sh first"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Chinese voice (zh_CN-huayan-medium)
echo "📥 Downloading Chinese voice (zh_CN-huayan-medium)..."
if [[ -f "$VOICE_DIR/zh_CN-huayan-medium.onnx" ]]; then
  echo "   ✓ Chinese voice already installed (skipping)"
else
  curl -# -L -o "$VOICE_DIR/zh_CN-huayan-medium.onnx" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx"

  curl -# -L -o "$VOICE_DIR/zh_CN-huayan-medium.onnx.json" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/zh/zh_CN/huayan/medium/zh_CN-huayan-medium.onnx.json"

  echo "   ✓ Chinese voice installed"
fi
echo ""

echo "====================================="
echo "✅ Chinese voice setup complete!"
echo "====================================="
echo ""
echo "Installed voices:"
echo "  • Chinese: zh_CN-huayan-medium"
echo ""
echo "For Vietnamese TTS (recommended):"
echo "  ./setup/vieneu-setup.sh  # VieNeu-TTS (higher quality)"
echo ""
echo "To enable multilingual TTS:"
echo "  auto-speak config multilingual on"
echo "  auto-speak config multilingual mode native"
echo ""
echo "For translation mode (English → Chinese):"
echo "  auto-speak config multilingual mode translate"
echo "  auto-speak config multilingual language zh"
echo "  ollama pull gemma2:9b  # Translation model"
echo ""
echo "Test Chinese:"
echo "  echo '你好世界' | speak"
echo ""
