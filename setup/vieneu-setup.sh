#!/usr/bin/env bash
#
# VieNeu-TTS Setup Script
# Installs VieNeu-TTS for high-quality Vietnamese voice cloning
#
# Usage: ./setup/vieneu-setup.sh
#
# Requirements:
# - Python 3.8+
# - pip
# - 3-5 seconds of reference audio for voice cloning

set -e

echo "=== VieNeu-TTS Setup for claude-auto-speak ==="
echo ""

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed"
    echo "Install with: brew install python3"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "Found Python version: $PYTHON_VERSION"

# Create virtual environment for VieNeu
VIENEU_DIR="${HOME}/.claude-auto-speak/vieneu"
mkdir -p "$VIENEU_DIR"

if [ ! -d "$VIENEU_DIR/venv" ]; then
    echo ""
    echo "Creating Python virtual environment..."
    python3 -m venv "$VIENEU_DIR/venv"
fi

# Activate virtual environment
source "$VIENEU_DIR/venv/bin/activate"

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip

# Install VieNeu-TTS
echo ""
echo "Installing VieNeu-TTS..."
echo "This may take a few minutes as it downloads model weights..."

# Option 1: Try PyPI first (if available)
if pip install vieneu 2>/dev/null; then
    echo "✓ Installed VieNeu-TTS from PyPI"
else
    # Option 2: Install from GitHub
    echo "Installing from GitHub repository..."
    pip install git+https://github.com/pnnbao97/VieNeu-TTS.git
fi

# Install additional dependencies
pip install soundfile librosa scipy numpy

# Download default model if needed
echo ""
echo "Downloading VieNeu-TTS model..."
python3 << 'PYTHON_SCRIPT'
try:
    from vieneu import VieNeuTTS

    # Initialize with default model (will download if not present)
    print("Initializing VieNeu-TTS model...")
    model = VieNeuTTS(model_name="vieneu-0.3b")  # Smaller, faster model
    print("✓ Model initialized successfully")

except Exception as e:
    print(f"Note: Model will be downloaded on first use")
    print(f"Details: {e}")
PYTHON_SCRIPT

# Create reference voices directory
VOICES_DIR="$VIENEU_DIR/voices"
mkdir -p "$VOICES_DIR"

# Create sample voice cloning script
cat > "$VIENEU_DIR/clone-voice.py" << 'PYTHON_CLONE'
#!/usr/bin/env python3
"""
Voice cloning script for VieNeu-TTS
Usage: python clone-voice.py <reference_audio.wav> <voice_name>
"""

import sys
import os
from pathlib import Path
from vieneu import VieNeuTTS

def clone_voice(reference_audio, voice_name):
    """Clone voice from reference audio"""
    if not os.path.exists(reference_audio):
        print(f"Error: Reference audio not found: {reference_audio}")
        sys.exit(1)

    print(f"Cloning voice from: {reference_audio}")
    print(f"Voice name: {voice_name}")

    # Initialize model
    model = VieNeuTTS(model_name="vieneu-0.3b")

    # Extract voice embedding from reference
    voice_embedding = model.extract_voice_embedding(reference_audio)

    # Save voice profile
    voices_dir = Path.home() / ".claude-auto-speak/vieneu/voices"
    voices_dir.mkdir(parents=True, exist_ok=True)

    voice_file = voices_dir / f"{voice_name}.npy"
    import numpy as np
    np.save(voice_file, voice_embedding)

    print(f"✓ Voice cloned successfully: {voice_file}")
    print(f"\nTo use this voice:")
    print(f"  auto-speak config tts vieneu")
    print(f"  auto-speak config vieneu-voice {voice_name}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python clone-voice.py <reference_audio.wav> <voice_name>")
        print("\nExample:")
        print("  python clone-voice.py my_voice_sample.wav my_voice")
        sys.exit(1)

    clone_voice(sys.argv[1], sys.argv[2])
PYTHON_CLONE

chmod +x "$VIENEU_DIR/clone-voice.py"

# Deactivate venv
deactivate

echo ""
echo "=== VieNeu-TTS Installation Complete ==="
echo ""
echo "Installation directory: $VIENEU_DIR"
echo "Virtual environment: $VIENEU_DIR/venv"
echo "Voices directory: $VOICES_DIR"
echo ""
echo "Next steps:"
echo ""
echo "1. Prepare a 3-5 second audio sample of the voice you want to clone"
echo "   - Format: WAV, 16kHz or 22kHz sample rate recommended"
echo "   - Content: Clean speech, minimal background noise"
echo "   - Example: 'Xin chào, tôi là trợ lý AI của bạn'"
echo ""
echo "2. Clone the voice:"
echo "   source $VIENEU_DIR/venv/bin/activate"
echo "   python $VIENEU_DIR/clone-voice.py your_audio.wav my_voice"
echo ""
echo "3. Configure claude-auto-speak:"
echo "   auto-speak config tts vieneu"
echo "   auto-speak config vieneu-voice my_voice"
echo ""
echo "4. Test it:"
echo "   echo 'Xin chào thế giới' | speak"
echo ""
