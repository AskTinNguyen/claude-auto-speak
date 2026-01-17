#!/usr/bin/env node
/**
 * Configure Claude Code hooks for auto-speak
 * Automatically adds both hooks to ~/.claude/settings.local.json:
 *   - UserPromptSubmit: Speaks Claude's first response as acknowledgment
 *   - Stop: Speaks final summary when Claude finishes
 *
 * Usage: node configure-hooks.mjs [--remove]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const CLAUDE_DIR = join(homedir(), ".claude");
const SETTINGS_FILE = join(CLAUDE_DIR, "settings.local.json");
const INSTALL_DIR = join(homedir(), ".claude-auto-speak");

// Hook scripts
const STOP_HOOK = join(INSTALL_DIR, "hooks", "stop-hook.sh");
const PROMPT_ACK_HOOK = join(INSTALL_DIR, "hooks", "prompt-ack-hook.sh");

// Colors
const colors = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

/**
 * Load existing settings or create empty object
 */
function loadSettings() {
  if (!existsSync(SETTINGS_FILE)) {
    return {};
  }

  try {
    const data = readFileSync(SETTINGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(colors.yellow(`Warning: Could not parse ${SETTINGS_FILE}`));
    return {};
  }
}

/**
 * Save settings with backup
 */
function saveSettings(settings) {
  // Ensure directory exists
  if (!existsSync(CLAUDE_DIR)) {
    mkdirSync(CLAUDE_DIR, { recursive: true });
  }

  // Create backup if file exists
  if (existsSync(SETTINGS_FILE)) {
    const backupFile = `${SETTINGS_FILE}.backup-${Date.now()}`;
    copyFileSync(SETTINGS_FILE, backupFile);
    console.log(colors.dim(`  Backup created: ${backupFile}`));
  }

  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

/**
 * Check if a specific hook type has our auto-speak hook configured
 */
function isHookConfiguredForType(settings, hookType) {
  const hooks = settings?.hooks?.[hookType];
  if (!Array.isArray(hooks)) {
    return false;
  }

  return hooks.some((hookGroup) => {
    if (!hookGroup?.hooks) return false;
    return hookGroup.hooks.some(
      (hook) =>
        hook.type === "command" &&
        hook.command?.includes("claude-auto-speak")
    );
  });
}

/**
 * Add a hook to settings for a specific hook type
 */
function addHookForType(settings, hookType, hookScript) {
  // Initialize hooks structure if needed
  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (!settings.hooks[hookType]) {
    settings.hooks[hookType] = [];
  }

  // Check if already configured
  if (isHookConfiguredForType(settings, hookType)) {
    return false; // Already configured
  }

  // Add our hook
  const hookEntry = {
    hooks: [
      {
        type: "command",
        command: hookScript,
      },
    ],
  };

  settings.hooks[hookType].push(hookEntry);
  return true; // Added
}

/**
 * Remove auto-speak hooks from a specific hook type
 */
function removeHookForType(settings, hookType) {
  if (!settings?.hooks?.[hookType]) {
    return settings;
  }

  settings.hooks[hookType] = settings.hooks[hookType].filter((hookGroup) => {
    if (!hookGroup?.hooks) return true;
    return !hookGroup.hooks.some(
      (hook) =>
        hook.type === "command" &&
        hook.command?.includes("claude-auto-speak")
    );
  });

  // Clean up empty arrays
  if (settings.hooks[hookType].length === 0) {
    delete settings.hooks[hookType];
  }

  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  return settings;
}

/**
 * Install all hooks
 */
function install() {
  console.log(colors.cyan("\nConfiguring Claude Code hooks for auto-speak...\n"));

  // Check if hook scripts exist
  const missingScripts = [];
  if (!existsSync(STOP_HOOK)) {
    missingScripts.push(STOP_HOOK);
  }
  if (!existsSync(PROMPT_ACK_HOOK)) {
    missingScripts.push(PROMPT_ACK_HOOK);
  }

  if (missingScripts.length > 0) {
    console.error(colors.red("Error: Hook scripts not found:"));
    missingScripts.forEach((s) => console.error(colors.dim(`  ${s}`)));
    console.error(colors.dim("\nRun the installer first: install.sh"));
    process.exit(1);
  }

  // Load current settings
  let settings = loadSettings();
  let addedHooks = [];

  // Add Stop hook (final summary)
  if (addHookForType(settings, "Stop", STOP_HOOK)) {
    addedHooks.push("Stop");
  }

  // Add UserPromptSubmit hook (immediate acknowledgment)
  if (addHookForType(settings, "UserPromptSubmit", PROMPT_ACK_HOOK)) {
    addedHooks.push("UserPromptSubmit");
  }

  if (addedHooks.length === 0) {
    console.log(colors.green("✓ All auto-speak hooks are already configured"));
    return;
  }

  // Save settings
  saveSettings(settings);

  console.log(colors.green(`✓ Added hooks: ${addedHooks.join(", ")}`));
  console.log(colors.dim(`  Settings file: ${SETTINGS_FILE}`));
  console.log("");
  console.log(colors.cyan("Auto-speak hooks configured:"));
  console.log(colors.dim("  • UserPromptSubmit: Speaks Claude's first response"));
  console.log(colors.dim("  • Stop: Speaks final summary when Claude finishes"));
  console.log("");
  console.log(colors.dim("Enable with: auto-speak on"));
  console.log(colors.dim("Test with: auto-speak test"));
}

/**
 * Uninstall all hooks
 */
function uninstall() {
  console.log(colors.cyan("\nRemoving auto-speak hooks from Claude Code...\n"));

  let settings = loadSettings();
  let removedHooks = [];

  // Check what's configured
  const hadStop = isHookConfiguredForType(settings, "Stop");
  const hadPrompt = isHookConfiguredForType(settings, "UserPromptSubmit");

  if (!hadStop && !hadPrompt) {
    console.log(colors.dim("No auto-speak hooks were configured"));
    return;
  }

  // Remove hooks
  settings = removeHookForType(settings, "Stop");
  settings = removeHookForType(settings, "UserPromptSubmit");

  if (hadStop) removedHooks.push("Stop");
  if (hadPrompt) removedHooks.push("UserPromptSubmit");

  saveSettings(settings);

  console.log(colors.green(`✓ Removed hooks: ${removedHooks.join(", ")}`));
}

// Main
const args = process.argv.slice(2);

if (args.includes("--remove") || args.includes("--uninstall")) {
  uninstall();
} else {
  install();
}
