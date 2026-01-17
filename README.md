# Claude Auto-Speak

**Automatic text-to-speech for Claude Code responses.**

> Hear Claude's responses spoken aloud automatically. Uses intelligent LLM-based summarization to condense long outputs into natural spoken summaries.

## Features

- **Immediate Acknowledgment** - Speaks Claude's first response when you submit a command
- **Progress Updates** - Speaks "Still working", "Almost there" during long tasks
- **Final Summary** - Context-aware summary when Claude finishes
- **TTS Overlap Prevention** - Cancels existing audio before speaking new text
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
  }
}
```

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
2. **Transcript watcher** monitors for Claude's first text response
3. **Acknowledgment** is spoken immediately
4. **Progress timer** speaks updates every 15 seconds
5. **Stop hook** triggers when Claude finishes
6. **Context-aware summarizer** creates a natural summary
7. **TTS manager** ensures no audio overlap

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

### Ollama errors?

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve

# Verify Qwen model
ollama list | grep qwen
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
