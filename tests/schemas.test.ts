import { test } from "node:test";
import assert from "node:assert/strict";
import {
  configSchema,
  patchSchema,
  gradeSchema,
  validateEvidence,
} from "../lib/schemas";
import { template } from "../lib/templates";
test("compiler accepts a complete roleplay configuration", () => {
  assert.equal(
    configSchema.parse(template("A patient hiding symptoms")).kind,
    "roleplay",
  );
});
test("compiler rejects an incomplete roleplay rubric and invalid language", () => {
  const c = template("A patient hiding symptoms");
  assert.equal(configSchema.safeParse({ ...c, rubric: [] }).success, false);
  assert.equal(
    configSchema.safeParse({ ...c, languages: ["xx"] }).success,
    false,
  );
});
test("patch requires a full valid config and explanation", () => {
  assert.equal(
    patchSchema.safeParse({
      config: template("A patient who hides symptoms"),
      explanation: "Warmer opening",
    }).success,
    true,
  );
  assert.equal(
    patchSchema.safeParse({ config: { name: "Only a name" } }).success,
    false,
  );
});
test("grader rejects invalid outcome and negative points", () => {
  assert.equal(
    gradeSchema.safeParse({ outcome: "great", items: [{ points: -1 }] })
      .success,
    false,
  );
});
test("grader removes invented evidence, wrong speaker, and caps awarded points", () => {
  const c = template("A patient who hides symptoms");
  const g = gradeSchema.parse({
    summary: "Test",
    outcome: "partial",
    sentiment: "neutral",
    flagged_issues: [],
    items: [
      {
        id: "r0",
        status: "hit",
        points: 100,
        evidence: "hello",
        turn_index: 0,
      },
      {
        id: "r1",
        status: "hit",
        points: 25,
        evidence: "invented",
        turn_index: 0,
      },
      {
        id: "r2",
        status: "hit",
        points: 25,
        evidence: "secret",
        turn_index: 1,
      },
    ],
    missed_moments: [],
    secrets_uncovered: [],
    top_improvements: [],
  });
  const checked = validateEvidence(g, c, [
    { role: "user", message: "hello there" },
    { role: "agent", message: "secret" },
  ]);
  assert.equal(checked.items[0].points, 25);
  assert.equal(checked.items[1].points, 0);
  assert.equal(checked.items[2].points, 0);
  assert.equal(checked.items[3].status, "missed");
});
