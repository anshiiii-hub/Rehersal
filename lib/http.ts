import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { VoiceError } from "./elevenlabs";
export function admin(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  if (token && req.headers.get("authorization") !== `Bearer ${token}`)
    throw new VoiceError("Owner access required.", 401);
  if (!token && process.env.NODE_ENV === "production")
    throw new VoiceError("Set ADMIN_TOKEN before running in production.", 503);
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
