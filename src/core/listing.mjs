export const ALLOWED_CATEGORIES = new Set([
  "Outdoor & travel",
  "Events & parties",
  "Tools & DIY",
  "Baby & kids"
]);

export function validateItem(input) {
  const item = {
    name: String(input?.name ?? "").trim(),
    category: String(input?.category ?? "").trim(),
    condition: String(input?.condition ?? "").trim(),
    replacementValue: Number(input?.replacementValue),
    area: String(input?.area ?? "").trim()
  };

  if (item.name.length < 3 || item.name.length > 80) {
    throw new Error("Item name must be 3 to 80 characters.");
  }
  if (!ALLOWED_CATEGORIES.has(item.category)) {
    throw new Error("Choose a supported category.");
  }
  if (item.condition.length < 3 || item.condition.length > 200) {
    throw new Error("Condition must be 3 to 200 characters.");
  }
  if (!Number.isFinite(item.replacementValue) || item.replacementValue <= 0 || item.replacementValue > 100000) {
    throw new Error("Replacement value must be between S$0 and S$100,000.");
  }
  if (item.area.length < 2 || item.area.length > 80) {
    throw new Error("Enter an MRT station or neighbourhood, not a street address.");
  }
  return item;
}

export function suggestedPrices(item) {
  const condition = item.condition.toLowerCase();
  const factor = condition.includes("new") || condition.includes("excellent") ? 1 : condition.includes("fair") ? 0.7 : 0.85;
  const daily = Math.max(2, Math.round(item.replacementValue * 0.035 * factor));
  const weekly = Math.round(daily * 4.5);
  const monthly = Math.round(daily * 14);
  const deposit = Math.round(item.replacementValue * 0.3);
  return { daily, weekly, monthly, deposit, currency: "SGD" };
}

export function draftListing(item, prices) {
  return {
    title: `Rent ${item.name} near ${item.area}`,
    description: `${item.name} available for short term rental near ${item.area}. Condition: ${item.condition}. Confirm availability and inspect the item together at handover.`,
    handoverChecklist: [
      "Confirm item and included accessories",
      "Photograph visible condition at pickup",
      "Agree on return date and location"
    ],
    prices
  };
}

