import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { VoiceError } from "./elevenlabs";
import { getCurrentUser, SafeUser } from "./auth";

export async function admin(req: NextRequest): Promise<SafeUser | null> {
  const token = process.env.ADMIN_TOKEN;

  // 1. If valid Bearer token matching ADMIN_TOKEN is supplied, allow access
  if (token && req.headers.get("authorization") === `Bearer ${token}`) {
    return await getCurrentUser(req);
  }

  // 2. If user is authenticated via session cookie, allow access
  const user = await getCurrentUser(req);
  if (user) {
    return user;
  }

  // 3. If no ADMIN_TOKEN is set on server, allow access (local-trust mode)
  if (!token) {
    return null;
  }

  throw new VoiceError(
    "Owner access required. Please sign in or provide an owner token.",
    401,
  );
}
export function failure(e: unknown) {
  if (e instanceof ZodError)
    return NextResponse.json(
      { error: "Invalid input", details: e.flatten() },
      { status: 400 },
    );
  return NextResponse.json(
    { error: e instanceof Error ? e.message : "Unexpected server error" },
    { status: e instanceof VoiceError ? e.status : 500 },
  );
}
