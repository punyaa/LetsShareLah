const $ = (selector) => document.querySelector(selector);
const categoryClasses = {
  "Outdoor & travel": "visual-outdoor", "Events & parties": "visual-events",
  "Tools & DIY": "visual-tools", "Baby & kids": "visual-baby",
  Electronics: "visual-electronics", "Home & living": "visual-home"
};
const state = { areas: {}, categories: [], listings: [], category: "all", query: "", location: null, account: null, pendingOwner: false, draft: null, ownerAccessRequired: false, ownerAccessCode: "", storage: "memory" };
const accountDialog = $("#account-dialog");
const listingDialog = $("#listing-dialog");
const detailDialog = $("#detail-dialog");
let toastTimer;

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
}

function distanceKm(from, to) {
  if (!from || !to) return null;
  const rad = (degrees) => degrees * Math.PI / 180;
  const lat = rad(to.lat - from.lat);
  const lon = rad(to.lon - from.lon);
  const a = Math.sin(lat / 2) ** 2 + Math.cos(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.sin(lon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function activeLocation() {
  const selected = $("#area-select").value;
  return selected === "all" ? state.location : state.areas[selected];
}

function formatDistance(km) {
  return km === null ? "" : km < 0.15 ? "In this neighbourhood" : `${km < 1 ? km.toFixed(1) : Math.round(km)} km away`;
}

function renderCategories() {
  const target = $("#category-list");
  target.replaceChildren();
  for (const category of state.categories) {
    const button = el("button", undefined, `category-card${state.category === category.name ? " active" : ""}`);
    button.type = "button";
    button.setAttribute("aria-pressed", String(state.category === category.name));
    button.append(el("span", category.icon, "category-icon"));
    const text = el("span");
    text.append(el("strong", category.short), el("small", "Explore rentals"));
    button.append(text);
    button.addEventListener("click", () => {
      state.category = state.category === category.name ? "all" : category.name;
      renderCategories();
      renderListings();
      $("#explore").scrollIntoView({ behavior: "smooth" });
    });
    target.append(button);
  }
}

function cardFor(listing, location) {
  const card = el("button", undefined, "listing-card");
  card.type = "button";
  card.setAttribute("aria-label", `View ${listing.title}, S$${listing.price} per day in ${listing.area}`);
  const visual = el("div", undefined, `listing-visual ${categoryClasses[listing.category] ?? "visual-home"}`);
  visual.append(el("span", listing.icon ?? "📦"));
  if (listing.featured || listing.sample === false) visual.append(el("small", listing.sample === false ? "New listing" : "Popular pick", "listing-badge"));
  const body = el("div", undefined, "listing-body");
  body.append(el("span", listing.category, "category-name"), el("h3", listing.title));
  const km = distanceKm(location, state.areas[listing.area]);
  body.append(el("div", `⌖ ${listing.area}${km === null ? "" : ` · ${formatDistance(km)}`}`, "listing-meta"));
  const bottom = el("div", undefined, "listing-bottom");
  const price = el("div");
  price.append(el("strong", `S$${listing.price}`), el("small", " / day"));
  bottom.append(price, el("span", `by ${listing.owner}`, "owner-name"));
  body.append(bottom);
  card.append(visual, body);
  card.addEventListener("click", () => openDetail(listing, km));
  return card;
}

function renderFilters() {
  const target = $("#active-filters");
  target.replaceChildren();
  const all = el("button", "All items", `filter-pill${state.category === "all" ? " active" : ""}`);
  all.type = "button";
  all.addEventListener("click", () => { state.category = "all"; renderCategories(); renderListings(); });
  target.append(all);
  if (state.category !== "all") {
    const chosen = el("button", `${state.category} ×`, "filter-pill active");
    chosen.type = "button";
    chosen.addEventListener("click", () => { state.category = "all"; renderCategories(); renderListings(); });
    target.append(chosen);
  }
  if (state.query) {
    const query = el("button", `“${state.query}” ×`, "filter-pill");
    query.type = "button";
    query.addEventListener("click", () => { state.query = ""; $("#search-input").value = ""; renderListings(); });
    target.append(query);
  }
}

function renderListings() {
  const location = activeLocation();
  const query = state.query.toLowerCase();
  let listings = state.listings.filter((listing) => {
    if (state.category !== "all" && listing.category !== state.category) return false;
    if (query && !`${listing.title} ${listing.description} ${listing.category} ${listing.area}`.toLowerCase().includes(query)) return false;
    return !location || distanceKm(location, state.areas[listing.area]) <= 12;
  });
  const sort = $("#sort-select").value;
  if (sort === "price") listings.sort((a, b) => a.price - b.price);
  else if (sort === "new") listings.sort((a, b) => (a.sample === false ? -1 : 0) - (b.sample === false ? -1 : 0));
  else if (location) listings.sort((a, b) => distanceKm(location, state.areas[a.area]) - distanceKm(location, state.areas[b.area]));
  const target = $("#listing-grid");
  target.replaceChildren(...listings.map((listing) => cardFor(listing, location)));
  $("#results-count").textContent = `${listings.length} item${listings.length === 1 ? "" : "s"}${location ? " within 12 km" : " available"}`;
  $("#empty-state").hidden = listings.length > 0;
  renderFilters();
}

function openDetail(listing, km) {
  const target = $("#detail-content");
  target.replaceChildren();
  const visual = el("div", undefined, `detail-visual ${categoryClasses[listing.category] ?? "visual-home"}`);
  visual.append(el("span", listing.icon ?? "📦"));
  const info = el("div", undefined, "detail-info");
  info.append(el("span", listing.category.toUpperCase(), "section-kicker"), el("h2", listing.title));
  const price = el("div", undefined, "detail-price");
  price.append(el("span", `S$${listing.price}`), el("small", " / day"));
  info.append(price);
  const facts = el("div", undefined, "detail-facts");
  facts.append(el("span", `⌖ Pickup near ${listing.area}`), el("span", `Condition: ${listing.condition}`));
  if (km !== null) facts.append(el("span", formatDistance(km)));
  info.append(facts, el("p", listing.description), el("p", `Listed by ${listing.owner}. Confirm availability, item condition and the return plan directly before any exchange.`));
  if (listing.handoverChecklist?.length) {
    info.append(el("strong", "Suggested handover checklist"));
    const checklist = el("ul");
    for (const step of listing.handoverChecklist) checklist.append(el("li", step));
    info.append(checklist);
  }
  const action = el("button", "Rental requests coming soon", "button button-dark detail-action");
  action.type = "button";
  action.disabled = true;
  info.append(action, el("p", "Demo listing only. No booking or payment will be made.", "fine-print"));
  target.append(visual, info);
  detailDialog.showModal();
}

function fillCatalogSelectors() {
  for (const area of Object.keys(state.areas)) {
    const option = el("option", area);
    option.value = area;
    $("#area-select").append(option);
    const listingOption = el("option", area);
    listingOption.value = area;
    $("#listing-area").append(listingOption);
  }
  for (const category of state.categories) {
    const option = el("option", category.name);
    option.value = category.name;
    $("#listing-category").append(option);
  }
}

async function loadCatalog() {
  try {
    const [configResponse, response] = await Promise.all([fetch("/api/config"), fetch("/api/catalog")]);
    if (configResponse.ok) {
      const config = await configResponse.json();
      state.ownerAccessRequired = config.ownerAccessRequired;
      state.storage = config.storage;
      updateOwnerCodeField();
    }
    if (!response.ok) throw new Error("Catalog unavailable");
    const catalog = await response.json();
    state.areas = catalog.areas;
    state.categories = catalog.categories;
    state.listings = catalog.listings;
    fillCatalogSelectors();
    renderCategories();
    renderListings();
  } catch {
    $("#results-count").textContent = "Could not load items. Refresh to try again.";
  }
}

function updateAccountButton() {
  $("#account-button").textContent = state.account ? `${state.account.name} · ${state.account.role}` : "Log in";
}

function openAccount(role = "renter", pendingOwner = false) {
  state.pendingOwner = pendingOwner;
  const form = $("#account-form");
  form.elements.role.value = role;
  form.elements.displayName.value = state.account?.name ?? "";
  form.elements.ownerCode.value = "";
  $("#account-error").hidden = true;
  updateOwnerCodeField();
  accountDialog.showModal();
}

function updateOwnerCodeField() {
  const ownerSelected = $("#account-form").elements.role.value === "owner";
  const required = ownerSelected && state.ownerAccessRequired;
  $("#owner-code-label").hidden = !required;
  $("#account-form").elements.ownerCode.required = required;
}

function ownerHeaders() {
  return { "content-type": "application/json", ...(state.ownerAccessCode ? { authorization: `Bearer ${state.ownerAccessCode}` } : {}) };
}

function openOwnerFlow() {
  if (!state.account || state.account.role !== "owner") return openAccount("owner", true);
  $("#listing-error").hidden = true;
  $("#draft-panel").hidden = true;
  $("#listing-form").hidden = false;
  listingDialog.showModal();
}

$("#account-button").addEventListener("click", () => openAccount(state.account?.role ?? "renter"));
$("#close-account-dialog").addEventListener("click", () => accountDialog.close());
for (const selector of ["#list-button", "#hero-list-button", "#bottom-list-button", "#footer-list-button"]) $(selector).addEventListener("click", openOwnerFlow);
$("#account-form").addEventListener("change", updateOwnerCodeField);
$("#account-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const name = form.elements.displayName.value.trim();
  if (name.length < 2) return form.elements.displayName.setCustomValidity("Enter at least two characters.");
  const role = form.elements.role.value;
  const code = role === "owner" ? form.elements.ownerCode.value.trim() : "";
  $("#account-error").hidden = true;
  if (role === "owner") {
    try {
      const response = await fetch("/api/owner-access", { method: "POST", headers: code ? { authorization: `Bearer ${code}` } : {} });
      if (!response.ok) throw new Error("That owner invite code is not valid.");
    } catch (error) {
      $("#account-error").textContent = error.message ?? "Could not verify owner access.";
      $("#account-error").hidden = false;
      return;
    }
  }
  state.ownerAccessCode = code;
  state.account = { name, role };
  updateAccountButton();
  accountDialog.close();
  if (state.pendingOwner && state.account.role === "owner") openOwnerFlow();
  else showToast(`Welcome, ${name}. You’re exploring as a ${state.account.role} in demo mode.`);
  state.pendingOwner = false;
});
$("#account-form").elements.displayName.addEventListener("input", (event) => event.target.setCustomValidity(""));
$("#close-listing-dialog").addEventListener("click", () => listingDialog.close());
$("#close-detail-dialog").addEventListener("click", () => detailDialog.close());
$("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  state.query = $("#search-input").value.trim();
  renderListings();
  $("#explore").scrollIntoView({ behavior: "smooth" });
});
$("#area-select").addEventListener("change", () => { state.location = null; renderListings(); });
$("#sort-select").addEventListener("change", renderListings);
$("#clear-filters").addEventListener("click", () => {
  state.category = "all";
  state.query = "";
  state.location = null;
  $("#area-select").value = "all";
  $("#search-input").value = "";
  $("#location-message").textContent = "";
  renderCategories();
  renderListings();
});
$("#near-me-button").addEventListener("click", () => {
  if (!navigator.geolocation) return void ($("#location-message").textContent = "Location is not supported here. Choose a neighbourhood instead.");
  $("#location-message").textContent = "Checking your location…";
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    const position = { lat: coords.latitude, lon: coords.longitude };
    const inSingapore = position.lat > 1.15 && position.lat < 1.48 && position.lon > 103.6 && position.lon < 104.1;
    if (!inSingapore) {
      $("#location-message").textContent = "You appear outside our Singapore demo area. Choose a neighbourhood instead.";
      return;
    }
    state.location = position;
    $("#area-select").value = "all";
    $("#location-message").textContent = "Showing items within 12 km of you. Your coordinates stay in this browser.";
    renderListings();
  }, () => { $("#location-message").textContent = "Location not shared. Choose a neighbourhood instead."; }, { timeout: 8000, maximumAge: 60000 });
});

$("#listing-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $("#draft-button");
  const error = $("#listing-error");
  error.hidden = true;
  button.disabled = true;
  button.textContent = "Preparing draft…";
  try {
    const input = Object.fromEntries(new FormData(form).entries());
    const response = await fetch("/api/listings/draft", { method: "POST", headers: ownerHeaders(), body: JSON.stringify(input) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Could not create draft.");
    state.draft = { item: payload.item, listing: payload.listing };
    $("#draft-title").value = payload.listing.title;
    $("#draft-description").value = payload.listing.description;
    $("#draft-daily-price").value = payload.listing.prices.daily;
    $("#draft-prices").replaceChildren(
      el("span", `S$${payload.listing.prices.weekly} / week`),
      el("span", `S$${payload.listing.prices.monthly} / month`),
      el("span", `S$${payload.listing.prices.deposit} suggested deposit`)
    );
    $("#draft-checklist").replaceChildren(...payload.listing.handoverChecklist.map((step) => el("li", step)));
    $("#draft-mode").textContent = payload.mode === "local-ai" ? `Listing copy drafted with local ${payload.model}; checklist is a standard template. Please check every detail before publishing.` : "Simple template draft. Local AI was unavailable; please edit the wording before publishing.";
    form.hidden = true;
    $("#draft-panel").hidden = false;
  } catch (caught) {
    error.textContent = caught.message;
    error.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "Create draft →";
  }
});
$("#edit-basics-button").addEventListener("click", () => { $("#draft-panel").hidden = true; $("#listing-form").hidden = false; });
$("#publish-button").addEventListener("click", async () => {
  if (!state.draft || !state.account) return;
  const button = $("#publish-button");
  const error = $("#listing-error");
  error.hidden = true;
  button.disabled = true;
  try {
    const listing = {
      title: $("#draft-title").value.trim(), description: $("#draft-description").value.trim(),
      category: state.draft.item.category, area: state.draft.item.area,
      condition: state.draft.item.condition, price: Number($("#draft-daily-price").value),
      owner: state.account.name, handoverChecklist: state.draft.listing.handoverChecklist
    };
    const response = await fetch("/api/listings", { method: "POST", headers: ownerHeaders(), body: JSON.stringify(listing) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Could not publish listing.");
    state.listings.unshift(payload.listing);
    state.category = "all";
    state.query = "";
    state.location = null;
    $("#search-input").value = "";
    $("#area-select").value = listing.area;
    $("#sort-select").value = "new";
    renderCategories();
    renderListings();
    listingDialog.close();
    $("#listing-form").reset();
    $("#explore").scrollIntoView({ behavior: "smooth" });
    showToast(state.storage === "atlas" ? "Your demo listing was saved to MongoDB Atlas." : "Your demo listing is live in this server session; it will disappear when the server restarts.");
  } catch (caught) {
    error.textContent = caught.message;
    error.hidden = false;
  } finally { button.disabled = false; }
});

loadCatalog();
