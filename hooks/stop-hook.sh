#!/usr/bin/env bash
# Claude Auto-Speak Stop Hook
# Triggered by Claude Code Stop hook - speaks Claude's last response via TTS
# Uses local Qwen model for intelligent summarization with regex fallback
#
# Installation: This hook is automatically registered in ~/.claude/settings.local.json
# by the auto-speak CLI

set -euo pipefail

INSTALL_DIR="${HOME}/.claude-auto-speak"
CONFIG_FILE="${INSTALL_DIR}/config.json"
LOG_FILE="${INSTALL_DIR}/auto-speak.log"
SUMMARIZE_SCRIPT="${INSTALL_DIR}/lib/summarize.mjs"

# Function to log messages
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

# Check if auto-speak is enabled
is_auto_speak_enabled() {
  if [[ ! -f "$CONFIG_FILE" ]]; then
    return 1
  fi

  # Use jq if available, otherwise grep
  if command -v jq &>/dev/null; then
    local enabled=$(jq -r '.enabled // false' "$CONFIG_FILE" 2>/dev/null)
    [[ "$enabled" == "true" ]]
  else
    grep -q '"enabled"[[:space:]]*:[[:space:]]*true' "$CONFIG_FILE" 2>/dev/null
  fi
}

# Get config value
get_config() {
  local key="$1"
  local default="$2"

  if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "$default"
    return
  fi

  if command -v jq &>/dev/null; then
    local value=$(jq -r ".${key} // \"${default}\"" "$CONFIG_FILE" 2>/dev/null)
    echo "$value"
  else
    echo "$default"
  fi
}

# Speak text using the speak command (handles TTS engine selection)
speak_text() {
  local text="$1"
  local speak_cmd="${INSTALL_DIR}/bin/speak"

  if [[ -f "$speak_cmd" ]]; then
    # Use the speak command which handles engine selection
    echo "$text" | node "$speak_cmd" &
  else
    # Fallback to macOS say if speak command not found
    local voice=$(get_config "voice" "Samantha")
    local rate=$(get_config "rate" "175")
    say -v "$voice" -r "$rate" "$text" &
  fi
}

# Main hook logic
main() {
  log "=== Auto-speak hook triggered ==="

  # Check if auto-speak is enabled
  if ! is_auto_speak_enabled; then
    log "Auto-speak disabled, skipping TTS"
    exit 0
  fi

  # Read hook data from stdin (JSON)
  local hook_data=""
  if [[ ! -t 0 ]]; then
    hook_data=$(cat)
    log "Hook data received: ${hook_data:0:200}..."
  else
    log "WARN: No hook data received on stdin"
  fi

  # Extract transcript path from hook data
  local transcript_path=""
  if command -v jq &>/dev/null && [[ -n "$hook_data" ]]; then
    transcript_path=$(echo "$hook_data" | jq -r '.transcript_path // ""' 2>/dev/null)
  fi

  if [[ -z "$transcript_path" ]] || [[ ! -f "$transcript_path" ]]; then
    log "ERROR: No valid transcript path found"
    log "Hook data: $hook_data"
    exit 0
  fi

  log "Transcript path: $transcript_path"

  # Check if summarizer script exists
  if [[ ! -f "$SUMMARIZE_SCRIPT" ]]; then
    log "ERROR: Summarizer script not found: $SUMMARIZE_SCRIPT"
    exit 0
  fi

  log "Running context-aware summarization..."

  # Run summarizer (filters + LLM summarization)
  local summary=""
  summary=$(node "$SUMMARIZE_SCRIPT" "$transcript_path" 2>>"$LOG_FILE")
  local exit_code=$?

  if [[ $exit_code -ne 0 ]]; then
    log "Summarizer failed with exit code $exit_code"
    exit 0
  fi

  if [[ -z "$summary" ]]; then
    log "Summary empty, skipping TTS"
    exit 0
  fi

  log "Summary generated: ${#summary} characters"
  log "Summary preview: ${summary:0:100}..."

  # Speak the summary (non-blocking)
  speak_text "$summary"
  local speak_pid=$!

  log "TTS started (PID: $speak_pid)"
  log "=== Hook complete ==="

  exit 0
}

# Run main
main
