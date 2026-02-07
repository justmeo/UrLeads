import { NextRequest, NextResponse } from "next/server";
import { verifyToken, type AuthPayload } from "./auth";

export async function withAuth(
  request: NextRequest
): Promise<AuthPayload | NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  return payload;
}
