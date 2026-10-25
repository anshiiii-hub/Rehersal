import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
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
