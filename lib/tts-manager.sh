#!/usr/bin/env bash
# TTS Manager - Prevents overlapping voice output
# Provides exclusive TTS playback with cross-session coordination
#
# Usage:
#   source ~/.claude-auto-speak/lib/tts-manager.sh
#   speak_exclusive "Hello world"
#
# Functions:
#   cancel_existing_tts - Kill TTS processes from THIS session only
#   speak_exclusive <text> - Wait for lock, cancel our TTS, speak new text
#
# Cross-Session Coordination:
#   Uses global voice lock file to coordinate across multiple Claude Code
#   sessions. Each session is identified by its terminal/parent process.

set -euo pipefail

INSTALL_DIR="${HOME}/.claude-auto-speak"

# Generate session ID from terminal/parent process FIRST
# This ensures each Claude Code session has a unique ID
TTS_SESSION_ID="${TERM_SESSION_ID:-${WINDOWID:-session-${PPID:-$$}}}"
# Sanitize session ID for use in filenames
TTS_SESSION_ID_SAFE=$(echo "$TTS_SESSION_ID" | tr -cd 'a-zA-Z0-9_-')

# Session-specific PID file (prevents cross-session overwrites)
TTS_PID_FILE="${INSTALL_DIR}/tts-${TTS_SESSION_ID_SAFE}.pid"
TTS_LOG_FILE="${INSTALL_DIR}/tts-manager.log"
VOICE_LOCK_DIR="${INSTALL_DIR}/locks"
VOICE_LOCK_FILE="${VOICE_LOCK_DIR}/voice.lock"

# Ensure lock directory exists
mkdir -p "$VOICE_LOCK_DIR" 2>/dev/null || true

# Log to TTS manager log
tts_log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [tts-mgr:${TTS_SESSION_ID_SAFE:0:20}] $*" >> "$TTS_LOG_FILE"
}

# Check if voice lock is held by another session
# Returns 0 if we can proceed (lock free or held by us), 1 if held by another
check_voice_lock() {
  if [[ ! -f "$VOICE_LOCK_FILE" ]]; then
    return 0  # Lock free
  fi

  local lock_pid=$(grep '^PID=' "$VOICE_LOCK_FILE" 2>/dev/null | cut -d= -f2)
  local lock_session=$(grep '^SESSION=' "$VOICE_LOCK_FILE" 2>/dev/null | cut -d= -f2)

  # Check if lock holder process is dead
  if [[ -n "$lock_pid" ]] && ! kill -0 "$lock_pid" 2>/dev/null; then
    tts_log "Lock held by dead process $lock_pid, cleaning up"
    rm -f "$VOICE_LOCK_FILE" 2>/dev/null || true
    return 0  # Lock was stale, now free
  fi

  # Check if lock is held by THIS session
  if [[ -n "$lock_session" && "$lock_session" == "$TTS_SESSION_ID_SAFE" ]]; then
    return 0  # Our lock, can proceed
  fi

  # Lock held by another active session
  tts_log "Lock held by another session: $lock_session (PID: $lock_pid)"
  return 1
}

# Wait for voice lock to be available (with timeout)
# Returns 0 if lock acquired/available, 1 if timeout
wait_for_voice_lock() {
  local timeout_seconds="${1:-10}"
  local interval_ms=300  # 300ms between checks
  local max_iterations=$(( (timeout_seconds * 1000) / interval_ms ))
  local i=0

  tts_log "Waiting for voice lock (timeout: ${timeout_seconds}s, max_iterations: ${max_iterations})..."

  while [[ $i -lt $max_iterations ]]; do
    if check_voice_lock; then
      local waited_seconds=$(( (i * interval_ms) / 1000 ))
      tts_log "Voice lock available after ~${waited_seconds}s (iteration $i)"
      return 0
    fi

    # Sleep 300ms
    sleep 0.3
    i=$((i + 1))

    # Log progress every 10 iterations (~3 seconds)
    if [[ $((i % 10)) -eq 0 ]]; then
      local waited_so_far=$(( (i * interval_ms) / 1000 ))
      tts_log "Still waiting for voice lock... (${waited_so_far}s elapsed)"
    fi
  done

  tts_log "Timeout waiting for voice lock after ${timeout_seconds}s"
  return 1
}

# Acquire voice lock for this session
acquire_voice_lock() {
  mkdir -p "$VOICE_LOCK_DIR" 2>/dev/null || true
  cat > "$VOICE_LOCK_FILE" <<EOF
PID=$$
SESSION=$TTS_SESSION_ID_SAFE
TIME=$(date '+%Y-%m-%d %H:%M:%S')
EOF
  tts_log "Voice lock acquired"
}

# Release voice lock
release_voice_lock() {
  if [[ -f "$VOICE_LOCK_FILE" ]]; then
    local lock_session=$(grep '^SESSION=' "$VOICE_LOCK_FILE" 2>/dev/null | cut -d= -f2)
    # Only release if it's our lock
    if [[ "$lock_session" == "$TTS_SESSION_ID_SAFE" ]]; then
      rm -f "$VOICE_LOCK_FILE" 2>/dev/null || true
      tts_log "Voice lock released"
    fi
  fi
}

# Cancel TTS processes from THIS session only (not other sessions)
cancel_existing_tts() {
  tts_log "Canceling TTS for this session..."

  # Kill our tracked PID if exists (session-specific)
  if [[ -f "$TTS_PID_FILE" ]]; then
    local pid=$(cat "$TTS_PID_FILE" 2>/dev/null || echo "")
    if [[ -n "$pid" ]]; then
      if kill -0 "$pid" 2>/dev/null; then
        tts_log "Killing tracked TTS PID: $pid"
        kill "$pid" 2>/dev/null || true
        # Wait briefly for process to die
        local waited=0
        while kill -0 "$pid" 2>/dev/null && [[ $waited -lt 10 ]]; do
          sleep 0.05
          waited=$((waited + 1))
        done
        # Force kill if still alive
        if kill -0 "$pid" 2>/dev/null; then
          tts_log "Force killing TTS PID: $pid"
          kill -9 "$pid" 2>/dev/null || true
        fi
      fi
    fi
    rm -f "$TTS_PID_FILE"
  fi

  # NOTE: We NO LONGER kill all speak processes globally!
  # This was causing race conditions across sessions.
  # Each session only manages its own TTS PID.

  # Brief wait for cleanup
  sleep 0.1

  tts_log "TTS cancel complete for this session"
}

# Cancel all TTS processes globally (use with caution - only for cleanup)
cancel_all_tts() {
  tts_log "Canceling ALL TTS processes globally..."

  # Kill any speak processes
  local orphans=$(pgrep -f "claude-auto-speak.*speak" 2>/dev/null || echo "")
  if [[ -n "$orphans" ]]; then
    tts_log "Killing all speak processes: $orphans"
    pkill -f "claude-auto-speak.*speak" 2>/dev/null || true
  fi

  # Kill any say processes on macOS
  if command -v say &>/dev/null; then
    local say_pids=$(pgrep say 2>/dev/null || echo "")
    if [[ -n "$say_pids" ]]; then
      tts_log "Killing say processes: $say_pids"
      killall say 2>/dev/null || true
    fi
  fi

  # Kill any piper processes
  local piper_pids=$(pgrep -f "piper" 2>/dev/null || echo "")
  if [[ -n "$piper_pids" ]]; then
    tts_log "Killing piper processes: $piper_pids"
    pkill -f "piper" 2>/dev/null || true
  fi

  sleep 0.3
  tts_log "All TTS canceled"
}

# Speak text exclusively with cross-session coordination
# Usage: speak_exclusive "text to speak"
#        echo "text" | speak_exclusive
#
# This function:
# 1. Waits for the global voice lock if another session is speaking
# 2. Cancels any TTS from THIS session (not others)
# 3. Speaks the new text
speak_exclusive() {
  local text="${1:-}"

  # If no arg provided, read from stdin
  if [[ -z "$text" ]]; then
    text=$(cat)
  fi

  if [[ -z "$text" ]]; then
    tts_log "No text provided, skipping"
    return 0
  fi

  tts_log "Speaking: ${text:0:50}..."

  # Wait for voice lock if another session is speaking
  # This prevents cross-session audio overlap
  if ! check_voice_lock; then
    tts_log "Another session is speaking, waiting..."
    if ! wait_for_voice_lock 15; then
      tts_log "Timeout waiting for other session, skipping TTS"
      return 1
    fi
  fi

  # Acquire the lock for this session
  acquire_voice_lock

  # Cancel any existing TTS from THIS session only
  cancel_existing_tts

  # Speak and track PID
  local speak_cmd="${INSTALL_DIR}/bin/speak"
  if [[ -f "$speak_cmd" ]]; then
    (echo "$text" | node "$speak_cmd"; release_voice_lock) &
  else
    # Fallback to say command
    local voice=$(jq -r '.voice // "Samantha"' "${INSTALL_DIR}/config.json" 2>/dev/null || echo "Samantha")
    local rate=$(jq -r '.rate // 175' "${INSTALL_DIR}/config.json" 2>/dev/null || echo "175")
    (say -v "$voice" -r "$rate" "$text"; release_voice_lock) &
  fi
  local tts_pid=$!
  echo "$tts_pid" > "$TTS_PID_FILE"

  tts_log "TTS started with PID: $tts_pid"

  # Don't wait for completion - let it run in background
}

# Cleanup function (for trap)
cleanup_tts_manager() {
  rm -f "$TTS_PID_FILE" 2>/dev/null || true
  release_voice_lock
}

# Export functions and variables
export -f cancel_existing_tts 2>/dev/null || true
export -f cancel_all_tts 2>/dev/null || true
export -f speak_exclusive 2>/dev/null || true
export -f check_voice_lock 2>/dev/null || true
export -f wait_for_voice_lock 2>/dev/null || true
export -f acquire_voice_lock 2>/dev/null || true
export -f release_voice_lock 2>/dev/null || true
export -f tts_log 2>/dev/null || true
export -f cleanup_tts_manager 2>/dev/null || true
export TTS_SESSION_ID 2>/dev/null || true
export TTS_SESSION_ID_SAFE 2>/dev/null || true
export TTS_PID_FILE 2>/dev/null || true
export VOICE_LOCK_FILE 2>/dev/null || true
