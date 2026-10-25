import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";

// Ensure DATABASE_URL is available for test runner if .env.local exists
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

import { POST as registerRoute } from "../app/api/auth/register/route";
import { POST as loginRoute } from "../app/api/auth/login/route";
import { GET as meRoute } from "../app/api/auth/me/route";
import { POST as logoutRoute } from "../app/api/auth/logout/route";
import { SESSION_COOKIE_NAME } from "../lib/auth";

test("auth API routes end-to-end registration, login, session inspection, and logout", async () => {
  const uniqueEmail = `test-${Date.now()}@rehearsal.ai`;
  const password = "ValidPassword123!";
  const name = "Test Director";
  const workspace = "Test Voice Studio";

  // 1. Register new user
  const regReq = new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      email: uniqueEmail,
      password,
      workspace,
    }),
  });

  const regRes = await registerRoute(regReq);
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  assert.equal(regData.user.email, uniqueEmail);
  assert.equal(regData.user.name, name);
  assert.equal(regData.user.workspace, workspace);

  const cookieHeader = regRes.headers.get("set-cookie") || "";
  assert.ok(cookieHeader.includes(SESSION_COOKIE_NAME));

  // Extract session token
  const tokenMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  assert.ok(tokenMatch, "Session cookie should be present in Set-Cookie header");
  const sessionToken = tokenMatch[1];

  // 2. Reject duplicate email registration
  const dupReq = new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Another",
      email: uniqueEmail,
      password,
    }),
  });
  const dupRes = await registerRoute(dupReq);
  assert.equal(dupRes.status, 409);

  // 3. Login with wrong password should fail
  const wrongLoginReq = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: uniqueEmail,
      password: "WrongPassword!",
    }),
  });
  const wrongLoginRes = await loginRoute(wrongLoginReq);
  assert.equal(wrongLoginRes.status, 401);

  // 4. Login with correct password succeeds
  const loginReq = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: uniqueEmail,
      password,
    }),
  });
  const loginRes = await loginRoute(loginReq);
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.user.email, uniqueEmail);

  // 5. Query /api/auth/me with session cookie
  const meReq = new NextRequest("http://localhost:3000/api/auth/me", {
    method: "GET",
    headers: {
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    },
  });
  const meRes = await meRoute(meReq);
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.ok(meData.user);
  assert.equal(meData.user.email, uniqueEmail);

  // 6. Query /api/auth/me without cookie returns user: null
  const noCookieReq = new NextRequest("http://localhost:3000/api/auth/me", {
    method: "GET",
  });
  const noCookieRes = await meRoute(noCookieReq);
  assert.equal(noCookieRes.status, 200);
  const noCookieData = await noCookieRes.json();
  assert.equal(noCookieData.user, null);

  // 7. Logout clears session
  const logoutReq = new NextRequest("http://localhost:3000/api/auth/logout", {
    method: "POST",
    headers: {
      Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
    },
  });
  const logoutRes = await logoutRoute(logoutReq);
  assert.equal(logoutRes.status, 200);
  const logoutCookie = logoutRes.headers.get("set-cookie") || "";
  assert.ok(logoutCookie.includes("Max-Age=0") || logoutCookie.includes("max-age=0"));
});
