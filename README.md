# Claude Auto-Speak

**Automatic text-to-speech for Claude Code responses.**

https://github.com/user-attachments/assets/demo.mp4

> Hear Claude's responses spoken aloud. Uses intelligent LLM summarization to condense long outputs into natural spoken summaries.

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/AskTinNguyen/claude-auto-speak/main/install.sh | bash
```

## Usage

```bash
# Enable auto-speak
auto-speak on

# Test it's working
auto-speak test

# Use Claude Code - responses are now spoken!
```

## Requirements

- **macOS** (uses built-in `say` command)
- **Claude Code CLI**
- **Node.js 18+**
- **jq** (for JSON parsing)
- **Ollama + Qwen** (optional, for smart summarization)

## How It Works

1. Claude Code completes a response
2. Stop hook triggers automatically
3. Response is filtered (removes code, markdown, paths)
4. Qwen LLM creates a 1-2 sentence summary
5. macOS `say` speaks the summary

**Example:**
- You ask: "How many tests passed?"
- Claude outputs: *[500 lines of test output]*
- You hear: "All 47 tests passed"

## Commands

```bash
auto-speak on       # Enable
auto-speak off      # Disable
auto-speak status   # Show status
auto-speak test     # Test TTS
auto-speak logs     # View logs
auto-speak config   # Configure
```

## Configuration

```bash
auto-speak config voice Alex      # Change voice
auto-speak config rate 200        # Change speed
auto-speak config llm off         # Disable LLM
```

Available voices: Samantha, Alex, Victoria, Karen, Daniel, and more (`say -v ?`)

## Smart Summarization

For intelligent summarization, install Ollama:

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5:1.5b
ollama serve
```

Without Ollama, auto-speak falls back to regex-based cleanup.

## Uninstall

```bash
~/.claude-auto-speak/uninstall.sh
```

## Documentation

See [SKILL.md](SKILL.md) for complete documentation.

## License

MIT
