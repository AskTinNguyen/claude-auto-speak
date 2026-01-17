/**
 * Output Filter for TTS
 * Simplified standalone version for Claude Auto-Speak
 *
 * Filters Claude Code output to remove verbose content unsuitable for text-to-speech.
 */

/**
 * Default filter configuration
 */
export const DEFAULT_FILTER_CONFIG = {
  maxLength: 500,
  maxCodeLines: 0, // Remove all code blocks for TTS
  includeFilePaths: false,
  includeStats: false,
};

/**
 * Output Filter class
 */
export class OutputFilter {
  constructor(config = {}) {
    this.config = { ...DEFAULT_FILTER_CONFIG, ...config };
  }

  /**
   * Filter output for TTS - main entry point
   */
  filter(output) {
    if (!output || output.trim().length === 0) {
      return "";
    }

    let filtered = output;

    // Remove thinking blocks
    filtered = this.removeThinkingBlocks(filtered);

    // Remove tool call markers
    filtered = this.removeToolCalls(filtered);

    // Remove long file content dumps
    filtered = this.removeFileContentDumps(filtered);

    // Remove verbose logs
    filtered = this.removeVerboseLogs(filtered);

    // Remove long IDs and hashes
    filtered = this.removeLongIdentifiers(filtered);

    // Remove code blocks (but keep short ones)
    filtered = this.filterCodeBlocks(filtered);

    // Strip markdown formatting for TTS
    filtered = this.stripMarkdownForTTS(filtered);

    // Remove excessive whitespace
    filtered = this.normalizeWhitespace(filtered);

    // Truncate if too long
    filtered = this.truncate(filtered);

    return filtered.trim();
  }

  /**
   * Strip markdown formatting for TTS-friendly output
   */
  stripMarkdownForTTS(text) {
    let result = text;

    // Remove code blocks entirely (```...```)
    result = result.replace(/```[\s\S]*?```/g, "");

    // Remove inline code backticks but keep the text
    result = result.replace(/`([^`]+)`/g, "$1");

    // Remove markdown headers (# ## ### etc) but keep the text
    result = result.replace(/^#{1,6}\s+/gm, "");

    // Remove bold/italic markers but keep text
    result = result.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
    result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
    result = result.replace(/\*([^*]+)\*/g, "$1");
    result = result.replace(/___([^_]+)___/g, "$1");
    result = result.replace(/__([^_]+)__/g, "$1");
    result = result.replace(/_([^_]+)_/g, "$1");

    // Remove strikethrough
    result = result.replace(/~~([^~]+)~~/g, "$1");

    // Remove markdown links but keep the text: [text](url) -> text
    result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // Remove image syntax
    result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

    // Remove HTML tags
    result = result.replace(/<[^>]+>/g, "");

    // Remove horizontal rules
    result = result.replace(/^[\-*_]{3,}\s*$/gm, "");

    // Remove table formatting
    result = result.replace(/^\|[\s\-:|]+\|\s*$/gm, "");
    result = result.replace(/^\|\s*/gm, "");
    result = result.replace(/\s*\|$/gm, "");
    result = result.replace(/\s*\|\s*/g, ", ");

    // Convert bullet points to natural language
    result = result.replace(/^[\s]*[-*+]\s+/gm, "");
    result = result.replace(/^[\s]*\d+\.\s+/gm, "");

    // Remove blockquote markers
    result = result.replace(/^>\s*/gm, "");

    // Remove box drawing characters
    result = result.replace(/[│├┤┌┐└┘┬┴┼═║╔╗╚╝╠╣╦╩╬]/g, "");

    // Remove multiple consecutive special chars
    result = result.replace(/[*#_~`]{2,}/g, "");

    // Clean up multiple spaces and newlines
    result = result.replace(/[ \t]+/g, " ");
    result = result.replace(/\n{3,}/g, "\n\n");

    return result;
  }

  /**
   * Remove <thinking>...</thinking> blocks
   */
  removeThinkingBlocks(text) {
    let result = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "");
    result = result.replace(/<thinking>.*$/gim, "");
    result = result.replace(/^.*<\/thinking>/gim, "");
    return result;
  }

  /**
   * Remove tool call details
   */
  removeToolCalls(text) {
    let result = text;

    // Remove [Tool: X] markers
    result = result.replace(/\[Tool:\s*\w+\]/gi, "");

    // Remove tool call blocks
    result = result.replace(/```tool[\s\S]*?```/gi, "");

    // Remove specific tool patterns
    const toolPatterns = [
      /\[Reading\s+.*?\]/gi,
      /\[Writing\s+.*?\]/gi,
      /\[Editing\s+.*?\]/gi,
      /\[Searching\s+.*?\]/gi,
      /\[Running\s+.*?\]/gi,
      /Tool result:.*$/gim,
      /⏺\s*Read\s+.*$/gim,
      /⏺\s*Write\s+.*$/gim,
      /⏺\s*Edit\s+.*$/gim,
      /⏺\s*Bash\s+.*$/gim,
    ];

    for (const pattern of toolPatterns) {
      result = result.replace(pattern, "");
    }

    return result;
  }

  /**
   * Remove file content dumps (more than N lines)
   */
  removeFileContentDumps(text) {
    const maxLines = 20;
    const lines = text.split("\n");
    const result = [];
    let inCodeBlock = false;
    let codeBlockLines = 0;

    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          if (codeBlockLines > maxLines) {
            result.push("[Code block omitted]");
          }
          inCodeBlock = false;
          codeBlockLines = 0;
        } else {
          inCodeBlock = true;
          codeBlockLines = 0;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockLines++;
        if (codeBlockLines <= maxLines) {
          result.push(line);
        }
      } else {
        result.push(line);
      }
    }

    return result.join("\n");
  }

  /**
   * Remove verbose logs
   */
  removeVerboseLogs(text) {
    let result = text;

    // npm verbose output
    result = result.replace(/npm WARN.*$/gim, "");
    result = result.replace(/npm notice.*$/gim, "");
    result = result.replace(/added \d+ packages.*$/gim, (match) => {
      const numMatch = match.match(/added (\d+) packages/);
      return numMatch ? `Added ${numMatch[1]} packages.` : "";
    });

    // Git verbose output
    result = result.replace(/^\s*\d+\s+files? changed.*$/gim, "");
    result = result.replace(/^\s*\d+ insertions?\(\+\).*$/gim, "");
    result = result.replace(/^\s*\d+ deletions?\(-\).*$/gim, "");

    // Progress indicators
    result = result.replace(/\[={2,}.*?\]/g, "");
    result = result.replace(/\d+%\s*\|[█▓▒░ ]*\|/g, "");
    result = result.replace(/⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/g, "");

    // Remove repeated blank lines
    result = result.replace(/\n{3,}/g, "\n\n");

    return result;
  }

  /**
   * Remove long identifiers
   */
  removeLongIdentifiers(text) {
    let result = text;

    // Git commit hashes (40 chars)
    result = result.replace(/\b[0-9a-f]{40}\b/gi, "[commit]");

    // Short git hashes (7-8 chars)
    result = result.replace(/\b[0-9a-f]{7,8}\b(?=\s|$)/gi, "[commit]");

    // UUIDs
    result = result.replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      "[id]"
    );

    // Long base64 strings
    result = result.replace(/[A-Za-z0-9+/]{50,}={0,2}/g, "[encoded data]");

    return result;
  }

  /**
   * Filter code blocks
   */
  filterCodeBlocks(text) {
    const maxLines = this.config.maxCodeLines;
    return text.replace(/```[\s\S]*?```/g, (block) => {
      const lines = block.split("\n").filter((l) => l.trim());
      if (lines.length <= maxLines + 2) {
        return block;
      }
      return `[Code block with ${lines.length - 2} lines]`;
    });
  }

  /**
   * Normalize whitespace
   */
  normalizeWhitespace(text) {
    let result = text
      .split("\n")
      .map((line) => line.trim())
      .join("\n");

    result = result.replace(/\n{3,}/g, "\n\n");
    result = result.replace(/\x1b\[[0-9;]*m/g, "");

    return result;
  }

  /**
   * Truncate to max length
   */
  truncate(text) {
    if (text.length <= this.config.maxLength) {
      return text;
    }

    const truncated = text.substring(0, this.config.maxLength);
    const lastSentence = truncated.lastIndexOf(". ");

    if (lastSentence > this.config.maxLength * 0.5) {
      return truncated.substring(0, lastSentence + 1);
    }

    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > this.config.maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + "...";
    }

    return truncated + "...";
  }
}

/**
 * Create an OutputFilter instance
 */
export function createOutputFilter(config = {}) {
  return new OutputFilter(config);
}

export default OutputFilter;
