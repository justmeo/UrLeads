/**
 * Telegram bot manager adapted from ClawdBot's Telegram extension.
 *
 * Key patterns from ClawdBot:
 * - grammY Bot with apiThrottler() for rate limiting
 * - sequentialize() middleware for per-chat ordering
 * - Message deduplication via update ID tracking
 * - Debouncing rapid messages before AI processing
 * - Text chunking for replies (4000 char limit)
 * - Typing indicator before sending reply
 */

import { Bot } from "grammy";
import { apiThrottler } from "@grammyjs/transformer-throttler";
import { sequentialize } from "@grammyjs/runner";
import { processAgentMessage } from "@/lib/ai/agent";
import { chunkText, createMessageDeduplicator, createInboundDebouncer } from "./message-utils";
import type { ChannelStatus } from "./types";
import { DISCONNECTED_STATUS } from "./types";

interface ActiveBot {
  bot: Bot;
  status: ChannelStatus;
  dedup: ReturnType<typeof createMessageDeduplicator>;
  debouncer: ReturnType<typeof createInboundDebouncer>;
}

// In-memory registry of active Telegram bots per user
const activeBots = new Map<string, ActiveBot>();

export const telegramManager = {
  /**
   * Connect a Telegram bot for a user using their bot token.
   * Validates the token, sets up message handling, and starts polling.
   */
  async connect(userId: string, botToken: string): Promise<{ username: string }> {
    // Disconnect any existing bot first
    await this.disconnect(userId);

    const bot = new Bot(botToken);

    // Validate token by calling getMe
    const me = await bot.api.getMe();
    const username = me.username || "unknown";

    // Apply ClawdBot patterns: throttle API calls to respect rate limits
    bot.api.config.use(apiThrottler());

    // Sequentialize updates per chat to prevent race conditions
    bot.use(
      sequentialize((ctx) => {
        const chatId = ctx.chat?.id;
        return chatId ? String(chatId) : "unknown";
      })
    );

    const dedup = createMessageDeduplicator();
    const debouncer = createInboundDebouncer();

    // Handle text messages
    bot.on("message:text", async (ctx) => {
      const text = ctx.message.text;
      if (!text) return;

      const chatId = String(ctx.chat.id);
      const msgKey = `${chatId}:${ctx.message.message_id}`;
      if (dedup.isDuplicate(msgKey)) return;

      const senderName = [ctx.from?.first_name, ctx.from?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

      debouncer.debounce(chatId, text, async (combined) => {
        try {
          // Send typing indicator
          await ctx.api.sendChatAction(ctx.chat.id, "typing").catch(() => {});

          const reply = await processAgentMessage(
            userId,
            combined,
            "telegram",
            {
              id: String(ctx.from?.id || "unknown"),
              name: senderName || ctx.from?.username,
            }
          );

          // Send reply in chunks (4000 char limit for Telegram)
          const chunks = chunkText(reply, 4000);
          for (const chunk of chunks) {
            await ctx.api.sendMessage(ctx.chat.id, chunk);
          }
        } catch (err) {
          console.error(
            `[telegram] Error processing message for user ${userId}:`,
            err
          );
          await ctx.api
            .sendMessage(
              ctx.chat.id,
              "Sorry, I encountered an error processing your message."
            )
            .catch(() => {});
        }
      });
    });

    // Handle /start command
    bot.command("start", async (ctx) => {
      await ctx.reply(
        "Welcome to UrLeads CRM Assistant! Send me a message and I'll help you manage your CRM."
      );
    });

    // Handle errors gracefully
    bot.catch((err) => {
      console.error(`[telegram] Bot error for user ${userId}:`, err.error);
      const entry = activeBots.get(userId);
      if (entry) {
        entry.status.lastError = String(err.error);
      }
    });

    // Start long polling
    bot.start({
      onStart: () => {
        const entry = activeBots.get(userId);
        if (entry) {
          entry.status = {
            connected: true,
            lastConnectedAt: new Date().toISOString(),
            lastError: null,
            info: { botUsername: username },
          };
        }
      },
    });

    activeBots.set(userId, {
      bot,
      status: {
        connected: true,
        lastConnectedAt: new Date().toISOString(),
        lastError: null,
        info: { botUsername: username },
      },
      dedup,
      debouncer,
    });

    return { username };
  },

  /**
   * Disconnect a user's Telegram bot.
   */
  async disconnect(userId: string): Promise<void> {
    const entry = activeBots.get(userId);
    if (entry) {
      entry.debouncer.destroy();
      entry.dedup.clear();
      try {
        await entry.bot.stop();
      } catch {
        // Bot may already be stopped
      }
      activeBots.delete(userId);
    }
  },

  /**
   * Get the current bot status for a user.
   */
  getStatus(userId: string): ChannelStatus {
    const entry = activeBots.get(userId);
    return entry?.status || DISCONNECTED_STATUS;
  },

  /**
   * Get the bot instance for webhook mode (optional).
   */
  getBot(userId: string): Bot | null {
    return activeBots.get(userId)?.bot || null;
  },
};
