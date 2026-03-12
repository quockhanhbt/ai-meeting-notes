import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Valid email and password (min 8 chars) required." },
        { status: 400 }
      );
    }

    // Lazy import so module-load errors surface as JSON, not a 500 HTML page
    const { default: sql } = await import("@/lib/db");

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 12);
    const [user] = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email}, ${hash})
      RETURNING id, email
    `;

    const token = await signToken({ userId: user.id, email: user.email });
    const response = NextResponse.json(
      { user: { id: user.id, email: user.email } },
      { status: 201 }
    );
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
