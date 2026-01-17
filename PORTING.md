# Porting Guide: ralph-cli → claude-auto-speak

This document provides a step-by-step guide for porting features and commits from the ralph-cli repository to claude-auto-speak.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Differences](#architecture-differences)
3. [Step-by-Step Porting Process](#step-by-step-porting-process)
4. [Path Translation Guide](#path-translation-guide)
5. [Common Patterns](#common-patterns)
6. [Testing](#testing)
7. [Commit Message Format](#commit-message-format)
8. [Real-World Examples](#real-world-examples)

---

## Overview

### What are these repositories?

**ralph-cli** (`/Users/tinnguyen/ralph-cli`)
- Full-featured autonomous coding loop for Claude Code
- PRD-based workflow with bash implementation
- Includes UI server, factory mode, stream execution, and voice features
- Voice features are secondary to main PRD/build workflow

**claude-auto-speak** (`/Users/tinnguyen/claude-auto-speak`)
- Standalone voice-first companion tool for Claude Code
- Focuses exclusively on TTS (text-to-speech) and voice interaction
- Lightweight, single-purpose installation via `~/.claude-auto-speak/`
- No PRD/build workflow, no UI server, no factory mode

### Why port between them?

Voice-related improvements developed in ralph-cli often benefit claude-auto-speak users:
- TTS overlap prevention
- Text cleaning and summarization
- Audio coordination and session management
- Orphaned process cleanup

Since claude-auto-speak is the dedicated voice tool, it should receive all voice-related improvements from ralph-cli.

---

## Architecture Differences

### Key Structural Differences

| Feature | ralph-cli | claude-auto-speak |
|---------|-----------|-------------------|
| **Installation** | Project-local (`.agents/ralph/`) | Global (`~/.claude-auto-speak/`) |
| **Primary Purpose** | Autonomous coding loops | Voice-only TTS companion |
| **Root Variable** | `RALPH_ROOT` | `INSTALL_DIR` |
| **Script Location** | `.agents/ralph/` | `~/.claude-auto-speak/` |
| **Config File** | `.agents/ralph/config.sh` | `~/.claude-auto-speak/config.sh` |
| **Voice Scripts** | `.agents/ralph/auto-speak-*.sh` | `~/.claude-auto-speak/auto-speak-*.sh` |
| **Library Scripts** | `.agents/ralph/lib/` | `~/.claude-auto-speak/lib/` |
| **Prompt Scripts** | `.agents/ralph/PROMPT_*.md` | N/A (no PRD workflow) |
| **UI Server** | `ui/` directory | N/A |
| **Factory Mode** | `.agents/ralph/factory.sh` | N/A |
| **Stream Execution** | `.agents/ralph/stream.sh` | N/A |

### Path Resolution Patterns

**ralph-cli** uses multiple root variables depending on context:
```bash
# In ralph-cli
RALPH_ROOT=${RALPH_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Voice scripts are in:
$RALPH_ROOT/.agents/ralph/auto-speak-hook.sh
$RALPH_ROOT/.agents/ralph/lib/voice-coordination.sh
```

**claude-auto-speak** uses a single consistent root:
```bash
# In claude-auto-speak
INSTALL_DIR="${HOME}/.claude-auto-speak"

# All scripts are in:
$INSTALL_DIR/auto-speak-hook.sh
$INSTALL_DIR/lib/voice-coordination.sh
```

### Feature Scope Differences

**ralph-cli includes (NOT in claude-auto-speak):**
- PRD generation (`PROMPT_prd.md`, `PROMPT_plan.md`)
- Build loops (`loop.sh`, `PROMPT_build.md`)
- Factory orchestration (`factory.sh`, `factory/`)
- Stream execution (`stream.sh`)
- UI server (`ui/`)
- Git worktrees and parallel execution
- MCP integrations

**claude-auto-speak includes (core features):**
- Voice hooks (`auto-speak-hook.sh`, `prompt-ack-hook.sh`)
- TTS coordination (`lib/voice-coordination.sh`)
- Process monitoring (`auto-speak-monitor.sh`)
- Text summarization (`lib/summarize.mjs`)
- Transcript watching (`lib/transcript-watcher.mjs`)
- Orphaned process cleanup (`cleanup-orphans.sh`)

---

## Step-by-Step Porting Process

### 1. Identify Relevant Commits

Start in ralph-cli repository:

```bash
cd /Users/tinnguyen/ralph-cli

# View recent commits
git log --oneline -20

# Filter voice-related commits
git log --oneline --grep="voice\|tts\|speak\|audio" -20

# Check specific date range
git log --oneline --since="2026-01-10" --until="2026-01-17"
```

**Look for commits that:**
- Modify voice-related scripts (`auto-speak-*.sh`, `summarize-for-tts.mjs`, etc.)
- Fix audio/TTS issues
- Improve text cleaning or summarization
- Add orphaned process cleanup
- Enhance coordination or overlap prevention

**Skip commits that:**
- Only modify PRD/build workflow files (`loop.sh`, `PROMPT_*.md`)
- Only touch UI code (`ui/`)
- Only affect factory mode (`factory.sh`, `factory/`)
- Only modify stream execution (`stream.sh`)

### 2. Examine Commit Details

```bash
# Show full commit details
git show <commit-hash>

# Show only file statistics
git show <commit-hash> --stat

# Show specific file changes
git show <commit-hash> -- path/to/file.sh
```

**Key information to extract:**
- What files were changed?
- What was the purpose (bug fix, feature, improvement)?
- Are there any ralph-cli-specific dependencies?
- Does it reference RALPH_ROOT or other ralph-cli variables?

### 3. Determine Portability

**✅ Port if the commit:**
- Modifies voice/TTS scripts that exist in both repos
- Fixes bugs in shared functionality
- Improves text cleaning, summarization, or audio quality
- Adds new voice features applicable to standalone usage
- Fixes orphaned process issues
- Enhances cross-session coordination

**❌ Skip if the commit:**
- Only modifies PRD/build workflow (not in claude-auto-speak)
- Requires UI server or factory mode
- Depends on RALPH_ROOT-specific features (worktrees, streams)
- Uses MCP integrations specific to ralph-cli
- Modifies files that don't exist in claude-auto-speak

### 4. Translate Paths

Use the [Path Translation Guide](#path-translation-guide) to map file paths:

```bash
# Example translation
# ralph-cli path:
.agents/ralph/auto-speak-hook.sh

# claude-auto-speak path:
auto-speak-hook.sh  # (at repo root, installed to ~/.claude-auto-speak/)
```

### 5. Adapt Variable References

Replace ralph-cli-specific variables:

```bash
# RALPH_ROOT → INSTALL_DIR
# Before (ralph-cli):
source "${RALPH_ROOT}/.agents/ralph/lib/voice-coordination.sh"

# After (claude-auto-speak):
source "${INSTALL_DIR}/lib/voice-coordination.sh"
```

```bash
# SCRIPT_DIR usage (may need adjustment)
# Before (ralph-cli):
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/helper.sh"

# After (claude-auto-speak):
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/helper.sh"  # Usually fine as-is
```

### 6. Apply Changes

```bash
cd /Users/tinnguyen/claude-auto-speak

# Edit the corresponding files
# Apply the logic changes from ralph-cli commit
# Use path translations and variable adaptations
```

**Common workflow:**
1. Open ralph-cli commit in one terminal: `git show <hash>`
2. Open claude-auto-speak file in editor
3. Manually apply the changes, translating paths/variables
4. Test the changes (see [Testing](#testing))

### 7. Test Thoroughly

See [Testing](#testing) section for detailed test procedures.

### 8. Commit with Reference

See [Commit Message Format](#commit-message-format) for proper commit message structure.

---

## Path Translation Guide

### Core Script Paths

| ralph-cli | claude-auto-speak | Notes |
|-----------|-------------------|-------|
| `.agents/ralph/auto-speak-hook.sh` | `auto-speak-hook.sh` | Voice hook for Claude output |
| `.agents/ralph/prompt-ack-hook.sh` | `prompt-ack-hook.sh` | Immediate acknowledgment hook |
| `.agents/ralph/auto-speak-monitor.sh` | `auto-speak-monitor.sh` | Background monitoring process |
| `.agents/ralph/auto-speak-wrapper.sh` | `auto-speak-wrapper.sh` | Wrapper for hook execution |
| `.agents/ralph/cleanup-orphans.sh` | `cleanup-orphans.sh` | Orphaned process cleanup |
| `.agents/ralph/progress-timer.sh` | N/A | Not needed (no build loops) |

### Library Script Paths

| ralph-cli | claude-auto-speak | Notes |
|-----------|-------------------|-------|
| `.agents/ralph/summarize-for-tts.mjs` | `lib/summarize.mjs` | Text cleaning for TTS |
| `.agents/ralph/transcript-watcher.mjs` | `lib/transcript-watcher.mjs` | Session monitoring |
| `.agents/ralph/lib/voice-coordination.sh` | `lib/voice-coordination.sh` | Cross-session coordination |
| `.agents/ralph/lib/*.sh` | `lib/*.sh` | Other library scripts |

### Configuration Paths

| ralph-cli | claude-auto-speak | Notes |
|-----------|-------------------|-------|
| `.agents/ralph/config.sh` | `config.sh` | Main configuration |
| `.agents/ralph/notify.conf` | N/A | Not used in claude-auto-speak |

### Files NOT in claude-auto-speak

| ralph-cli Path | Reason Not Ported |
|----------------|-------------------|
| `.agents/ralph/loop.sh` | PRD/build workflow only |
| `.agents/ralph/stream.sh` | Stream execution only |
| `.agents/ralph/factory.sh` | Factory orchestration only |
| `.agents/ralph/PROMPT_*.md` | PRD/build prompts only |
| `ui/**/*` | UI server not included |
| `.ralph/**/*` | PRD data directory not used |

### Variable Translation

| ralph-cli Variable | claude-auto-speak Variable | Usage |
|-------------------|---------------------------|-------|
| `RALPH_ROOT` | `INSTALL_DIR` | Root directory for scripts |
| `SCRIPT_DIR` | `SCRIPT_DIR` | Usually same (script's directory) |
| `RALPH_AUTO_SPEAK` | `AUTO_SPEAK_ENABLED` | Enable/disable voice |
| `RALPH_VOICE_*` | `AUTO_SPEAK_VOICE_*` | Voice configuration |

---

## Common Patterns

### Pattern 1: Path Resolution Changes

**In ralph-cli, you might see:**
```bash
# Uses RALPH_ROOT to find scripts
source "${RALPH_ROOT}/.agents/ralph/lib/voice-coordination.sh"
```

**Port to claude-auto-speak as:**
```bash
# Uses INSTALL_DIR consistently
source "${INSTALL_DIR}/lib/voice-coordination.sh"
```

### Pattern 2: Script Directory Resolution

**In ralph-cli:**
```bash
# May use RALPH_ROOT or SCRIPT_DIR depending on context
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "${SCRIPT_DIR}/summarize-for-tts.mjs" "$input"
```

**In claude-auto-speak:**
```bash
# SCRIPT_DIR usually works the same way
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "${SCRIPT_DIR}/lib/summarize.mjs" "$input"
# Note: also check path (summarize.mjs is in lib/ subdirectory)
```

### Pattern 3: Configuration Variables

**In ralph-cli:**
```bash
if [[ "${RALPH_AUTO_SPEAK:-false}" == "true" ]]; then
  # Voice features enabled
fi
```

**In claude-auto-speak:**
```bash
if [[ "${AUTO_SPEAK_ENABLED:-true}" == "true" ]]; then
  # Voice features enabled (default: true)
fi
```

### Pattern 4: Text Cleaning Improvements

**Common improvement pattern:**
```javascript
// In summarize-for-tts.mjs or lib/summarize.mjs
function cleanSummary(text) {
  return text
    .replace(/\*\*/g, '')        // Remove bold markdown
    .replace(/`[^`]+`/g, '')     // Remove inline code
    .replace(/@\w+/g, '')        // NEW: Remove @ mentions
    .replace(/\.[a-z]{2,4}\b/gi, '') // NEW: Remove file extensions
    .replace(/\/[\w\/\-\.]+/g, '') // NEW: Remove file paths
    // ... more cleaning rules
}
```

**When porting:**
1. Find the `cleanSummary()` function in claude-auto-speak's `lib/summarize.mjs`
2. Add the new cleaning rules from ralph-cli
3. Preserve existing claude-auto-speak-specific rules
4. Test with sample text to ensure TTS quality improves

### Pattern 5: Process Cleanup

**Common improvement pattern:**
```bash
# Kill orphaned processes
pkill -f "say " 2>/dev/null || true
pkill -f "piper " 2>/dev/null || true
pkill -f "auto-speak-monitor" 2>/dev/null || true
```

**When porting:**
1. Ensure process names match (usually the same)
2. Check if any ralph-cli-specific processes are referenced
3. Remove references to build loop processes (`progress-timer.sh`, etc.)

### Pattern 6: Qwen Prompt Improvements

**Common improvement pattern:**
```javascript
// Stricter Qwen prompts for better TTS output
const system = `You are a voice-friendly text summarizer...

CRITICAL RULES:
- NEVER include file names or paths (no .sh, .js, .mjs, .md, etc.)
- NEVER use symbols: @ | < > { } [ ]
- Use plain conversational English
- Keep under 20 words
...`;
```

**When porting:**
1. Find the Qwen prompt in `lib/summarize.mjs`
2. Update the prompt text with stricter rules from ralph-cli
3. Ensure emphasis keywords match (CRITICAL, NEVER, etc.)
4. Test with sample inputs to verify output quality

### Pattern 7: Cross-Session Coordination

**Common improvement pattern:**
```bash
# Check if another session is speaking
COORDINATION_FILE="/tmp/claude-tts-active"

if [[ -f "$COORDINATION_FILE" ]]; then
  # Another session active, skip or wait
  echo "Skipping: another session is speaking"
  exit 0
fi

# Mark this session as active
echo $$ > "$COORDINATION_FILE"
trap 'rm -f "$COORDINATION_FILE"' EXIT
```

**When porting:**
1. Usually ports directly (same coordination mechanism)
2. Check if file paths are consistent (`/tmp/claude-tts-active`)
3. Ensure trap cleanup is preserved

---

## Testing

### Pre-Testing Checklist

Before testing ported changes:

- [ ] All file paths have been translated correctly
- [ ] All variable references have been adapted (RALPH_ROOT → INSTALL_DIR)
- [ ] No references to ralph-cli-only features (PRD, build loops, UI)
- [ ] Script still uses correct installation location (`~/.claude-auto-speak/`)

### Manual Testing Process

#### 1. Test Installation/Setup

```bash
cd /Users/tinnguyen/claude-auto-speak

# Verify scripts are executable
ls -la auto-speak-*.sh cleanup-orphans.sh

# Check paths in modified scripts
grep -n "INSTALL_DIR\|RALPH_ROOT" auto-speak-hook.sh
grep -n "INSTALL_DIR\|RALPH_ROOT" lib/*.mjs
```

#### 2. Test Text Cleaning (for TTS changes)

```bash
cd /Users/tinnguyen/claude-auto-speak

# Test summarization with sample text
node lib/summarize.mjs <<EOF
I've updated the \`auto-speak-hook.sh\` file and fixed the @mention issue.
The changes are in /path/to/.agents/ralph/lib/voice-coordination.sh
This should resolve the TTS jibberish problem.
EOF

# Expected output: Clean conversational text, no file paths or symbols
```

#### 3. Test Voice Hooks

```bash
cd /Users/tinnguyen/claude-auto-speak

# Test with sample input
echo "Test message" | ./auto-speak-hook.sh

# Check for errors
echo $?  # Should be 0

# Verify audio played (listen for TTS output)
```

#### 4. Test Process Cleanup

```bash
cd /Users/tinnguyen/claude-auto-speak

# Start some test processes (optional)
say "Test message one" &
say "Test message two" &

# Run cleanup
./cleanup-orphans.sh

# Verify processes are killed
ps aux | grep -E "say |piper " | grep -v grep
# Should show nothing
```

#### 5. Test Cross-Session Coordination

```bash
cd /Users/tinnguyen/claude-auto-speak

# Terminal 1: Start first session
echo "First message" | ./auto-speak-hook.sh &

# Terminal 2: Immediately start second session
echo "Second message" | ./auto-speak-hook.sh &

# Verify only one plays at a time (no overlap)
# Check coordination file
cat /tmp/claude-tts-active  # Should show PID of active session
```

#### 6. Test with Claude Code

```bash
# In a project with claude-auto-speak installed
cd /path/to/test-project

# Start a Claude Code session
claude

# Trigger voice output by asking Claude a question
# Expected: Clean, non-overlapping TTS output

# Ask follow-up questions rapidly
# Expected: Previous audio stops, new audio starts immediately
```

### Automated Test Script

If a test script exists, run it:

```bash
cd /Users/tinnguyen/claude-auto-speak/tests

# Run all tests
npm test

# Run specific test
node test-voice-coordination.mjs
```

### Integration Testing Checklist

After porting voice-related changes:

- [ ] TTS plays without garbled audio (no file paths, symbols, markdown)
- [ ] Only one TTS session plays at a time (no overlap)
- [ ] Orphaned `say`/`piper` processes are cleaned up properly
- [ ] Hooks execute without errors in Claude Code sessions
- [ ] Cross-session coordination works (rapid questions don't overlap)
- [ ] Text summarization produces natural conversational output
- [ ] Process monitoring (`auto-speak-monitor.sh`) runs without issues

---

## Commit Message Format

### Conventional Commit Structure

```
<type>(<scope>): <short description>

Ported improvements from ralph-cli commit <hash> to [describe purpose].

Changes:
- <change 1>
- <change 2>
- <change 3>

[Optional: Adaptation notes]
Note: <Any ralph-cli-specific features that were skipped or adapted>

[Optional: Issue reference]
Fixes <issue description>

Source: ralph-cli <full-commit-hash>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Type Guidelines

| Type | Usage |
|------|-------|
| `fix` | Bug fixes, error corrections, issue resolutions |
| `feat` | New features, capabilities, enhancements |
| `docs` | Documentation updates (README, SKILL.md, etc.) |
| `refactor` | Code restructuring without changing behavior |
| `test` | Test additions or modifications |
| `chore` | Build, config, dependency updates |

### Scope Guidelines

| Scope | Usage |
|-------|-------|
| `tts` | Text-to-speech, audio output, voice quality |
| `voice` | Voice hooks, coordination, monitoring |
| `text` | Text cleaning, summarization, processing |
| `process` | Process management, cleanup, monitoring |
| `config` | Configuration, environment variables |
| `install` | Installation, setup, uninstall |

### Example Commit Messages

#### Example 1: Text Cleaning Improvements

```
fix(tts): improve text cleaning and Qwen prompts for clearer TTS output

Ported improvements from ralph-cli commit e1cb5fe to prevent garbled TTS audio.

Changes:
- Enhanced text cleaning in cleanSummary()
  - Remove @ symbols (markdown mentions)
  - Remove file paths and extensions (.sh, .js, .mjs, etc.)
  - Remove path-like patterns (.agents/ralph/lib/)
  - Remove URLs and HTML/XML tags
  - Remove special characters that TTS struggles with (|, <>, {}, [])
  - Clean up extra punctuation (multiple periods/commas)

- Stricter Qwen prompts to avoid technical jargon
  - Changed "Rules:" to "CRITICAL RULES:" for emphasis
  - Added explicit instructions to avoid file names and extensions
  - Added explicit list of symbols to NEVER include
  - Emphasize plain conversational English over technical terms
  - Added word count limit (under 20 words) for conciseness
  - Instruct to describe what was DONE, not mention file/script names

Note: Path resolution fixes (SCRIPT_DIR vs RALPH_ROOT) from ralph-cli
were not needed here as claude-auto-speak already uses INSTALL_DIR
consistently for all script paths.

Fixes issue where TTS was speaking file paths and markdown syntax
instead of natural language summaries.

Source: ralph-cli e1cb5fee68e2abc9e47068beda41accd3e43c539

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

#### Example 2: Cross-Session Coordination

```
fix(voice): add cross-session coordination and skip-on-session-start

Ported from ralph-cli commit 4f9872a to prevent audio overlap between
multiple Claude Code sessions.

Changes:
- Add coordination file check in auto-speak-hook.sh
  - Check /tmp/claude-tts-active before speaking
  - Skip TTS if another session is active
  - Mark session active with PID, cleanup on exit

- Add skip-on-session-start behavior
  - First message after session start is silent
  - Prevents initial greeting from interrupting user
  - Subsequent messages play normally

- Kill previous TTS processes on new output
  - pkill say/piper processes before starting new audio
  - Prevents overlap within same session
  - Uses trap to ensure cleanup on script exit

Fixes issue where multiple Claude sessions would speak simultaneously,
causing garbled overlapping audio.

Source: ralph-cli 4f9872ae12b34567890abcdef1234567890abcde

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

#### Example 3: Orphaned Process Cleanup

```
fix(voice): kill orphaned say/piper processes to prevent audio overlap

Ported from ralph-cli commit f6cef7b to clean up orphaned TTS processes
that continue playing after Claude session exits.

Changes:
- Add cleanup-orphans.sh script
  - Kills orphaned say and piper processes
  - Kills auto-speak-monitor processes without active parent
  - Safe cleanup with error suppression

- Integrate into auto-speak-hook.sh
  - Run cleanup before starting new TTS
  - Ensures clean state for each voice output

- Add manual cleanup command
  - Users can run ~/.claude-auto-speak/cleanup-orphans.sh
  - Useful for debugging or manual intervention

Fixes issue where interrupted Claude sessions left TTS processes running
in background, causing unexpected audio playback later.

Source: ralph-cli f6cef7b234567890abcdef1234567890abcdef12

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Commit Message Checklist

Before committing:

- [ ] Commit type is correct (`fix`, `feat`, `docs`, etc.)
- [ ] Scope is appropriate (`tts`, `voice`, `process`, etc.)
- [ ] Short description is concise (under 72 characters)
- [ ] Body mentions porting from ralph-cli with commit hash
- [ ] Changes are listed with bullet points
- [ ] Adaptation notes explain ralph-cli-specific features that were skipped
- [ ] Source line includes full commit hash from ralph-cli
- [ ] Co-authored-by line is present

---

## Real-World Examples

### Example 1: TTS Text Cleaning (e1cb5fe → 85183e8)

**Ralph-CLI commit:** `e1cb5fe` - "fix(voice): resolve path errors and improve TTS text cleaning"

**Files changed in ralph-cli:**
- `.agents/ralph/auto-speak-hook.sh`
- `.agents/ralph/prompt-ack-hook.sh`
- `.agents/ralph/summarize-for-tts.mjs`

**Porting steps:**

1. **Examined ralph-cli commit:**
   ```bash
   cd /Users/tinnguyen/ralph-cli
   git show e1cb5fe --stat
   git show e1cb5fe -- .agents/ralph/summarize-for-tts.mjs
   ```

2. **Identified relevant changes:**
   - ✅ Text cleaning improvements in `cleanSummary()` function
   - ✅ Qwen prompt enhancements
   - ❌ Path resolution fixes (SCRIPT_DIR vs RALPH_ROOT) - **NOT NEEDED**

3. **Why path fixes not needed:**
   - ralph-cli had inconsistent usage of `RALPH_ROOT` vs `SCRIPT_DIR`
   - claude-auto-speak already uses `INSTALL_DIR` consistently
   - No path resolution bugs exist in claude-auto-speak

4. **Applied changes to claude-auto-speak:**
   ```bash
   cd /Users/tinnguyen/claude-auto-speak
   # Edited lib/summarize.mjs (not summarize-for-tts.mjs)
   # Added text cleaning rules from ralph-cli
   # Enhanced Qwen prompts with stricter rules
   ```

5. **Path translations:**
   - `.agents/ralph/summarize-for-tts.mjs` → `lib/summarize.mjs`
   - (Hook files were not changed in claude-auto-speak)

6. **Tested changes:**
   ```bash
   # Test text cleaning
   node lib/summarize.mjs <<EOF
   I updated @file in /path/to/.agents/ralph/lib/script.sh
   EOF
   # Result: Clean conversational text, no symbols or paths
   ```

7. **Committed with reference:**
   ```bash
   git add lib/summarize.mjs
   git commit -m "fix(tts): improve text cleaning and Qwen prompts for clearer TTS output

   Ported improvements from ralph-cli commit e1cb5fe to prevent garbled TTS audio.

   Changes:
   - Enhanced text cleaning in cleanSummary()
   - Stricter Qwen prompts to avoid technical jargon

   Note: Path resolution fixes (SCRIPT_DIR vs RALPH_ROOT) from ralph-cli
   were not needed here as claude-auto-speak already uses INSTALL_DIR
   consistently for all script paths.

   Source: ralph-cli e1cb5fee68e2abc9e47068beda41accd3e43c539

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```

**Key lesson:** Not all changes in a ralph-cli commit need to be ported. Understand the context and only port what's relevant.

---

### Example 2: Cross-Session Coordination

**Ralph-CLI commits:** Multiple commits related to voice coordination

**Files changed in ralph-cli:**
- `.agents/ralph/auto-speak-hook.sh`
- `.agents/ralph/lib/voice-coordination.sh`

**Porting steps:**

1. **Examined relevant commits:**
   ```bash
   cd /Users/tinnguyen/ralph-cli
   git log --oneline --grep="coordination" -5
   git show <hash> -- .agents/ralph/auto-speak-hook.sh
   ```

2. **Identified pattern:**
   - Cross-session coordination using `/tmp/claude-tts-active`
   - PID-based locking to prevent overlap
   - Skip-on-session-start behavior

3. **Applied to claude-auto-speak:**
   ```bash
   cd /Users/tinnguyen/claude-auto-speak
   # Added coordination logic to auto-speak-hook.sh
   # Created lib/voice-coordination.sh if needed
   ```

4. **Path translations:**
   - `.agents/ralph/auto-speak-hook.sh` → `auto-speak-hook.sh`
   - `.agents/ralph/lib/voice-coordination.sh` → `lib/voice-coordination.sh`
   - `RALPH_ROOT` → `INSTALL_DIR` in sourcing paths

5. **Variable adaptations:**
   ```bash
   # Before (ralph-cli):
   source "${RALPH_ROOT}/.agents/ralph/lib/voice-coordination.sh"

   # After (claude-auto-speak):
   source "${INSTALL_DIR}/lib/voice-coordination.sh"
   ```

6. **Tested changes:**
   ```bash
   # Terminal 1
   echo "Test one" | ./auto-speak-hook.sh &

   # Terminal 2 (immediately)
   echo "Test two" | ./auto-speak-hook.sh &

   # Verify no audio overlap
   cat /tmp/claude-tts-active  # Shows active PID
   ```

7. **Committed with reference:**
   ```bash
   git add auto-speak-hook.sh lib/voice-coordination.sh
   git commit  # (See Example 2 in Commit Message Format section)
   ```

---

### Example 3: Orphaned Process Cleanup

**Ralph-CLI commit:** "fix(voice): kill orphaned say/piper processes"

**Files changed in ralph-cli:**
- `.agents/ralph/cleanup-orphans.sh` (new file)
- `.agents/ralph/auto-speak-hook.sh` (integration)

**Porting steps:**

1. **Examined commit:**
   ```bash
   cd /Users/tinnguyen/ralph-cli
   git show <hash> -- .agents/ralph/cleanup-orphans.sh
   ```

2. **Identified new file:**
   - New standalone script for killing orphaned processes
   - Integration into voice hooks

3. **Applied to claude-auto-speak:**
   ```bash
   cd /Users/tinnguyen/claude-auto-speak
   # Created cleanup-orphans.sh at repo root
   # Added integration to auto-speak-hook.sh
   ```

4. **Path translations:**
   - `.agents/ralph/cleanup-orphans.sh` → `cleanup-orphans.sh`
   - Script will be installed to `~/.claude-auto-speak/cleanup-orphans.sh`

5. **No variable adaptations needed:**
   - Script uses `pkill` commands (no path references)
   - Works the same in both repos

6. **Tested changes:**
   ```bash
   # Create orphaned processes
   say "Test" &
   say "Test 2" &

   # Run cleanup
   ./cleanup-orphans.sh

   # Verify cleanup
   ps aux | grep "say " | grep -v grep  # Should be empty
   ```

7. **Committed with reference:**
   ```bash
   git add cleanup-orphans.sh auto-speak-hook.sh
   git commit  # (See Example 3 in Commit Message Format section)
   ```

---

## Tips for AI Agents

When porting commits as an AI agent:

1. **Always check file existence first:**
   ```bash
   # Does the file exist in claude-auto-speak?
   ls -la /Users/tinnguyen/claude-auto-speak/lib/summarize.mjs
   ```

2. **Read both versions before applying:**
   ```bash
   # Ralph-CLI version
   git show <hash>:.agents/ralph/file.sh

   # Claude-auto-speak current version
   cat /Users/tinnguyen/claude-auto-speak/file.sh
   ```

3. **Understand the change before porting:**
   - What problem does it solve?
   - Is the problem relevant to claude-auto-speak?
   - Are there dependencies on ralph-cli-specific features?

4. **Test thoroughly:**
   - Don't assume changes work the same in both repos
   - Manual testing is essential for voice features
   - Listen to actual TTS output to verify quality

5. **Document adaptations:**
   - Explicitly note what was NOT ported and why
   - Explain any differences in implementation
   - Include troubleshooting context in commit message

6. **Preserve existing functionality:**
   - Don't remove claude-auto-speak-specific features
   - Merge new logic with existing logic carefully
   - Keep both repos' unique behaviors intact

7. **Use clear commit references:**
   - Always include source commit hash from ralph-cli
   - Link to issues if applicable
   - Make it easy to trace lineage of changes

---

## Conclusion

Porting between ralph-cli and claude-auto-speak requires careful attention to:
- **Architecture differences** (project-local vs global installation)
- **Path translations** (`.agents/ralph/` vs repo root)
- **Variable adaptations** (`RALPH_ROOT` vs `INSTALL_DIR`)
- **Feature scope** (what exists in both vs ralph-cli-only)

By following this guide, you can consistently and safely port voice-related improvements from ralph-cli to claude-auto-speak while preserving the unique characteristics of each repository.

For questions or issues, refer to:
- ralph-cli: `/Users/tinnguyen/ralph-cli/CLAUDE.md`
- claude-auto-speak: `/Users/tinnguyen/claude-auto-speak/SKILL.md`
