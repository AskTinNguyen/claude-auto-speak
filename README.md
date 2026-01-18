# Claude Auto-Speak

**Automatic text-to-speech for Claude Code responses.**

> Hear Claude's responses spoken aloud automatically. Uses intelligent LLM-based summarization to condense long outputs into natural spoken summaries.

## Features

- **Immediate Acknowledgment** - Speaks Claude's first response when you submit a command
- **Progress Updates** - Speaks "Still working", "Almost there" during long tasks
- **Final Summary** - Context-aware summary when Claude finishes
- **Cross-Session Coordination** - Multiple Claude sessions coordinate to prevent audio conflicts
- **TTS Overlap Prevention** - Cancels existing audio before speaking new text
- **Skip Session Start** - Avoids spammy voice on new session's first prompt
- **Smart Summarization** - Uses Qwen LLM to create natural 1-2 sentence summaries
- **Multiple TTS Engines** - macOS `say` (default) or Piper neural TTS
- **Voice Selection** - Choose from multiple voices for each engine
- **Zero Configuration** - Works out of the box with sensible defaults

## Quick Start

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/AskTinNguyen/claude-auto-speak/main/install.sh | bash

# Enable
auto-speak on

# Test
auto-speak test

# Use Claude Code - responses are now spoken!
```

## Audio Flow

```
You submit a command
    │
    ▼
Claude starts responding → "Looking into that for you"
    │
    ▼
15 seconds pass → "Still working"
    │
    ▼
30 seconds pass → "Almost there"
    │
    ▼
Claude finishes → "All 47 tests passed successfully"
```

## Requirements

**Required:**
- macOS (uses built-in `say` command)
- Claude Code CLI
- Node.js 18+
- jq (for JSON parsing)

**Optional:**
- Ollama + Qwen 2.5:1.5b (for smart summarization)
- Piper TTS (for high-quality neural voices)

## Commands

```bash
auto-speak on           # Enable auto-speak
auto-speak off          # Disable auto-speak
auto-speak status       # Show current status
auto-speak test         # Test TTS with sample message
auto-speak logs         # View recent log entries
auto-speak config       # Show current configuration
```

## Configuration

### Voice Settings

```bash
# macOS voices
auto-speak config voice Samantha    # US English female (default)
auto-speak config voice Alex        # US English male
auto-speak config voice Daniel      # British English male
auto-speak config voice Karen       # Australian English female

# List all available macOS voices
say -v ?

# Speech rate (words per minute)
auto-speak config rate 175          # Default
auto-speak config rate 200          # Faster
auto-speak config rate 150          # Slower
```

### TTS Engine

```bash
# Switch to Piper neural TTS (higher quality)
auto-speak config tts piper

# Switch back to macOS say
auto-speak config tts macos
```

### LLM Summarization

```bash
# Disable LLM (use regex-based cleanup)
auto-speak config llm off

# Enable LLM
auto-speak config llm on

# Custom Ollama URL
auto-speak config ollama-url http://localhost:11434
```

### Feature Toggles

Edit `~/.claude-auto-speak/config.json`:

```json
{
  "enabled": true,
  "ttsEngine": "macos",
  "voice": "Samantha",
  "rate": 175,
  "useLLM": true,
  "acknowledgment": {
    "enabled": true
  },
  "progress": {
    "enabled": true,
    "intervalSeconds": 15
  },
  "skipSessionStart": {
    "enabled": true,
    "minUserMessages": 1
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | `false` | Master on/off switch |
| `ttsEngine` | `"macos"` | TTS engine: `"macos"` or `"piper"` |
| `voice` | `"Samantha"` | Voice name for TTS |
| `rate` | `175` | Speech rate (words per minute) |
| `useLLM` | `true` | Use Qwen for smart summarization |
| `acknowledgment.enabled` | `true` | Speak Claude's first response |
| `progress.enabled` | `true` | Speak periodic progress updates |
| `progress.intervalSeconds` | `15` | Seconds between progress phrases |
| `skipSessionStart.enabled` | `true` | Skip voice on first prompt of new session |
| `skipSessionStart.minUserMessages` | `1` | Threshold for session start detection |

## Piper TTS Setup

Piper provides high-quality neural text-to-speech with natural-sounding voices.

```bash
# Install Piper
~/.claude-auto-speak/setup/piper-setup.sh

# Switch to Piper
auto-speak config tts piper

# Available Piper voices:
# - lessac (US English, default)
# - ryan (US English male)
# - libritts (US English)
# - alba (Scottish English)
# - jenny (US English female)
```

Piper voices are downloaded to `~/.local/share/piper-voices/`.

## VieNeu-TTS Setup (Vietnamese Voice Cloning)

VieNeu-TTS provides high-quality Vietnamese TTS with voice cloning support. Includes 10 pre-cloned voices ready to use.

```bash
# Install VieNeu-TTS
./setup/vieneu-setup.sh

# Switch to VieNeu
auto-speak config tts vieneu

# Use a bundled voice (thanh, phuong, tung, thảo, tuyết, ân, kuon, vivien, serafina, jessica)
auto-speak config vieneu-voice thanh

# Test
echo "Xin chào thế giới" | speak
```

Clone your own voice with 3-5 seconds of audio:

```bash
source ~/.claude-auto-speak/vieneu/venv/bin/activate
python ~/.claude-auto-speak/vieneu/clone-voice.py my_audio.wav my_voice
deactivate
auto-speak config vieneu-voice my_voice
```

See [VOICE_CLONING.md](VOICE_CLONING.md) for detailed instructions.

## Ollama Setup

For intelligent context-aware summarization:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download Qwen model (~1GB)
ollama pull qwen2.5:1.5b

# Start Ollama server
ollama serve
```

Or use the included setup script:

```bash
~/.claude-auto-speak/setup/ollama-setup.sh
```

Without Ollama, auto-speak uses regex-based text cleanup which still works well for most responses.

## Direct TTS Command

```bash
# Speak text directly
speak "Hello world"

# Pipe text
echo "Build completed" | speak

# Custom voice and rate
speak --voice Alex --rate 200 "Hello world"

# Use Piper engine
speak --engine piper "Hello world"
```

## How It Works

1. **UserPromptSubmit hook** triggers when you submit a command
2. **Session detection** skips voice on first prompt of new session
3. **Transcript watcher** monitors for Claude's first text response
4. **Acknowledgment** is spoken immediately
5. **Progress timer** speaks updates every 15 seconds
6. **Stop hook** triggers when Claude finishes
7. **Context-aware summarizer** creates a natural summary
8. **TTS manager** coordinates across sessions, prevents overlap

### Cross-Session Coordination

When running multiple Claude Code sessions simultaneously:

- Each session gets a unique ID from terminal/parent process
- Global voice lock prevents audio conflicts between sessions
- Sessions wait up to 15s for others to finish speaking
- Each session only manages its own TTS processes

### Skip Session Start

To avoid repetitive/spammy acknowledgments when starting a new Claude session:

- Counts user messages in transcript
- Skips voice if message count is at or below threshold (default: 1)
- Configurable via `skipSessionStart` in config.json

## Troubleshooting

### No sound?

```bash
# Check status
auto-speak status

# Test TTS directly
say "test"
speak "test"

# Check logs
auto-speak logs
```

### Audio overlapping?

The TTS manager should prevent this automatically. Check logs:

```bash
tail -f ~/.claude-auto-speak/tts-manager.log
```

Look for:
- "Killing orphaned say processes" - cleanup working
- "Voice lock acquired/released" - cross-session coordination working
- "Another session is speaking, waiting" - session coordination active

### Multiple sessions conflicting?

Check if cross-session coordination is working:

```bash
# Check voice lock status
cat ~/.claude-auto-speak/locks/voice.lock

# Check session-specific PID files
ls ~/.claude-auto-speak/tts-*.pid
```

### Ollama errors?

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Verify Qwen model
ollama list | grep qwen
```

## File Structure

```
~/.claude-auto-speak/
├── config.json              # Configuration
├── auto-speak.log           # Stop hook logs
├── prompt-ack-hook.log      # Acknowledgment hook logs
├── progress-timer.log       # Progress timer logs
├── tts-manager.log          # TTS manager logs
├── session-detect.log       # Session detection logs
├── tts-{session}.pid        # Session-specific TTS PID
├── locks/
│   └── voice.lock           # Global voice lock for cross-session coordination
├── bin/
│   ├── auto-speak           # CLI commands
│   └── speak                # TTS wrapper
├── lib/
│   ├── config.mjs           # Config management
│   ├── output-filter.mjs    # Text filtering
│   ├── summarize.mjs        # LLM summarization
│   ├── tts-manager.sh       # TTS overlap prevention + cross-session coordination
│   ├── session-detect.sh    # Session start detection
│   ├── transcript-watcher.mjs  # First response detection
│   └── progress-timer.sh    # Periodic progress updates
├── hooks/
│   ├── stop-hook.sh         # Stop hook (final summary)
│   └── prompt-ack-hook.sh   # UserPromptSubmit hook (acknowledgment)
└── setup/
    ├── configure-hooks.mjs  # Hook registration
    ├── ollama-setup.sh      # Ollama installer
    └── piper-setup.sh       # Piper TTS installer
```

## Uninstall

```bash
~/.claude-auto-speak/uninstall.sh
```

Or manually:

```bash
# Remove hooks
node ~/.claude-auto-speak/setup/configure-hooks.mjs --remove

# Remove installation
rm -rf ~/.claude-auto-speak

# Remove from PATH (edit ~/.zshrc)
# Delete: export PATH="$PATH:$HOME/.claude-auto-speak/bin"
```

## Documentation

See [SKILL.md](SKILL.md) for complete technical documentation.

## License

MIT
