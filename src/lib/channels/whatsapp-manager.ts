/**
 * WhatsApp connection manager adapted from ClawdBot's WhatsApp extension.
 *
 * Key patterns from ClawdBot:
 * - Baileys socket with useMultiFileAuthState() for credential persistence
 * - QR code login flow via connection.update events
 * - Message receiving via messages.upsert events
 * - Auto-reconnect on non-logout disconnects
 * - Text chunking for replies (4000 char limit)
 */

import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  type WASocket,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { processAgentMessage } from "@/lib/ai/agent";
import { getUserAuthDir } from "@/lib/storage/user-config";
import { writeUserConfig } from "@/lib/storage/user-config";
import { chunkText, createMessageDeduplicator, createInboundDebouncer } from "./message-utils";
import type { ChannelStatus } from "./types";
import { DISCONNECTED_STATUS } from "./types";
import fs from "fs/promises";

interface ActiveSocket {
  sock: WASocket;
  status: ChannelStatus;
  dedup: ReturnType<typeof createMessageDeduplicator>;
  debouncer: ReturnType<typeof createInboundDebouncer>;
}

// In-memory registry of active WhatsApp sockets per user
const activeSockets = new Map<string, ActiveSocket>();

// Pending QR login sessions
const pendingLogins = new Map<
  string,
  {
    resolve: (qr: string) => void;
    reject: (err: Error) => void;
    timeout: NodeJS.Timeout;
  }
>();

export const whatsappManager = {
  /**
   * Start a QR login flow for a user. Returns a base64 data URL of the QR code.
   * The user scans this in WhatsApp -> Linked Devices.
   */
  async startQrLogin(userId: string): Promise<string> {
    // If already connected, return early
    const existing = activeSockets.get(userId);
    if (existing?.status.connected) {
      throw new Error("WhatsApp is already connected. Disconnect first to re-link.");
    }

    // Disconnect any stale connection
    await this.disconnect(userId);

    const authDir = getUserAuthDir(userId);
    await fs.mkdir(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    return new Promise<string>((resolve, reject) => {
      const loginTimeout = setTimeout(() => {
        pendingLogins.delete(userId);
        reject(new Error("QR login timed out after 60 seconds"));
      }, 60_000);

      pendingLogins.set(userId, { resolve, reject, timeout: loginTimeout });

      const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        browser: ["UrLeads", "Web", "1.0.0"],
        syncFullHistory: false,
        markOnlineOnConnect: false,
      });

      const dedup = createMessageDeduplicator();
      const debouncer = createInboundDebouncer();

      activeSockets.set(userId, {
        sock,
        status: { connected: false, lastConnectedAt: null, lastError: null },
        dedup,
        debouncer,
      });

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          // Generate QR as base64 PNG data URL
          try {
            const qrDataUrl = await QRCode.toDataURL(qr, { width: 300 });
            const pending = pendingLogins.get(userId);
            if (pending) {
              clearTimeout(pending.timeout);
              pendingLogins.delete(userId);
              pending.resolve(qrDataUrl);
            }
          } catch (err) {
            const pending = pendingLogins.get(userId);
            if (pending) {
              clearTimeout(pending.timeout);
              pendingLogins.delete(userId);
              pending.reject(
                err instanceof Error ? err : new Error("Failed to generate QR")
              );
            }
          }
        }

        if (connection === "open") {
          const entry = activeSockets.get(userId);
          if (entry) {
            entry.status = {
              connected: true,
              lastConnectedAt: new Date().toISOString(),
              lastError: null,
              info: { phone: sock.user?.id?.split(":")[0] || "unknown" },
            };
          }

          // Save connected phone to user config
          const phone = sock.user?.id?.split(":")[0];
          if (phone) {
            await writeUserConfig(userId, {
              channels: {
                whatsapp: {
                  enabled: true,
                  mode: "personal",
                  connectedPhone: phone,
                },
              },
            }).catch(() => {});
          }

          // Set up message listener
          this.setupMessageListener(userId, sock, dedup, debouncer);
        }

        if (connection === "close") {
          const statusCode =
            (lastDisconnect?.error as any)?.output?.statusCode;

          const entry = activeSockets.get(userId);
          if (entry) {
            entry.status.connected = false;
            entry.status.lastError = `Disconnected (code: ${statusCode})`;
          }

          if (statusCode !== DisconnectReason.loggedOut) {
            // Auto-reconnect after a delay
            setTimeout(() => this.reconnect(userId), 5000);
          } else {
            // Logged out - clean up
            activeSockets.delete(userId);
          }
        }
      });
    });
  },

  /**
   * Set up the incoming message listener on a WhatsApp socket.
   */
  setupMessageListener(
    userId: string,
    sock: WASocket,
    dedup: ReturnType<typeof createMessageDeduplicator>,
    debouncer: ReturnType<typeof createInboundDebouncer>
  ) {
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        // Skip own messages
        if (msg.key.fromMe) continue;

        // Extract text content
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text;
        if (!text) continue;

        const remoteJid = msg.key.remoteJid;
        if (!remoteJid) continue;

        // Skip status/broadcast messages
        if (remoteJid.endsWith("@broadcast") || remoteJid.endsWith("@status")) {
          continue;
        }

        // Deduplicate
        const msgKey = `${remoteJid}:${msg.key.id}`;
        if (dedup.isDuplicate(msgKey)) continue;

        const senderId = remoteJid;
        const senderName = msg.pushName || undefined;

        // Debounce rapid messages from same sender
        debouncer.debounce(senderId, text, async (combined) => {
          try {
            const reply = await processAgentMessage(
              userId,
              combined,
              "whatsapp",
              { id: senderId, name: senderName }
            );

            // Send reply in chunks
            const chunks = chunkText(reply);
            for (const chunk of chunks) {
              await sock.sendMessage(remoteJid, { text: chunk });
            }
          } catch (err) {
            console.error(
              `[whatsapp] Error processing message for user ${userId}:`,
              err
            );
            await sock.sendMessage(remoteJid, {
              text: "Sorry, I encountered an error processing your message.",
            }).catch(() => {});
          }
        });
      }
    });
  },

  /**
   * Reconnect an existing user's WhatsApp from saved auth state.
   * No QR scan needed if credentials are still valid.
   */
  async reconnect(userId: string): Promise<void> {
    const authDir = getUserAuthDir(userId);

    // Check if auth state exists
    try {
      await fs.access(`${authDir}/creds.json`);
    } catch {
      // No saved auth state, can't reconnect
      return;
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      auth: state,
      version,
      printQRInTerminal: false,
      browser: ["UrLeads", "Web", "1.0.0"],
      syncFullHistory: false,
      markOnlineOnConnect: false,
    });

    const dedup = createMessageDeduplicator();
    const debouncer = createInboundDebouncer();

    activeSockets.set(userId, {
      sock,
      status: { connected: false, lastConnectedAt: null, lastError: null },
      dedup,
      debouncer,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        const entry = activeSockets.get(userId);
        if (entry) {
          entry.status = {
            connected: true,
            lastConnectedAt: new Date().toISOString(),
            lastError: null,
            info: { phone: sock.user?.id?.split(":")[0] || "unknown" },
          };
        }
        this.setupMessageListener(userId, sock, dedup, debouncer);
      }

      if (connection === "close") {
        const statusCode =
          (lastDisconnect?.error as any)?.output?.statusCode;
        const entry = activeSockets.get(userId);
        if (entry) {
          entry.status.connected = false;
          entry.status.lastError = `Disconnected (code: ${statusCode})`;
        }

        if (statusCode !== DisconnectReason.loggedOut) {
          setTimeout(() => this.reconnect(userId), 10000);
        } else {
          activeSockets.delete(userId);
        }
      }
    });
  },

  /**
   * Disconnect a user's WhatsApp connection.
   */
  async disconnect(userId: string): Promise<void> {
    const entry = activeSockets.get(userId);
    if (entry) {
      entry.debouncer.destroy();
      entry.dedup.clear();
      try {
        entry.sock.end(undefined);
      } catch {
        // Socket may already be closed
      }
      activeSockets.delete(userId);
    }

    // Clean up any pending login
    const pending = pendingLogins.get(userId);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingLogins.delete(userId);
    }
  },

  /**
   * Get the current connection status for a user.
   */
  getStatus(userId: string): ChannelStatus {
    const entry = activeSockets.get(userId);
    return entry?.status || DISCONNECTED_STATUS;
  },
};
