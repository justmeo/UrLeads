import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { whatsappManager } from "@/lib/channels/whatsapp-manager";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;

  const status = whatsappManager.getStatus(auth.userId);
  return NextResponse.json(status);
}
