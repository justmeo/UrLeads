import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { whatsappManager } from "@/lib/channels/whatsapp-manager";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const qrDataUrl = await whatsappManager.startQrLogin(auth.userId);
    return NextResponse.json({ qr: qrDataUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start QR login";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
