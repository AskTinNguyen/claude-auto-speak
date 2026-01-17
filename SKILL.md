# Claude Auto-Speak

**Automatic text-to-speech for Claude Code responses.**

Hear Claude's responses spoken aloud automatically. Uses intelligent LLM-based summarization to condense long outputs into natural spoken summaries.

## Features

- **Immediate Acknowledgment**: Speaks Claude's first response when you submit a command
- **Progress Updates**: Speaks "Still working", "Almost there" during long tasks
- **Final Summary**: Speaks a context-aware summary when Claude finishes
- **TTS Overlap Prevention**: Cancels existing TTS before speaking new text
- **Context-Aware Summarization**: Uses Qwen LLM to create natural 1-2 sentence summaries
- **Intelligent Filtering**: Removes code blocks, markdown, file paths, and technical noise
- **Zero Configuration**: Works out of the box with sensible defaults
- **Graceful Fallback**: Works without Ollama using regex-based cleanup

## Quick Start

### Installation

```bash
# One-line install
curl -fsSL https://raw.githubusercontent.com/AskTinNguyen/claude-auto-speak/main/install.sh | bash
```

### Enable Auto-Speak

```bash
# Enable
auto-speak on

# Verify it's working
auto-speak test

# Check status
auto-speak status
```

That's it! All Claude Code responses will now be spoken automatically.

## Requirements

**Required:**
- macOS (uses built-in `say` command)
- Claude Code CLI
- Node.js 18+
- jq (for JSON parsing)

**Optional (for smart summarization):**
- Ollama + Qwen 2.5:1.5b model

Without Ollama, auto-speak uses regex-based text cleanup which still works well for most responses.

## How It Works

```
User submits command
    ↓
UserPromptSubmit hook triggers → starts transcript watcher
    ↓
Claude responds with first text → speaks immediate acknowledgment
    ↓
Progress timer starts → speaks "Still working" every 15s
    ↓
Claude finishes → Stop hook triggers
    ↓
Stop timer, cancel existing TTS
    ↓
Summarize with Qwen LLM (context-aware)
    ↓
Speak final summary (exclusive TTS)
    ↓
You hear the response!
```

### Example

**You ask:** "Run the test suite"

**Sequence of audio:**
1. *Immediately:* "Running the test suite"
2. *After 15s:* "Still working"
3. *After 30s:* "Almost there"
4. *When done:* "All 47 tests passed"

## Commands

### auto-speak

```bash
auto-speak on       # Enable auto-speak
auto-speak off      # Disable auto-speak
auto-speak status   # Show current status
auto-speak test     # Test TTS with a sample message
auto-speak logs     # Show recent log entries
auto-speak config   # Show/set configuration
```

### Configuration

```bash
# Change voice
auto-speak config voice Alex

# Change speech rate (words per minute)
auto-speak config rate 200

# Change TTS engine
auto-speak config tts piper

# Disable LLM summarization (use regex only)
auto-speak config llm off

# Set custom Ollama URL
auto-speak config ollama-url http://localhost:11434
```

### speak

Direct TTS command:

```bash
# Speak text directly
speak "Hello world"

# Pipe text
echo "Build completed" | speak

# Custom voice and rate
speak --voice Alex --rate 200 "Hello world"
```

## Configuration

Config file: `~/.claude-auto-speak/config.json`

```json
{
  "enabled": true,
  "ttsEngine": "macos",
  "voice": "Samantha",
  "rate": 175,
  "piperPath": null,
  "piperVoice": null,
  "ollamaUrl": "http://localhost:11434",
  "ollamaModel": "qwen2.5:1.5b",
  "useLLM": true,
  "fallbackToRegex": true,
  "acknowledgment": {
    "enabled": true
  },
  "progress": {
    "enabled": true,
    "intervalSeconds": 15
  }
}
```

### Feature Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | `false` | Master on/off switch |
| `acknowledgment.enabled` | `true` | Speak Claude's first response |
| `progress.enabled` | `true` | Speak progress updates during long tasks |
| `progress.intervalSeconds` | `15` | Seconds between progress phrases |
| `useLLM` | `true` | Use Qwen for smart summarization |

### TTS Engines

**macOS (default):** Uses built-in `say` command. Zero setup required.

**Piper (optional):** High-quality neural TTS. Cross-platform support.

```bash
# Install Piper
~/.claude-auto-speak/setup/piper-setup.sh

# Switch to Piper
auto-speak config tts piper

# Switch back to macOS
auto-speak config tts macos
```

### Available Voices

Run `say -v ?` to see all available voices. Common choices:

| Voice | Description |
|-------|-------------|
| Samantha | US English female (default) |
| Alex | US English male |
| Victoria | US English female |
| Karen | Australian English female |
| Daniel | British English male |

## Ollama Setup

For smart summarization, install Ollama and Qwen:

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

## Troubleshooting

### Auto-speak not working?

1. **Check if enabled:**
   ```bash
   auto-speak status
   ```

2. **Check logs:**
   ```bash
   auto-speak logs
   ```

3. **Test TTS directly:**
   ```bash
   speak "Test message"
   ```

4. **Verify hooks are configured:**
   ```bash
   cat ~/.claude/settings.local.json | jq '.hooks'
   ```

### No sound?

- Check macOS volume and mute status
- Try a different voice: `auto-speak config voice Alex`
- Run `say "test"` to verify macOS TTS works

### Progress updates not working?

- Check if progress is enabled: `auto-speak config` and look for `progress.enabled`
- Progress timer only starts after acknowledgment is spoken
- Timer is stopped when Claude finishes responding

### TTS audio overlapping?

The TTS manager automatically cancels existing audio before speaking new text. If you still experience overlap:
- Check logs: `auto-speak logs`
- The stop hook should show "Canceling existing TTS"

### Summaries too verbose?

- Enable LLM summarization: `auto-speak config llm on`
- Ensure Ollama is running: `ollama serve`

### Ollama errors?

- Start Ollama: `ollama serve`
- Check model: `ollama list | grep qwen`
- Pull model: `ollama pull qwen2.5:1.5b`

## File Structure

```
~/.claude-auto-speak/
├── config.json              # Configuration
├── auto-speak.log           # Stop hook logs
├── prompt-ack-hook.log      # Acknowledgment hook logs
├── progress-timer.log       # Progress timer logs
├── tts-manager.log          # TTS manager logs
├── tts.pid                  # Active TTS process ID
├── progress-timer.pid       # Active timer process ID
├── transcript-watcher.pid   # Active watcher process ID
├── bin/
│   ├── auto-speak           # CLI commands
│   └── speak                # TTS wrapper
├── lib/
│   ├── config.mjs           # Config management
│   ├── output-filter.mjs    # Text filtering
│   ├── summarize.mjs        # LLM summarization
│   ├── tts-manager.sh       # TTS overlap prevention
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

## Hooks Registered

Auto-speak registers two Claude Code hooks:

| Hook | Script | Purpose |
|------|--------|---------|
| `UserPromptSubmit` | `prompt-ack-hook.sh` | Speaks Claude's first response as acknowledgment |
| `Stop` | `stop-hook.sh` | Speaks final summary when Claude finishes |

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

# Remove from PATH (edit ~/.zshrc or ~/.bash_profile)
# Delete line: export PATH="$PATH:$HOME/.claude-auto-speak/bin"
```

## Privacy

- All processing is local (no cloud services required)
- Ollama runs locally with no external connections
- Transcript data is read-only (never modified)
- Logs are stored in `~/.claude-auto-speak/`

## Credits

Built for Claude Code by the Ralph CLI team.

---

**Questions?** Open an issue at https://github.com/AskTinNguyen/claude-auto-speak
