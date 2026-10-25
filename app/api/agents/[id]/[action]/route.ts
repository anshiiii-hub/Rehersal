import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { admin, failure } from "@/lib/http";
import { signedUrl } from "@/lib/elevenlabs";
import { refine } from "@/lib/llm";
import { configSchema } from "@/lib/schemas";
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; action: string }> },
) {
  try {
    await admin(req);
    const { id, action } = await ctx.params;
    const a = await db.agent.findUniqueOrThrow({ where: { id } });
    if (action === "signed-url") {
      if (!a.remoteId)
        throw new Error(
          "This is an offline demo agent. Configure ElevenLabs and save the agent to enable voice.",
        );
      return NextResponse.json(await signedUrl(a.remoteId));
    }
    if (action === "refine") {
      const { instruction } = z
        .object({ instruction: z.string().min(3).max(1000) })
        .parse(await req.json());
      return NextResponse.json(
        await refine(configSchema.parse(JSON.parse(a.config)), instruction),
      );
    }
    if (action === "publish") {
      await db.agent.update({ where: { id }, data: { published: true } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 404 });
  } catch (e) {
    return failure(e);
  }
}
