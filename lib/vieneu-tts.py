#!/usr/bin/env python3
"""
VieNeu-TTS wrapper for claude-auto-speak
Performs text-to-speech using cloned Vietnamese voices

Usage:
  python vieneu-tts.py --text "Xin chào" --voice my_voice --output /tmp/output.wav
  echo "Xin chào" | python vieneu-tts.py --voice my_voice --output /tmp/output.wav
"""

import sys
import argparse
import os
from pathlib import Path
import numpy as np

def main():
    parser = argparse.ArgumentParser(description='VieNeu-TTS wrapper for claude-auto-speak')
    parser.add_argument('--text', type=str, help='Text to synthesize')
    parser.add_argument('--voice', type=str, required=True, help='Voice name (from cloned voices)')
    parser.add_argument('--output', type=str, required=True, help='Output WAV file path')
    parser.add_argument('--model', type=str, default='vieneu-0.3b',
                        help='Model name (vieneu-0.3b or vieneu-0.5b)')

    args = parser.parse_args()

    # Get text from argument or stdin
    text = args.text
    if not text:
        if not sys.stdin.isatty():
            text = sys.stdin.read().strip()
        else:
            print("Error: No text provided", file=sys.stderr)
            print("Usage: python vieneu-tts.py --text 'Xin chào' --voice my_voice --output /tmp/output.wav",
                  file=sys.stderr)
            sys.exit(1)

    if not text:
        print("Error: Empty text", file=sys.stderr)
        sys.exit(1)

    # Load voice embedding
    vieneu_dir = Path.home() / ".claude-auto-speak/vieneu"
    voices_dir = vieneu_dir / "voices"
    voice_file = voices_dir / f"{args.voice}.npy"

    if not voice_file.exists():
        print(f"Error: Voice not found: {voice_file}", file=sys.stderr)
        print(f"Available voices:", file=sys.stderr)
        if voices_dir.exists():
            for v in voices_dir.glob("*.npy"):
                print(f"  - {v.stem}", file=sys.stderr)
        else:
            print("  (none - run clone-voice.py first)", file=sys.stderr)
        sys.exit(1)

    try:
        # Import VieNeu (lazy import to fail fast if not installed)
        from vieneu import VieNeuTTS
        import soundfile as sf

        # Load voice embedding
        voice_embedding = np.load(voice_file)

        # Initialize model
        model = VieNeuTTS(model_name=args.model)

        # Synthesize speech
        audio = model.synthesize(
            text=text,
            voice_embedding=voice_embedding,
            speed=1.0  # Normal speed
        )

        # Save to output file
        sf.write(args.output, audio, model.sample_rate)

        print(f"✓ Generated: {args.output}", file=sys.stderr)

    except ImportError as e:
        print(f"Error: VieNeu-TTS not installed", file=sys.stderr)
        print(f"Run: ./setup/vieneu-setup.sh", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
