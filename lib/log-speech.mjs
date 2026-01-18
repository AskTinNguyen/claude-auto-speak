#!/usr/bin/env node
/**
 * Helper script for bash scripts to log speech from stdin
 * Usage: echo "text" | node log-speech.mjs
 */

import { logSpeech } from "./speech-history.mjs";

// Read from stdin
async function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8").trim());
    });
  });
}

async function main() {
  const text = await readStdin();

  if (text && text.length > 0) {
    await logSpeech(text);
  }

  process.exit(0);
}

main().catch(() => {
  // Silent failure
  process.exit(0);
});
