import { NextRequest, NextResponse } from "next/server";
import {
  LoginSchema,
  verifyPassword,
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { failure } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { email, password } = LoginSchema.parse(json);
    const normalizedEmail = email.toLowerCase();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid email or password. Please try again." },
        { status: 401 },
      );
    }

    const sessionToken = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        workspace: user.workspace,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    return failure(error);
  }
}
