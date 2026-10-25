import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { admin, failure } from "@/lib/http";
import {
  listVoices,
  preview,
  designVoice,
  saveDesignedVoice,
} from "@/lib/elevenlabs";
export async function GET(req: NextRequest) {
  try {
    await admin(req);
    return NextResponse.json(await listVoices(req.nextUrl.searchParams));
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    await admin(req);
    const b = z
      .discriminatedUnion("action", [
        z.object({
          action: z.literal("preview"),
          voice: z.string().min(1),
          text: z.string().min(1).max(500),
        }),
        z.object({
          action: z.literal("design"),
          description: z.string().min(20).max(1000),
        }),
        z.object({
          action: z.literal("save"),
          id: z.string(),
          name: z.string().min(1),
          description: z.string(),
        }),
      ])
      .parse(await req.json());
    if (b.action === "design")
      return NextResponse.json(await designVoice(b.description));
    if (b.action === "save")
      return NextResponse.json(
        await saveDesignedVoice(b.id, b.name, b.description),
      );
    return new Response(await preview(b.voice, b.text), {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    return failure(e);
  }
}
