import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ userId: auth.userId, email: auth.email });
}
