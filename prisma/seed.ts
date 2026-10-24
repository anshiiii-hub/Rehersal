import { PrismaClient } from "@prisma/client";
import { seedPrompts, template } from "../lib/templates";
import { createAgent } from "../lib/elevenlabs";
const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || "file:./dev.db" } },
});
async function main() {
  for (let i = 0; i < seedPrompts.length; i++) {
    const c = template(seedPrompts[i]);
    const existing = await db.agent.findFirst({ where: { name: c.name } });
    if (existing) {
      if (!existing.remoteId && process.env.ELEVENLABS_API_KEY) {
        const remote = await createAgent(c);
        await db.agent.update({
          where: { id: existing.id },
          data: { remoteId: remote.agent_id },
        });
        console.log(`Activated ${c.name} with ElevenLabs`);
      }
      continue;
    }
    const remote = process.env.ELEVENLABS_API_KEY ? await createAgent(c) : null;
    const a = await db.agent.create({
      data: {
        name: c.name,
        config: JSON.stringify(c),
        remoteId: remote?.agent_id,
        versions: { create: { config: JSON.stringify(c) } },
      },
    });
    if (c.kind === "roleplay" && i === 1) {
      const transcript = [
        { role: "agent", message: c.welcome_message },
        {
          role: "user",
          message:
            "I understand this can feel uncomfortable. Could you tell me when the tiredness started?",
        },
        { role: "agent", message: "A few weeks ago, I suppose." },
        {
          role: "user",
          message: "Did anything change around then, such as a new medication?",
        },
        {
          role: "agent",
          message:
            "Actually, I started some new tablets. I didn’t think it mattered.",
        },
        {
          role: "user",
          message:
            "Thank you for sharing that. Let’s review that change with your clinician and agree on the next step.",
        },
      ];
      const analysis = {
        summary:
          "Illustrative demo: the student built trust, asked a specific follow-up, uncovered a medication change, and agreed on a next step.",
        outcome: "success",
        sentiment: "Guarded → reassured",
        flagged_issues: [],
        items: c.rubric.map((r, j) => ({
          id: r.id,
          status: "hit",
          points: 25,
          evidence: transcript[[1, 1, 3, 5][j]].message,
          turn_index: [1, 1, 3, 5][j],
        })),
        missed_moments: [],
        secrets_uncovered: [c.secrets[0].secret],
        top_improvements: [
          "Ask how the symptoms affect daily activities.",
          "Summarize the timeline before closing.",
          "Check that the patient understands the next step.",
        ],
      };
      await db.session.create({
        data: {
          agentId: a.id,
          config: JSON.stringify(c),
          transcript: JSON.stringify(transcript),
          analysis: JSON.stringify(analysis),
          duration: 146,
          simulated: true,
        },
      });
    }
    console.log(`Seeded ${c.name} (${remote ? "live" : "offline demo"})`);
  }
}
main().finally(() => db.$disconnect());
