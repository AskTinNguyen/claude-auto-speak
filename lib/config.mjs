/**
 * Configuration management for Claude Auto-Speak
 * Handles reading/writing config from ~/.claude-auto-speak/config.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// Installation directory
export const INSTALL_DIR = join(homedir(), ".claude-auto-speak");
export const CONFIG_FILE = join(INSTALL_DIR, "config.json");
export const LOG_FILE = join(INSTALL_DIR, "auto-speak.log");
export const HISTORY_FILE = join(INSTALL_DIR, "speech-history.jsonl");

/**
 * Default configuration
 */
export const DEFAULT_CONFIG = {
  enabled: false,
  // TTS Engine: "macos" (default), "piper", or "espeak-ng"
  ttsEngine: "macos",
  // macOS say settings
  voice: "Samantha", // macOS voice
  rate: 175, // Words per minute
  // Piper settings (optional)
  piperPath: null, // Path to piper binary
  piperVoice: null, // Path to voice .onnx file
  // eSpeak-NG settings (optional)
  espeakPath: "/opt/homebrew/bin/espeak-ng", // Path to espeak-ng binary
  espeakVoice: null, // Voice variant (e.g., "vi", "vi-vn-x-south")
  // VieNeu-TTS settings (Vietnamese voice cloning)
  vieneuPath: null, // Path to vieneu virtual environment (auto-detected)
  vieneuVoice: null, // Name of cloned voice (e.g., "my_voice")
  vieneuModel: "vieneu-0.3b", // Model variant: "vieneu-0.3b" (faster) or "vieneu-0.5b" (higher quality)
  // LLM Summarization
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "qwen2.5:1.5b",
  useLLM: true, // Use Qwen for smart summarization
  fallbackToRegex: true, // Fall back to regex if LLM unavailable
  // Acknowledgment settings (speaks first response)
  acknowledgment: {
    enabled: true, // Speak Claude's first response as acknowledgment
  },
  // Progress timer settings (speaks during long tasks)
  progress: {
    enabled: true, // Speak periodic progress updates
    intervalSeconds: 15, // Seconds between progress phrases
  },
  // Skip voice on session start (avoids spam on new sessions)
  skipSessionStart: {
    enabled: true, // Skip voice output on first prompt of new session
    minUserMessages: 1, // Threshold: skip if user message count <= this
  },
  // Multilingual support
  multilingual: {
    enabled: false, // Enable multilingual features
    mode: "native", // 'native' | 'translate' | 'auto'
    targetLanguage: null, // null | 'vi' | 'zh'
    autoDetect: true, // Auto-detect language
    voiceByLanguage: {
      // Language-specific voices (Piper)
      en: "en_US-lessac-medium",
      vi: "vi_VN-vais1000-medium",
      zh: "zh_CN-huayan-medium",
    },
  },
  // Translation settings
  translation: {
    model: "gemma2:9b", // Ollama model for translation
    timeout: 10000, // 10s timeout
    fallbackToOriginal: true, // Use English if translation fails
  },
  // Speech history tracking
  history: {
    enabled: true, // Track spoken text
    maxEntries: 10000, // Auto-rotate after 10k entries
    autoCleanupDays: 90, // Delete entries older than 90 days
  },
};

/**
 * Ensure config directory exists
 */
export function ensureConfigDir() {
  if (!existsSync(INSTALL_DIR)) {
    mkdirSync(INSTALL_DIR, { recursive: true });
  }
}

/**
 * Load configuration
 */
export function loadConfig() {
  ensureConfigDir();

  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const data = readFileSync(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (err) {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save configuration
 */
export function saveConfig(config) {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Get a config value
 */
export function getConfigValue(key) {
  const config = loadConfig();
  return config[key];
}

/**
 * Set a config value
 */
export function setConfigValue(key, value) {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

/**
 * Check if auto-speak is enabled
 */
export function isEnabled() {
  return loadConfig().enabled === true;
}

/**
 * Enable auto-speak
 */
export function enable() {
  setConfigValue("enabled", true);
}

/**
 * Disable auto-speak
 */
export function disable() {
  setConfigValue("enabled", false);
}

/**
 * Log a message to the log file
 */
export function log(message) {
  ensureConfigDir();
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;

  try {
    const fd = require("fs").openSync(LOG_FILE, "a");
    require("fs").writeSync(fd, logLine);
    require("fs").closeSync(fd);
  } catch (err) {
    // Silently fail logging
  }
}

export default {
  INSTALL_DIR,
  CONFIG_FILE,
  LOG_FILE,
  HISTORY_FILE,
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  isEnabled,
  enable,
  disable,
  log,
};
