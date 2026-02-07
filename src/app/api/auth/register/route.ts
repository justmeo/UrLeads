import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUser } from "@/lib/storage/user-store";
import { createInitialConfig } from "@/lib/storage/user-config";
import { signToken } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = await createUser(email, password);
    await createInitialConfig(user.userId, email);
    const token = signToken({ userId: user.userId, email: user.email });

    return NextResponse.json({ token, userId: user.userId, email: user.email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    const status = message === "Email already registered" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
