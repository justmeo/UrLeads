import { NextRequest, NextResponse } from "next/server";
import { webhookCallback } from "grammy";
import { telegramManager } from "@/lib/channels/telegram-manager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const bot = telegramManager.getBot(userId);

  if (!bot) {
    return NextResponse.json({ error: "Bot not found" }, { status: 404 });
  }

  try {
    const handler = webhookCallback(bot, "std/http");
    return handler(request);
  } catch (err) {
    console.error(`[webhook] Error for user ${userId}:`, err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
