import test from "node:test";
import assert from "node:assert/strict";
import { suggestedPrices, validateItem } from "../src/core/listing.mjs";

const item = { name: "Camping tent", category: "Outdoor & travel", condition: "Excellent; used twice", replacementValue: 250, area: "Bishan" };

test("validates a normal rental item", () => {
  assert.deepEqual(validateItem(item), item);
});

test("rejects an invalid category and replacement value", () => {
  assert.throws(() => validateItem({ ...item, category: "Other" }));
  assert.throws(() => validateItem({ ...item, replacementValue: -1 }));
});

test("gives a lower per-day rate for longer rentals", () => {
  const prices = suggestedPrices(item);
  assert.ok(prices.weekly / 7 < prices.daily);
  assert.ok(prices.monthly / 30 < prices.weekly / 7);
});

