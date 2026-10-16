export const AREAS = Object.freeze({
  Bishan: { lat: 1.3510, lon: 103.8481 },
  Bugis: { lat: 1.3009, lon: 103.8558 },
  Clementi: { lat: 1.3151, lon: 103.7652 },
  "Jurong East": { lat: 1.3331, lon: 103.7422 },
  "Paya Lebar": { lat: 1.3181, lon: 103.8931 },
  Queenstown: { lat: 1.2940, lon: 103.7864 },
  Tampines: { lat: 1.3530, lon: 103.9452 },
  Woodlands: { lat: 1.4360, lon: 103.7864 }
});

export const CATEGORY_DISPLAY = Object.freeze([
  { name: "Outdoor & travel", icon: "⛺", short: "Outdoor" },
  { name: "Events & parties", icon: "🎉", short: "Events" },
  { name: "Tools & DIY", icon: "🛠️", short: "Tools" },
  { name: "Baby & kids", icon: "🧸", short: "Baby & kids" },
  { name: "Electronics", icon: "📷", short: "Electronics" },
  { name: "Home & living", icon: "🪴", short: "Home" }
]);

export const SEED_LISTINGS = Object.freeze([
  { id: "sample-1", title: "Fujifilm mirrorless camera kit", description: "A lightweight camera kit for weekend shoots and special occasions. Includes battery, charger and carry pouch. Please inspect together at pickup.", category: "Electronics", area: "Bishan", condition: "Excellent", price: 28, owner: "Jamie", icon: "📷", featured: true },
  { id: "sample-2", title: "4-person camping tent", description: "Easy-to-pitch tent for a quick getaway. Clean and complete with pegs, poles and carry bag.", category: "Outdoor & travel", area: "Clementi", condition: "Good", price: 12, owner: "Mei", icon: "⛺", featured: true },
  { id: "sample-3", title: "Cordless drill & bit set", description: "Great for small home projects. Battery and bit set included; please return fully charged.", category: "Tools & DIY", area: "Queenstown", condition: "Good", price: 9, owner: "Arif", icon: "🛠️" },
  { id: "sample-4", title: "Portable projector for movie night", description: "Compact projector with HDMI cable and remote. Perfect for a gathering or presentation.", category: "Electronics", area: "Bugis", condition: "Excellent", price: 22, owner: "Nadia", icon: "📽️" },
  { id: "sample-5", title: "Folding stroller", description: "Convenient stroller for visiting family and day trips. Cleaned after every use.", category: "Baby & kids", area: "Tampines", condition: "Good", price: 15, owner: "Siti", icon: "🛒" },
  { id: "sample-6", title: "Party speaker with microphone", description: "Portable speaker and wireless mic for celebrations. Charger included.", category: "Events & parties", area: "Paya Lebar", condition: "Excellent", price: 18, owner: "Daniel", icon: "🎤" },
  { id: "sample-7", title: "Picnic set for four", description: "Basket, mat and reusable tableware for a relaxed outdoor afternoon.", category: "Outdoor & travel", area: "Woodlands", condition: "Good", price: 10, owner: "Alicia", icon: "🧺" },
  { id: "sample-8", title: "Steam cleaner for home", description: "Handy steamer for a deep clean without buying another appliance. Includes attachments.", category: "Home & living", area: "Jurong East", condition: "Good", price: 17, owner: "Wei", icon: "🧽" }
]);

export function distanceKm(from, to) {
  if (!from || !to) return null;
  const radius = 6371;
  const radians = (degrees) => degrees * Math.PI / 180;
  const lat = radians(to.lat - from.lat);
  const lon = radians(to.lon - from.lon);
  const a = Math.sin(lat / 2) ** 2 + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function validatePublishedListing(input) {
  const listing = {
    title: String(input?.title ?? "").trim(),
    description: String(input?.description ?? "").trim(),
    category: String(input?.category ?? "").trim(),
    area: String(input?.area ?? "").trim(),
    condition: String(input?.condition ?? "").trim(),
    price: Number(input?.price),
    owner: String(input?.owner ?? "").trim()
  };
  if (listing.title.length < 3 || listing.title.length > 120) throw new Error("Title must be 3 to 120 characters.");
  if (listing.description.length < 10 || listing.description.length > 1200) throw new Error("Description must be 10 to 1200 characters.");
  if (!CATEGORY_DISPLAY.some((category) => category.name === listing.category)) throw new Error("Choose a supported category.");
  if (!Object.hasOwn(AREAS, listing.area)) throw new Error("Choose a listed pickup neighbourhood.");
  if (listing.condition.length < 3 || listing.condition.length > 200) throw new Error("Condition must be 3 to 200 characters.");
  if (!Number.isFinite(listing.price) || listing.price < 1 || listing.price > 10000) throw new Error("Daily price must be between S$1 and S$10,000.");
  if (listing.owner.length < 2 || listing.owner.length > 40) throw new Error("Owner name must be 2 to 40 characters.");
  if (input?.handoverChecklist !== undefined) {
    if (!Array.isArray(input.handoverChecklist) || input.handoverChecklist.length !== 3 || input.handoverChecklist.some((step) => typeof step !== "string" || !step.trim() || step.length > 160)) {
      throw new Error("Handover checklist must contain three short steps.");
    }
    listing.handoverChecklist = input.handoverChecklist.map((step) => step.trim());
  }
  return listing;
}
