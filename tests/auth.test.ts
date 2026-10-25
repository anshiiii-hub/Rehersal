import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, RegisterSchema, LoginSchema } from "../lib/auth";

test("hashPassword produces valid salt:hash format and verifyPassword checks correctly", () => {
  const password = "SuperSecretPassword123!";
  const hash = hashPassword(password);
  
  assert.ok(hash.includes(":"), "hash should contain a colon separating salt and scrypt hash");
  assert.equal(verifyPassword(password, hash), true, "correct password should verify");
  assert.equal(verifyPassword("WrongPassword", hash), false, "incorrect password should fail");
  assert.equal(verifyPassword("", hash), false, "empty password should fail");
  assert.equal(verifyPassword(password, "corrupt:hash"), false, "corrupt hash should fail cleanly");
});

test("RegisterSchema validates requirements properly", () => {
  const valid = RegisterSchema.safeParse({
    name: "Alex River",
    email: "alex@rehearsal.ai",
    password: "Password123!",
    workspace: "Alex Voice Lab",
  });
  assert.equal(valid.success, true);

  const shortName = RegisterSchema.safeParse({
    name: "A",
    email: "alex@rehearsal.ai",
    password: "Password123!",
  });
  assert.equal(shortName.success, false);

  const invalidEmail = RegisterSchema.safeParse({
    name: "Alex",
    email: "not-an-email",
    password: "Password123!",
  });
  assert.equal(invalidEmail.success, false);

  const shortPassword = RegisterSchema.safeParse({
    name: "Alex",
    email: "alex@rehearsal.ai",
    password: "123",
  });
  assert.equal(shortPassword.success, false);
});

test("LoginSchema validates input properly", () => {
  const valid = LoginSchema.safeParse({
    email: "alex@rehearsal.ai",
    password: "Password123!",
  });
  assert.equal(valid.success, true);

  const invalid = LoginSchema.safeParse({
    email: "bad-email",
    password: "",
  });
  assert.equal(invalid.success, false);
});
