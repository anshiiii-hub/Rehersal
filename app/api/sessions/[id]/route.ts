import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admin, failure } from "@/lib/http";
import { deleteConversation } from "@/lib/elevenlabs";
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    admin(req);
    const { id } = await ctx.params;
    const s = await db.session.findUniqueOrThrow({
      where: { id },
      include: { agent: true },
    });
    return NextResponse.json({
      ...s,
      transcript: JSON.parse(s.transcript),
      analysis: JSON.parse(s.analysis),
      agent: {
        ...s.agent,
        config: JSON.parse(s.config === "{}" ? s.agent.config : s.config),
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    admin(req);
    const { id } = await ctx.params;
    const s = await db.session.findUniqueOrThrow({ where: { id } });
    if (s.remoteId) await deleteConversation(s.remoteId);
    await db.session.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
