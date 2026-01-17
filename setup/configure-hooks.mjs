#!/usr/bin/env node
/**
 * Configure Claude Code hooks for auto-speak
 * Automatically adds the stop hook to ~/.claude/settings.local.json
 *
 * Usage: node configure-hooks.mjs [--remove]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";

const CLAUDE_DIR = join(homedir(), ".claude");
const SETTINGS_FILE = join(CLAUDE_DIR, "settings.local.json");
const INSTALL_DIR = join(homedir(), ".claude-auto-speak");
const HOOK_SCRIPT = join(INSTALL_DIR, "hooks", "stop-hook.sh");

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
 * Check if auto-speak hook is already configured
 */
function isHookConfigured(settings) {
  const stopHooks = settings?.hooks?.Stop;
  if (!Array.isArray(stopHooks)) {
    return false;
  }

  return stopHooks.some((hookGroup) => {
    if (!hookGroup?.hooks) return false;
    return hookGroup.hooks.some(
      (hook) =>
        hook.type === "command" &&
        hook.command?.includes("claude-auto-speak")
    );
  });
}

/**
 * Add auto-speak hook to settings
 */
function addHook(settings) {
  // Initialize hooks structure if needed
  if (!settings.hooks) {
    settings.hooks = {};
  }

  if (!settings.hooks.Stop) {
    settings.hooks.Stop = [];
  }

  // Add our hook
  const hookEntry = {
    hooks: [
      {
        type: "command",
        command: HOOK_SCRIPT,
      },
    ],
  };

  settings.hooks.Stop.push(hookEntry);
  return settings;
}

/**
 * Remove auto-speak hook from settings
 */
function removeHook(settings) {
  if (!settings?.hooks?.Stop) {
    return settings;
  }

  settings.hooks.Stop = settings.hooks.Stop.filter((hookGroup) => {
    if (!hookGroup?.hooks) return true;
    return !hookGroup.hooks.some(
      (hook) =>
        hook.type === "command" &&
        hook.command?.includes("claude-auto-speak")
    );
  });

  // Clean up empty arrays
  if (settings.hooks.Stop.length === 0) {
    delete settings.hooks.Stop;
  }

  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  return settings;
}

/**
 * Install hooks
 */
function install() {
  console.log(colors.cyan("\nConfiguring Claude Code hooks for auto-speak...\n"));

  // Check if hook script exists
  if (!existsSync(HOOK_SCRIPT)) {
    console.error(colors.red(`Error: Hook script not found: ${HOOK_SCRIPT}`));
    console.error(colors.dim("Run the installer first: install.sh"));
    process.exit(1);
  }

  // Load current settings
  const settings = loadSettings();

  // Check if already configured
  if (isHookConfigured(settings)) {
    console.log(colors.green("✓ Auto-speak hook is already configured"));
    return;
  }

  // Add hook
  const updated = addHook(settings);
  saveSettings(updated);

  console.log(colors.green("✓ Auto-speak hook added to Claude Code settings"));
  console.log(colors.dim(`  Settings file: ${SETTINGS_FILE}`));
  console.log("");
  console.log(colors.cyan("Auto-speak is now integrated with Claude Code!"));
  console.log(colors.dim("  Enable with: auto-speak on"));
  console.log(colors.dim("  Test with: auto-speak test"));
}

/**
 * Uninstall hooks
 */
function uninstall() {
  console.log(colors.cyan("\nRemoving auto-speak hook from Claude Code...\n"));

  const settings = loadSettings();

  if (!isHookConfigured(settings)) {
    console.log(colors.dim("Auto-speak hook was not configured"));
    return;
  }

  const updated = removeHook(settings);
  saveSettings(updated);

  console.log(colors.green("✓ Auto-speak hook removed from Claude Code settings"));
}

// Main
const args = process.argv.slice(2);

if (args.includes("--remove") || args.includes("--uninstall")) {
  uninstall();
} else {
  install();
}
