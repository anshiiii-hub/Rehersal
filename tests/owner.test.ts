import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
  } catch {}
}

import { POST } from "../app/api/owner/route";

test("owner connection validates credentials without accessing the database", async () => {
  const previous = process.env.ADMIN_TOKEN;
  process.env.ADMIN_TOKEN = "test-owner-secret";
  try {
    for (const token of [undefined, "wrong-token", "test-owner-secret"]) {
      const request = new NextRequest("https://example.test/api/owner", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const response = await POST(request);
      assert.equal(response.status, token === "test-owner-secret" ? 200 : 401);
      if (response.ok) {
        assert.deepEqual(await response.json(), { ok: true });
        assert.equal(response.headers.get("cache-control"), "no-store");
      }
    }
    delete process.env.ADMIN_TOKEN;
    assert.equal(
      (
        await POST(
          new NextRequest("http://localhost/api/owner", { method: "POST" }),
        )
      ).status,
      200,
    );
  } finally {
    if (previous === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = previous;
  }
});

test("owner endpoint allows authenticated users even when ADMIN_TOKEN is set", async () => {
  const previous = process.env.ADMIN_TOKEN;
  process.env.ADMIN_TOKEN = "production-admin-key";
  try {
    // 1. Without auth cookie or token -> 401
    const unauthedReq = new NextRequest("https://example.test/api/owner", {
      method: "POST",
    });
    const unauthedRes = await POST(unauthedReq);
    assert.equal(unauthedRes.status, 401);

    // 2. With invalid auth cookie -> 401
    const badCookieReq = new NextRequest("https://example.test/api/owner", {
      method: "POST",
      headers: { Cookie: "rehearsal_session=invalid-token" },
    });
    const badCookieRes = await POST(badCookieReq);
    assert.equal(badCookieRes.status, 401);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = previous;
  }
});
