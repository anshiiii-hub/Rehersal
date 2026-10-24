import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { admin, failure } from "@/lib/http";
import { configSchema } from "@/lib/schemas";
import { updateAgent, deleteAgent, createAgent } from "@/lib/elevenlabs";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, ctx: Context) {
  try {
    admin(req);
    const { id } = await ctx.params;
    const a = await db.agent.findUniqueOrThrow({
      where: { id },
      include: { versions: { orderBy: { createdAt: "desc" } } },
    });
    return NextResponse.json({
      ...a,
      config: JSON.parse(a.config),
      versions: a.versions.map((v) => ({ ...v, config: JSON.parse(v.config) })),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(req: NextRequest, ctx: Context) {
  try {
    admin(req);
    const { id } = await ctx.params;
    const c = configSchema.parse(await req.json());
    const a = await db.agent.findUniqueOrThrow({ where: { id } });
    let remoteId = a.remoteId;
    if (remoteId) await updateAgent(remoteId, c);
    else if (process.env.ELEVENLABS_API_KEY)
      remoteId = (await createAgent(c)).agent_id;
    await db.agent.update({
      where: { id },
      data: {
        name: c.name,
        config: JSON.stringify(c),
        remoteId,
        versions: { create: { config: JSON.stringify(c) } },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: NextRequest, ctx: Context) {
  try {
    admin(req);
    const { id } = await ctx.params;
    const a = await db.agent.findUniqueOrThrow({ where: { id } });
    if (a.remoteId) await deleteAgent(a.remoteId);
    await db.agent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
