import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { telegramManager } from "@/lib/channels/telegram-manager";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;

  const status = telegramManager.getStatus(auth.userId);
  return NextResponse.json(status);
}
