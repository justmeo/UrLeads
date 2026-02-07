import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { getHistory, clearHistory } from "@/lib/storage/chat-history";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 50;
    const history = await getHistory(auth.userId, limit);
    return NextResponse.json({ messages: history });
  } catch {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await clearHistory(auth.userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
  }
}
