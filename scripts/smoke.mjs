import assert from "node:assert/strict";
const origin = process.env.SMOKE_URL || "http://localhost:3000";
async function request(path, method = "GET", body) {
  const response = await fetch(origin + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(process.env.ADMIN_TOKEN
        ? { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` }
        : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return { response, data };
}
const state = await request("/api/agents");
assert.equal(state.response.status, 200);
assert.equal(
  state.data.live,
  false,
  "Smoke test uses offline mode only to avoid provider changes",
);
assert.equal(state.data.llm, false, "Smoke test uses offline compiler only");
let id, sessionId;
try {
  const created = await request("/api/agents", "POST", {
    prompt:
      "Create a fictional reluctant patient who hides symptoms for a practice session.",
    language: "en",
  });
  assert.equal(created.response.status, 201);
  id = created.data.id;
  const privateLink = await request(`/api/public/${id}`);
  assert.equal(privateLink.response.status, 404);
  let agent = (await request(`/api/agents/${id}`)).data;
  const old = agent.config;
  assert.equal(old.kind, "roleplay");
  assert.equal(old.rubric.length, 4);
  const changed = {
    ...old,
    welcome_message: "A new opening for the next rehearsal.",
  };
  assert.equal(
    (await request(`/api/agents/${id}`, "PUT", changed)).response.status,
    200,
  );
  agent = (await request(`/api/agents/${id}`)).data;
  assert.equal(agent.versions.length, 2);
  assert.equal(agent.config.welcome_message, changed.welcome_message);
  assert.equal(
    (await request(`/api/agents/${id}`, "PUT", old)).response.status,
    200,
  );
  assert.equal(
    (await request(`/api/agents/${id}/publish`, "POST")).response.status,
    200,
  );
  const publicAgent = (await request(`/api/public/${id}`)).data;
  for (const key of [
    "config",
    "secrets",
    "rubric",
    "hidden_goals",
    "remoteId",
    "persona",
  ])
    assert.equal(key in publicAgent, false, `Public response leaked ${key}`);
  const session = await request("/api/sessions", "POST", {
    agentId: id,
    simulated: true,
    duration: 20,
    transcript: [
      { role: "agent", message: old.welcome_message },
      { role: "user", message: "Could you tell me more about that?" },
    ],
  });
  assert.equal(session.response.status, 200);
  sessionId = session.data.id;
  await request(`/api/agents/${id}`, "PUT", changed);
  const detail = (await request(`/api/sessions/${sessionId}`)).data;
  assert.equal(
    detail.analysis.items.reduce((n, i) => n + i.points, 0),
    0,
  );
  assert.equal(detail.simulated, true);
  assert.equal(detail.agent.config.welcome_message, old.welcome_message);
  const sessions = (await request("/api/sessions")).data;
  assert.ok(sessions.some((s) => s.id === sessionId));
  assert.equal(
    (await request("/api/agents", "POST", { prompt: "x", language: "en" }))
      .response.status,
    400,
  );
  console.log(
    "PASS: create → test fixture → refine → undo → publish → privacy → save → review → validation",
  );
} finally {
  if (sessionId) await request(`/api/sessions/${sessionId}`, "DELETE");
  if (id) await request(`/api/agents/${id}`, "DELETE");
}
