import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    const { default: sql } = await import("@/lib/db");

    const [user] = await sql`
      SELECT id, email, password_hash FROM users WHERE email = ${email}
    `;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, email: user.email });
    const response = NextResponse.json({ user: { id: user.id, email: user.email } });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
