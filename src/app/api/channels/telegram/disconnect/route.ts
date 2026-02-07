import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { telegramManager } from "@/lib/channels/telegram-manager";
import { writeUserConfig } from "@/lib/storage/user-config";

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await telegramManager.disconnect(auth.userId);
    await writeUserConfig(auth.userId, {
      channels: {
        telegram: {
          enabled: false,
          mode: "personal",
          botToken: undefined,
          botUsername: undefined,
        },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to disconnect";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
