import fs from "fs/promises";
import path from "path";
import type { UserConfig } from "../config/types";
import { DEFAULT_USER_CONFIG } from "../config/types";

const DATA_DIR = path.join(process.cwd(), "data");

export function getUserDir(userId: string): string {
  return path.join(DATA_DIR, "users", userId);
}

export function getUserAuthDir(userId: string): string {
  return path.join(getUserDir(userId), "whatsapp-auth");
}

export async function ensureUserDir(userId: string): Promise<string> {
  const dir = getUserDir(userId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function readUserConfig(userId: string): Promise<UserConfig> {
  const configPath = path.join(getUserDir(userId), "config.json");
  try {
    const data = await fs.readFile(configPath, "utf-8");
    return JSON.parse(data);
  } catch {
    // Return a default config if none exists
    return {
      userId,
      email: "",
      createdAt: new Date().toISOString(),
      ...DEFAULT_USER_CONFIG,
    };
  }
}

export async function writeUserConfig(
  userId: string,
  updates: Partial<UserConfig>
): Promise<UserConfig> {
  await ensureUserDir(userId);
  const existing = await readUserConfig(userId);

  const merged: UserConfig = {
    ...existing,
    ...updates,
    crm: { ...existing.crm, ...updates.crm },
    ai: { ...existing.ai, ...updates.ai },
    channels: {
      ...existing.channels,
      ...updates.channels,
      whatsapp: updates.channels?.whatsapp
        ? { ...existing.channels.whatsapp, ...updates.channels.whatsapp }
        : existing.channels.whatsapp,
      telegram: updates.channels?.telegram
        ? { ...existing.channels.telegram, ...updates.channels.telegram }
        : existing.channels.telegram,
    },
    // Never overwrite these from partial updates
    userId: existing.userId,
    email: existing.email,
    createdAt: existing.createdAt,
  };

  const configPath = path.join(getUserDir(userId), "config.json");
  await fs.writeFile(configPath, JSON.stringify(merged, null, 2), "utf-8");
  return merged;
}

export async function createInitialConfig(
  userId: string,
  email: string
): Promise<UserConfig> {
  await ensureUserDir(userId);
  const config: UserConfig = {
    userId,
    email,
    createdAt: new Date().toISOString(),
    ...DEFAULT_USER_CONFIG,
  };
  const configPath = path.join(getUserDir(userId), "config.json");
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
  return config;
}
