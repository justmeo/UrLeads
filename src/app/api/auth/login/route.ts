import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser } from "@/lib/storage/user-store";
import { signToken } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = signToken({ userId: user.userId, email: user.email });
    return NextResponse.json({ token, userId: user.userId, email: user.email });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
