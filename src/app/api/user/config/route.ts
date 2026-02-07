import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { readUserConfig, writeUserConfig } from "@/lib/storage/user-config";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const config = await readUserConfig(auth.userId);
    // Strip sensitive fields from response
    const safe = {
      ...config,
      ai: {
        ...config.ai,
        apiKey: config.ai.apiKey ? "••••••••" : undefined,
      },
      channels: {
        ...config.channels,
        telegram: config.channels.telegram
          ? {
              ...config.channels.telegram,
              botToken: config.channels.telegram.botToken ? "••••••••" : undefined,
            }
          : undefined,
      },
    };
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: "Failed to read config" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();

    // Don't allow overwriting userId/email/createdAt via API
    delete body.userId;
    delete body.email;
    delete body.createdAt;

    const updated = await writeUserConfig(auth.userId, body);
    return NextResponse.json({ ok: true, config: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
