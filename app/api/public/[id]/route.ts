import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { failure } from "@/lib/http";
import { signedUrl } from "@/lib/elevenlabs";
export async function GET(
  _: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const a = await db.agent.findUnique({ where: { id } });
    if (!a?.published)
      return NextResponse.json(
        { error: "This practice link is not published." },
        { status: 404 },
      );
    const c = JSON.parse(a.config);
    return NextResponse.json({
      id: a.id,
      name: a.name,
      kind: c.kind,
      welcome_message: c.welcome_message,
      brief:
        c.kind === "roleplay"
          ? "Practice listening, asking thoughtful questions, and agreeing on a next step. This fictional character may be challenging."
          : "Talk to this AI assistant. Avoid sharing sensitive information.",
      live: !!a.remoteId,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(
  _: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const a = await db.agent.findUnique({ where: { id } });
    if (!a?.published || !a.remoteId)
      return NextResponse.json(
        { error: "Live voice is not available for this link." },
        { status: 404 },
      );
    return NextResponse.json(await signedUrl(a.remoteId));
  } catch (e) {
    return failure(e);
  }
}
