import test from "node:test";
import assert from "node:assert/strict";
import { AREAS, distanceKm, SEED_LISTINGS, validatePublishedListing } from "../src/core/catalog.mjs";

test("catalog seed items have known Singapore neighbourhoods", () => {
  assert.ok(SEED_LISTINGS.length >= 6);
  for (const listing of SEED_LISTINGS) assert.ok(Object.hasOwn(AREAS, listing.area));
});

test("nearby distance is zero for the same location and positive elsewhere", () => {
  assert.equal(distanceKm(AREAS.Bishan, AREAS.Bishan), 0);
  assert.ok(distanceKm(AREAS.Bishan, AREAS.Tampines) > 5);
});

test("published listing validation accepts an item and rejects unknown areas", () => {
  const listing = { title: "Camera kit", description: "Camera and charger available for a weekend.", category: "Electronics", area: "Bishan", condition: "Excellent", price: 25, owner: "Alex" };
  assert.deepEqual(validatePublishedListing(listing), listing);
  assert.throws(() => validatePublishedListing({ ...listing, area: "Unknown" }));
  assert.throws(() => validatePublishedListing({ ...listing, handoverChecklist: ["Only one step"] }));
});
