import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { ChatEntry } from "../config/types";
import { getUserDir, ensureUserDir } from "./user-config";

function getHistoryPath(userId: string): string {
  return path.join(getUserDir(userId), "chat-history.json");
}

export async function appendMessage(
  userId: string,
  entry: Omit<ChatEntry, "id" | "timestamp">
): Promise<ChatEntry> {
  await ensureUserDir(userId);
  const historyPath = getHistoryPath(userId);

  const full: ChatEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  let history: ChatEntry[] = [];
  try {
    const data = await fs.readFile(historyPath, "utf-8");
    history = JSON.parse(data);
  } catch {
    // File doesn't exist yet
  }

  history.push(full);

  // Keep last 1000 messages max
  if (history.length > 1000) {
    history = history.slice(-1000);
  }

  await fs.writeFile(historyPath, JSON.stringify(history, null, 2), "utf-8");
  return full;
}

export async function getHistory(
  userId: string,
  limit: number = 50
): Promise<ChatEntry[]> {
  const historyPath = getHistoryPath(userId);
  try {
    const data = await fs.readFile(historyPath, "utf-8");
    const history: ChatEntry[] = JSON.parse(data);
    return history.slice(-limit);
  } catch {
    return [];
  }
}

export async function clearHistory(userId: string): Promise<void> {
  const historyPath = getHistoryPath(userId);
  try {
    await fs.writeFile(historyPath, "[]", "utf-8");
  } catch {
    // Ignore if file doesn't exist
  }
}
