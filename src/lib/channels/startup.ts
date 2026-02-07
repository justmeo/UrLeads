/**
 * Startup recovery: reconnects WhatsApp and Telegram channels
 * for all users who had them enabled when the server last ran.
 *
 * This runs once on server startup by being imported in the
 * Next.js instrumentation hook.
 */

import fs from "fs/promises";
import path from "path";
import { whatsappManager } from "./whatsapp-manager";
import { telegramManager } from "./telegram-manager";
import type { UserConfig } from "@/lib/config/types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_DIR = path.join(DATA_DIR, "users");

export async function recoverChannels(): Promise<void> {
  console.log("[startup] Recovering channels for existing users...");

  let userDirs: string[];
  try {
    userDirs = await fs.readdir(USERS_DIR);
  } catch {
    console.log("[startup] No users directory found, skipping recovery");
    return;
  }

  let recovered = 0;

  for (const userId of userDirs) {
    const configPath = path.join(USERS_DIR, userId, "config.json");

    let config: UserConfig;
    try {
      const data = await fs.readFile(configPath, "utf-8");
      config = JSON.parse(data);
    } catch {
      continue; // Skip users without valid config
    }

    // Recover WhatsApp
    if (config.channels?.whatsapp?.enabled && config.channels.whatsapp.mode === "personal") {
      try {
        await whatsappManager.reconnect(userId);
        console.log(`[startup] Reconnected WhatsApp for user ${userId}`);
        recovered++;
      } catch (err) {
        console.error(`[startup] Failed to reconnect WhatsApp for ${userId}:`, err);
      }
    }

    // Recover Telegram
    if (
      config.channels?.telegram?.enabled &&
      config.channels.telegram.mode === "personal" &&
      config.channels.telegram.botToken
    ) {
      try {
        await telegramManager.connect(userId, config.channels.telegram.botToken);
        console.log(`[startup] Reconnected Telegram for user ${userId}`);
        recovered++;
      } catch (err) {
        console.error(`[startup] Failed to reconnect Telegram for ${userId}:`, err);
      }
    }
  }

  console.log(`[startup] Channel recovery complete. ${recovered} channel(s) reconnected.`);
}
