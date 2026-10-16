import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "../src/store.mjs";
import { ownerAccessAllowed } from "../src/owner-access.mjs";

test("memory store publishes newest first and gives stable IDs", async () => {
  const store = createMemoryStore();
  const first = await store.publish({ title: "Tent" });
  const second = await store.publish({ title: "Camera" });
  assert.match(first.id, /^[0-9a-f-]{36}$/);
  assert.ok(first.createdAt);
  assert.deepEqual((await store.list()).map((entry) => entry.id), [second.id, first.id]);
});

test("owner access code is required only when configured", () => {
  assert.equal(ownerAccessAllowed(undefined, ""), true);
  assert.equal(ownerAccessAllowed(undefined, "a-strong-secret-code"), false);
  assert.equal(ownerAccessAllowed("Bearer wrong", "a-strong-secret-code"), false);
  assert.equal(ownerAccessAllowed("Bearer a-strong-secret-code", "a-strong-secret-code"), true);
});
