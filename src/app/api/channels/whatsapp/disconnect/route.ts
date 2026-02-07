import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { whatsappManager } from "@/lib/channels/whatsapp-manager";
import { writeUserConfig } from "@/lib/storage/user-config";

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await whatsappManager.disconnect(auth.userId);
    await writeUserConfig(auth.userId, {
      channels: {
        whatsapp: {
          enabled: false,
          mode: "personal",
          connectedPhone: undefined,
        },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to disconnect";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
