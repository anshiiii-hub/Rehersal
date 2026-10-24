import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { admin, failure } from "@/lib/http";
import { compile, hasLlm } from "@/lib/llm";
import { createAgent } from "@/lib/elevenlabs";
export async function GET(req: NextRequest) {
  try {
    admin(req);
    const agents = await db.agent.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { sessions: true } } },
    });
    return NextResponse.json({
      agents: agents.map((a) => ({ ...a, config: JSON.parse(a.config) })),
      live: !!process.env.ELEVENLABS_API_KEY,
      llm: hasLlm(),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: NextRequest) {
  try {
    admin(req);
    const { prompt, language, difficulty, kind } = z
      .object({
        prompt: z.string().min(10).max(1000),
        language: z.enum(["en", "hi"]).default("en"),
        difficulty: z.enum(["Friendly", "Tough", "Brutal"]).optional(),
        kind: z.enum(["assistant", "roleplay"]).optional(),
      })
      .parse(await req.json());
    const config = await compile(prompt, language, kind);
    if (difficulty) config.difficulty = difficulty;
    const remote = process.env.ELEVENLABS_API_KEY
      ? await createAgent(config)
      : null;
    const agent = await db.agent.create({
      data: {
        name: config.name,
        config: JSON.stringify(config),
        remoteId: remote?.agent_id,
        versions: { create: { config: JSON.stringify(config) } },
      },
    });
    return NextResponse.json({ id: agent.id }, { status: 201 });
  } catch (e) {
    return failure(e);
  }
}
