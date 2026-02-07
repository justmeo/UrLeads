import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";
import { telegramManager } from "@/lib/channels/telegram-manager";
import { writeUserConfig } from "@/lib/storage/user-config";

const connectSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
});

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = connectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { botToken } = parsed.data;
    const { username } = await telegramManager.connect(auth.userId, botToken);

    // Save to user config
    await writeUserConfig(auth.userId, {
      channels: {
        telegram: {
          enabled: true,
          mode: "personal",
          botToken,
          botUsername: username,
        },
      },
    });

    return NextResponse.json({ ok: true, botUsername: username });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect Telegram bot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
