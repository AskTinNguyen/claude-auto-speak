#!/usr/bin/env bash
#
# Multi-language Piper Voice Setup
# Downloads Vietnamese and Chinese voice models for Piper TTS
#
# Usage: ./setup/multilang-piper-setup.sh
#

set -e

echo "====================================="
echo "Multi-language Piper Voice Setup"
echo "====================================="
echo ""

# Voice directory
VOICE_DIR="${HOME}/.local/share/piper-voices"

# Create voice directory if it doesn't exist
mkdir -p "$VOICE_DIR"

echo "Installing Vietnamese and Chinese voices to: $VOICE_DIR"
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

# Vietnamese voice (vi_VN-vais1000-medium)
echo "📥 Downloading Vietnamese voice (vi_VN-vais1000-medium)..."
if [[ -f "$VOICE_DIR/vi_VN-vais1000-medium.onnx" ]]; then
  echo "   ✓ Vietnamese voice already installed (skipping)"
else
  curl -# -L -o "$VOICE_DIR/vi_VN-vais1000-medium.onnx" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx"

  curl -# -L -o "$VOICE_DIR/vi_VN-vais1000-medium.onnx.json" \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/vi/vi_VN/vais1000/medium/vi_VN-vais1000-medium.onnx.json"

  echo "   ✓ Vietnamese voice installed"
fi
echo ""

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
echo "✅ Multi-language setup complete!"
echo "====================================="
echo ""
echo "Installed voices:"
echo "  • Vietnamese: vi_VN-vais1000-medium"
echo "  • Chinese:    zh_CN-huayan-medium"
echo ""
echo "To enable multilingual TTS:"
echo "  auto-speak config multilingual on"
echo "  auto-speak config multilingual mode native"
echo ""
echo "For translation mode (English → Vietnamese/Chinese):"
echo "  auto-speak config multilingual mode translate"
echo "  auto-speak config multilingual language vi   # or zh"
echo "  ollama pull gemma2:9b  # Translation model"
echo ""
echo "Test Vietnamese:"
echo "  echo 'Xin chào thế giới' | speak"
echo ""
echo "Test Chinese:"
echo "  echo '你好世界' | speak"
echo ""
