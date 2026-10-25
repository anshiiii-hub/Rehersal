import { NextRequest, NextResponse } from "next/server";
import {
  RegisterSchema,
  hashPassword,
  createSession,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { failure } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = RegisterSchema.parse(json);
    const email = data.email.toLowerCase();

    const existing = await db.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = hashPassword(data.password);
    const user = await db.user.create({
      data: {
        email,
        name: data.name,
        passwordHash,
        workspace: data.workspace || `${data.name}'s Studio`,
      },
    });

    const sessionToken = await createSession(user.id);

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          workspace: user.workspace,
        },
      },
      { status: 201 },
    );

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
