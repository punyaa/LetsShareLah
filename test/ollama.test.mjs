import test from "node:test";
import assert from "node:assert/strict";
import { generateWithOllama, listOllamaModels } from "../src/ai/ollama.mjs";

const item = { name: "Camping tent", category: "Outdoor & travel", condition: "Excellent", replacementValue: 250, area: "Bishan" };
const prices = { daily: 9, weekly: 41, monthly: 126, deposit: 75, currency: "SGD" };

test("lists installed local models", async () => {
  const models = await listOllamaModels({ fetchImpl: async () => ({ ok: true, json: async () => ({ models: [{ name: "llama3.2:latest" }] }) }) });
  assert.deepEqual(models, ["llama3.2:latest"]);
});

test("keeps calculated prices when the model writes listing copy", async () => {
  const listing = await generateWithOllama(item, prices, {
    model: "llama3.2:latest",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ response: JSON.stringify({ title: "Tent for rent", description: "Ready for a trip.", handoverChecklist: ["Inspect", "Photograph", "Return on time"], prices: { daily: 1 } }) })
    })
  });
  assert.equal(listing.prices.daily, 9);
  assert.equal(listing.handoverChecklist.length, 3);
});

test("rejects malformed model output", async () => {
  await assert.rejects(generateWithOllama(item, prices, {
    fetchImpl: async () => ({ ok: true, json: async () => ({ response: JSON.stringify({ title: "Tent", description: "Ready", handoverChecklist: [] }) }) })
  }), /invalid listing/);
});

