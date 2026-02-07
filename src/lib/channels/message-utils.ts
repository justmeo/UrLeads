/**
 * Message utilities adapted from ClawdBot patterns:
 * - Text chunking from dist/auto-reply/chunk.js (4000 char limit)
 * - Deduplication from dist/telegram/bot-updates.js
 * - Debouncing from dist/auto-reply/inbound-debounce.js
 */

const DEFAULT_CHUNK_LIMIT = 4000;

/**
 * Split long text into chunks that respect message size limits.
 * Tries to break at newlines or spaces for readability.
 */
export function chunkText(text: string, limit: number = DEFAULT_CHUNK_LIMIT): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(remaining);
      break;
    }

    // Try to find a good break point
    let breakIdx = remaining.lastIndexOf("\n", limit);
    if (breakIdx < limit * 0.5) {
      breakIdx = remaining.lastIndexOf(" ", limit);
    }
    if (breakIdx < limit * 0.5) {
      breakIdx = limit;
    }

    chunks.push(remaining.slice(0, breakIdx));
    remaining = remaining.slice(breakIdx).trimStart();
  }

  return chunks;
}

/**
 * Tracks recently seen message keys to prevent duplicate processing.
 * Uses a TTL-based cache that auto-cleans old entries.
 */
export function createMessageDeduplicator(ttlMs: number = 60_000) {
  const seen = new Map<string, number>();

  return {
    isDuplicate(key: string): boolean {
      const now = Date.now();

      // Clean old entries periodically
      if (seen.size > 100) {
        for (const [k, ts] of seen) {
          if (now - ts > ttlMs) seen.delete(k);
        }
      }

      if (seen.has(key)) return true;
      seen.set(key, now);
      return false;
    },

    clear() {
      seen.clear();
    },
  };
}

/**
 * Debounces rapid inbound messages from the same sender,
 * combining them into a single message before processing.
 * This prevents the AI from being called multiple times
 * when a user sends several short messages in quick succession.
 */
export function createInboundDebouncer(delayMs: number = 1500) {
  const timers = new Map<string, NodeJS.Timeout>();
  const buffers = new Map<string, string[]>();

  return {
    debounce(key: string, text: string, flush: (combined: string) => void) {
      const existing = buffers.get(key) || [];
      existing.push(text);
      buffers.set(key, existing);

      // Clear existing timer for this sender
      const timer = timers.get(key);
      if (timer) clearTimeout(timer);

      // Set new timer
      timers.set(
        key,
        setTimeout(() => {
          const messages = buffers.get(key) || [];
          buffers.delete(key);
          timers.delete(key);
          flush(messages.join("\n"));
        }, delayMs)
      );
    },

    destroy() {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
      buffers.clear();
    },
  };
}
