import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { hashPassword, comparePassword } from "../auth";
import type { UserRecord } from "../config/types";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readUsers(): Promise<UserRecord[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeUsers(users: UserRecord[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export async function createUser(
  email: string,
  password: string
): Promise<{ userId: string; email: string }> {
  const users = await readUsers();

  if (users.some((u) => u.email === email)) {
    throw new Error("Email already registered");
  }

  const userId = uuidv4();
  const passwordHash = await hashPassword(password);

  users.push({
    userId,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  await writeUsers(users);
  return { userId, email };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<{ userId: string; email: string } | null> {
  const users = await readUsers();
  const user = users.find((u) => u.email === email);

  if (!user) return null;

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) return null;

  return { userId: user.userId, email: user.email };
}

export async function getUserById(
  userId: string
): Promise<{ userId: string; email: string } | null> {
  const users = await readUsers();
  const user = users.find((u) => u.userId === userId);
  if (!user) return null;
  return { userId: user.userId, email: user.email };
}
