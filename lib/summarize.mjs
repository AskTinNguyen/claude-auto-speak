#!/usr/bin/env node
/**
 * Summarize Claude Code response for TTS
 * Uses local Qwen model with context-aware summarization
 * Falls back to regex-based cleanup if Ollama unavailable
 *
 * Usage: node summarize.mjs <transcript_path>
 */

import { readFileSync } from "fs";
import { createOutputFilter } from "./output-filter.mjs";
import { loadConfig, log } from "./config.mjs";
import { translateText } from "./translator.mjs";

async function main() {
  const transcriptPath = process.argv[2];

  if (!transcriptPath) {
    console.error("Usage: node summarize.mjs <transcript_path>");
    process.exit(1);
  }

  try {
    // Read transcript - it's JSONL format (one JSON per line)
    const transcriptData = readFileSync(transcriptPath, "utf-8");
    const lines = transcriptData.trim().split("\n");

    // Parse each line and collect messages in order
    const messages = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (
          (entry.type === "assistant" || entry.type === "user") &&
          entry.message
        ) {
          messages.push(entry);
        }
      } catch (e) {
        // Skip malformed lines
      }
    }

    // Find the last assistant message that has text content
    let lastAssistantIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === "assistant") {
        const content = messages[i].message?.content;
        if (Array.isArray(content)) {
          const hasText = content.some((block) => block.type === "text");
          if (hasText) {
            lastAssistantIdx = i;
            break;
          }
        } else if (typeof content === "string" && content.trim()) {
          lastAssistantIdx = i;
          break;
        }
      }
    }

    if (lastAssistantIdx === -1) {
      process.exit(0); // No assistant message, silent exit
    }

    // Find the user message that preceded this assistant message
    let userQuestion = "";
    for (let i = lastAssistantIdx - 1; i >= 0; i--) {
      if (messages[i].type === "user") {
        const userContent = messages[i].message?.content;
        let text = "";
        if (typeof userContent === "string") {
          text = userContent;
        } else if (Array.isArray(userContent)) {
          const textBlocks = userContent.filter((b) => b.type === "text");
          text = textBlocks.map((b) => b.text).join("\n");
        }
        // Skip system/meta messages
        if (text && !text.startsWith("<") && text.trim().length > 0) {
          userQuestion = text;
          break;
        }
      }
    }

    // Get the last assistant message content
    const lastEntry = messages[lastAssistantIdx];
    const content = lastEntry.message.content;

    // Extract text content from assistant response
    let responseText = "";
    if (typeof content === "string") {
      responseText = content;
    } else if (Array.isArray(content)) {
      const textBlocks = content.filter((block) => block.type === "text");
      responseText = textBlocks.map((block) => block.text).join("\n");
    }

    if (!responseText || responseText.trim().length === 0) {
      process.exit(0); // No text content
    }

    // Step 1: Apply output filter to remove verbose content
    const filter = createOutputFilter({
      maxLength: 1000, // Allow longer for summarization
      maxCodeLines: 0, // Remove all code blocks
      includeFilePaths: false,
      includeStats: false,
    });

    const filtered = filter.filter(responseText);

    if (!filtered || filtered.trim().length === 0) {
      process.exit(0); // Nothing speakable after filtering
    }

    // Step 2: Context-aware summarization
    const config = loadConfig();
    let summary;

    if (config.useLLM) {
      summary = await contextAwareSummarize(filtered, userQuestion, config);
    } else {
      summary = fallbackSummarize(filtered);
    }

    // Step 3: Translate if multilingual mode is enabled
    if (
      summary &&
      config.multilingual?.enabled &&
      config.multilingual?.mode === "translate" &&
      config.multilingual?.targetLanguage
    ) {
      try {
        summary = await translateText(summary, {
          targetLang: config.multilingual.targetLanguage,
          ollamaUrl: config.ollamaUrl,
          ollamaModel: config.translation?.model || "gemma2:9b",
          timeout: config.translation?.timeout || 10000,
          fallbackToOriginal: config.translation?.fallbackToOriginal !== false,
        });
      } catch (error) {
        log(`Translation failed: ${error.message}`);
        // Continue with original summary
      }
    }

    if (summary && summary.trim().length > 0) {
      // Clean up the summary - remove quotes if present
      let cleaned = summary.trim();

      if (
        (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'"))
      ) {
        cleaned = cleaned.slice(1, -1);
      }

      console.log(cleaned.trim());
    }

    process.exit(0);
  } catch (error) {
    log(`Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Context-aware summarization using Qwen
 */
async function contextAwareSummarize(response, userQuestion, config) {
  const ollamaUrl = config.ollamaUrl || "http://localhost:11434";
  const model = config.ollamaModel || "qwen2.5:1.5b";
  const timeout = 10000;

  // Build context-aware prompt
  let prompt;
  if (userQuestion && userQuestion.trim().length > 0) {
    prompt = `You are a voice assistant. The user asked: "${userQuestion.trim().substring(0, 200)}"

The assistant's response:
${response.substring(0, 3000)}

Your task: Create a clear spoken summary answering what the user asked.

FORMAT (brief, under 20 words):
- Use natural conversational speech
- For lists: "First, [action]. Second, [action]. Third, [action]."
- State ONLY the main point once - do not repeat or rephrase

STRICT RULES - NEVER include:
- File names or paths (voice-config.json, .agents/ralph, src/components)
- File extensions (.sh, .js, .py, .md, .json, .tsx)
- Technical references ("the file", "the script", "the function", "the config")
- Symbols: ~ / \\ | @ # $ % ^ & * \` < > { } [ ] = + _
- Numbers with units unless essential (150ms, 10s, 200MB)
- Abbreviations (TTS, API, CLI) - say full words
- Code syntax or technical jargon

WHAT TO SAY:
- Actions completed: "Added feature X", "Fixed the login bug"
- Key outcomes: "Users can now...", "The system will..."
- Next steps: "You should...", "Consider..."
- Answer directly - what did we accomplish?

BAD: "Updated the voice config dot json file in dot agents slash ralph"
GOOD: "Changed the voice settings to use a quieter tone"

BAD: "One, modified the file. Two, tested the file. Three, the file works now."
GOOD: "First, adjusted the settings. Second, verified it works. Done."

Spoken summary (natural speech only, no repetition):`;
  } else {
    // Fallback to standard summarization without context
    prompt = `You are a voice assistant converting this response to natural speech:

${response.substring(0, 3000)}

Create a spoken summary (brief, under 20 words).

STRICT RULES - NEVER include:
- File names, paths, or extensions
- Symbols: ~ / \\ | @ # $ % ^ & * \` < > { } [ ] = + _
- Technical references or abbreviations
- Repetitive phrases

FORMAT:
- Natural conversational speech
- For lists: "First, [item]. Second, [item]. Third, [item]."
- State each point once only

Spoken summary (no repetition):`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          num_predict: 150,
          temperature: 0.2,        // Lower = more focused, less repetition
          top_p: 0.85,             // Slightly more deterministic
          top_k: 40,               // Limit vocabulary diversity
          repeat_penalty: 1.3,     // Strongly penalize repetition
          frequency_penalty: 0.5,  // Reduce word reuse
          presence_penalty: 0.3,   // Encourage variety in concepts
          stop: ["\n\n", "Summary:", "Note:", "Important:"], // Stop at meta-text
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}`);
    }

    const data = await res.json();
    return cleanSummary(data.response || "");
  } catch (error) {
    log(`LLM failed, using fallback: ${error.message}`);
    if (config.fallbackToRegex) {
      return fallbackSummarize(response);
    }
    return null;
  }
}

/**
 * Clean up the generated summary
 * Enhanced to catch symbols, technical terms, and repetitive patterns
 */
function cleanSummary(text) {
  let result = text.trim();

  // Remove code blocks
  result = result.replace(/```[\s\S]*?```/g, "");
  result = result.replace(/`([^`]+)`/g, "$1");

  // Remove markdown formatting
  result = result.replace(/^#{1,6}\s+/gm, "");
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
  result = result.replace(/\*([^*]+)\*/g, "$1");
  result = result.replace(/__([^_]+)__/g, "$1");
  result = result.replace(/_([^_]+)_/g, "$1");

  // Remove bullet points
  result = result.replace(/^[\s]*[-*+]\s+/gm, "");
  result = result.replace(/^[\s]*\d+\.\s+/gm, "");

  // Remove file paths and extensions (aggressive)
  // Matches: path/to/file.ext, .agents/ralph/script.sh, etc.
  result = result.replace(/[\w\-./]+\.(sh|js|mjs|ts|tsx|jsx|json|md|txt|py|yaml|yml|css|html|xml|sql|rb|go|rs|java|c|cpp|h)/gi, "");

  // Remove path-like patterns (e.g., .agents/ralph/lib/, src/components/)
  result = result.replace(/\.[\w\-/]+\//g, "");
  result = result.replace(/[\w\-]+\/[\w\-]+\//g, ""); // foo/bar/ patterns

  // Remove URLs
  result = result.replace(/https?:\/\/[^\s]+/g, "");

  // Remove XML/HTML-like tags
  result = result.replace(/<[^>]+>/g, "");

  // AGGRESSIVE SYMBOL REMOVAL
  // Remove ALL problematic symbols that TTS reads literally
  result = result.replace(/[~\/\\|<>{}[\]@#$%^&*`+=_]/g, "");

  // Replace "dot" when it appears as word (from file extensions being read)
  result = result.replace(/\bdot\b/gi, "");
  result = result.replace(/\bslash\b/gi, "");
  result = result.replace(/\btilda\b/gi, "");
  result = result.replace(/\btilde\b/gi, "");

  // Remove technical abbreviations that slip through
  result = result.replace(/\b(API|CLI|TTS|JSON|HTML|CSS|URL|HTTP|HTTPS|SSH|FTP)\b/g, "");

  // Remove common technical words when followed by generic terms
  result = result.replace(/\bthe (file|script|function|config|directory|folder|repository|repo)\b/gi, "it");
  result = result.replace(/\bin the (file|script|function|config|directory|folder)\b/gi, "");

  // Remove common status emojis that TTS reads literally
  result = result.replace(/[\u2705\u274C\u26A0\u2713\u2714\u2611\u274E\u2B1C\u2B1B\u{1F534}\u{1F7E2}\u{1F7E1}\u2B50\u{1F389}\u{1F44D}\u{1F44E}\u{1F680}\u{1F4A1}\u{1F4DD}\u{1F527}\u{1F41B}]/gu, "");

  // Fallback: remove any remaining emoji characters
  result = result.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "");

  // Fix spacing around punctuation
  result = result.replace(/\s+([,.!?;:])/g, "$1"); // Remove space before punctuation
  result = result.replace(/([,.!?;:])\s*/g, "$1 "); // Ensure space after punctuation

  // Remove extra punctuation (multiple periods, etc.)
  result = result.replace(/\.{2,}/g, ".");
  result = result.replace(/,{2,}/g, ",");

  // Remove repetitive sentence patterns
  // Detect "First, X. Second, X. Third, X." where X is very similar
  result = removeRepetitiveSentences(result);

  // Normalize whitespace
  result = result.replace(/\s+/g, " ");

  return result.trim();
}

/**
 * Remove repetitive sentences that say the same thing differently
 * E.g., "Modified the file. Updated the file. Changed the file." → "Modified the file."
 */
function removeRepetitiveSentences(text) {
  const sentences = text.split(/\.\s+/);

  if (sentences.length <= 2) {
    return text; // Not enough sentences to have repetition
  }

  // If text is already short (< 100 chars), don't risk removing content
  if (text.length < 100) {
    return text;
  }

  const uniqueSentences = [];
  const seenConcepts = new Set();

  for (const sentence of sentences) {
    // Extract key words (nouns/verbs) from sentence
    const words = sentence.toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3); // Only meaningful words

    // Create a concept signature (sorted unique words)
    const conceptSig = [...new Set(words)].sort().join("-");

    // Check if we've seen a very similar sentence
    let isDuplicate = false;
    for (const seenSig of seenConcepts) {
      const overlap = calculateOverlap(conceptSig, seenSig);
      if (overlap > 0.75) { // More than 75% word overlap = duplicate concept (was 0.6 - too aggressive)
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      uniqueSentences.push(sentence);
      seenConcepts.add(conceptSig);
    }
  }

  return uniqueSentences.join(". ");
}

/**
 * Calculate word overlap between two concept signatures
 */
function calculateOverlap(sig1, sig2) {
  const words1 = new Set(sig1.split("-"));
  const words2 = new Set(sig2.split("-"));

  let intersection = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      intersection++;
    }
  }

  const union = words1.size + words2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Fallback summarization when LLM is unavailable
 */
function fallbackSummarize(text) {
  let result = cleanSummary(text);

  // If still too long, truncate at sentence boundary
  if (result.length > 200) {
    const truncated = result.substring(0, 200);
    const lastPeriod = truncated.lastIndexOf(". ");
    if (lastPeriod > 100) {
      return truncated.substring(0, lastPeriod + 1);
    }
    return truncated.substring(0, truncated.lastIndexOf(" ")) + "...";
  }

  return result;
}

main();
