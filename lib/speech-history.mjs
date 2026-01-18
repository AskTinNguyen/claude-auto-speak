#!/usr/bin/env node
/**
 * Speech History Module
 * Tracks all spoken text in JSONL format with minimal metadata
 */

import { readFileSync, appendFileSync, unlinkSync, existsSync } from "fs";
import { HISTORY_FILE, ensureConfigDir, loadConfig } from "./config.mjs";

/**
 * Log spoken text to history
 * Non-blocking, silent failure to never interrupt TTS
 *
 * @param {string} text - Spoken text to log
 * @returns {Promise<void>}
 */
export async function logSpeech(text) {
  try {
    const config = loadConfig();

    // Check if history is enabled
    if (!config.history?.enabled) {
      return;
    }

    // Ensure config directory exists
    ensureConfigDir();

    // Create history entry
    const entry = {
      timestamp: new Date().toISOString(),
      text: text.trim(),
    };

    // Append to JSONL file (one JSON per line)
    const line = JSON.stringify(entry) + "\n";
    appendFileSync(HISTORY_FILE, line, "utf-8");

    // Check if rotation is needed
    await rotateHistoryIfNeeded(config);
  } catch (error) {
    // Silent failure - never break TTS
    // Could optionally log to auto-speak.log here
  }
}

/**
 * Rotate history file if it exceeds max entries
 *
 * @param {object} config - Configuration object
 * @returns {Promise<void>}
 */
async function rotateHistoryIfNeeded(config) {
  try {
    if (!existsSync(HISTORY_FILE)) {
      return;
    }

    const maxEntries = config.history?.maxEntries || 10000;
    const lines = readFileSync(HISTORY_FILE, "utf-8").trim().split("\n");

    if (lines.length > maxEntries) {
      // Keep only the most recent entries
      const recentLines = lines.slice(-maxEntries);
      const newContent = recentLines.join("\n") + "\n";

      // Write back to file
      unlinkSync(HISTORY_FILE);
      appendFileSync(HISTORY_FILE, newContent, "utf-8");
    }
  } catch (error) {
    // Silent failure
  }
}

/**
 * Query history with filters
 *
 * @param {object} options - Query options
 * @param {Date} options.since - Only return entries after this date
 * @param {number} options.limit - Maximum number of entries to return
 * @param {number} options.offset - Number of entries to skip
 * @returns {Promise<Array>} Array of history entries
 */
export async function queryHistory(options = {}) {
  const { since, limit, offset = 0 } = options;

  try {
    if (!existsSync(HISTORY_FILE)) {
      return [];
    }

    const content = readFileSync(HISTORY_FILE, "utf-8").trim();
    if (!content) {
      return [];
    }

    const lines = content.split("\n");
    const entries = [];

    // Parse each line
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        // Apply date filter
        if (since) {
          const entryDate = new Date(entry.timestamp);
          if (entryDate < since) {
            continue;
          }
        }

        entries.push(entry);
      } catch (e) {
        // Skip malformed lines
      }
    }

    // Reverse to show most recent first
    entries.reverse();

    // Apply offset and limit
    let result = entries;
    if (offset > 0) {
      result = result.slice(offset);
    }
    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  } catch (error) {
    console.error(`Error querying history: ${error.message}`);
    return [];
  }
}

/**
 * Clear all history
 *
 * @returns {Promise<boolean>} Success status
 */
export async function clearHistory() {
  try {
    if (existsSync(HISTORY_FILE)) {
      unlinkSync(HISTORY_FILE);
    }
    return true;
  } catch (error) {
    console.error(`Error clearing history: ${error.message}`);
    return false;
  }
}

/**
 * Get history file path
 *
 * @returns {string} Path to history file
 */
export function getHistoryPath() {
  return HISTORY_FILE;
}

/**
 * Get history statistics
 *
 * @returns {Promise<object>} Statistics object
 */
export async function getHistoryStats() {
  try {
    if (!existsSync(HISTORY_FILE)) {
      return {
        totalEntries: 0,
        oldestEntry: null,
        newestEntry: null,
        fileSize: 0,
      };
    }

    const content = readFileSync(HISTORY_FILE, "utf-8").trim();
    const lines = content.split("\n").filter((l) => l.trim());
    const entries = [];

    for (const line of lines) {
      try {
        entries.push(JSON.parse(line));
      } catch (e) {
        // Skip malformed lines
      }
    }

    const fileSize = Buffer.byteLength(content, "utf-8");

    return {
      totalEntries: entries.length,
      oldestEntry: entries.length > 0 ? entries[0].timestamp : null,
      newestEntry:
        entries.length > 0 ? entries[entries.length - 1].timestamp : null,
      fileSize,
    };
  } catch (error) {
    console.error(`Error getting history stats: ${error.message}`);
    return {
      totalEntries: 0,
      oldestEntry: null,
      newestEntry: null,
      fileSize: 0,
    };
  }
}

/**
 * Export history to text format
 *
 * @returns {Promise<string>} History as formatted text
 */
export async function exportHistoryAsText() {
  try {
    const entries = await queryHistory({});

    if (entries.length === 0) {
      return "No history entries found.";
    }

    let output = "Speech History\n";
    output += "=".repeat(80) + "\n\n";

    for (const entry of entries) {
      const date = new Date(entry.timestamp);
      const formattedDate = date.toLocaleString();
      output += `[${formattedDate}]\n`;
      output += `${entry.text}\n\n`;
    }

    return output;
  } catch (error) {
    console.error(`Error exporting history: ${error.message}`);
    return "";
  }
}

export default {
  logSpeech,
  queryHistory,
  clearHistory,
  getHistoryPath,
  getHistoryStats,
  exportHistoryAsText,
};
