const form = document.querySelector("#listing-form");
const result = document.querySelector("#result");
const empty = document.querySelector("#empty");
const error = document.querySelector("#error");
const mode = document.querySelector("#mode");
const button = form.querySelector("button");
const modelStatus = document.querySelector("#model-status");
const modelField = document.querySelector("#model-field");
const modelSelect = document.querySelector("#model-select");
const demoCheckbox = form.elements.demo;

async function loadModels() {
  try {
    const response = await fetch("/api/models");
    const payload = await response.json();
    if (payload.available && payload.models.length) {
      modelSelect.replaceChildren();
      for (const name of payload.models) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        modelSelect.append(option);
      }
      modelField.hidden = false;
      modelStatus.textContent = `${payload.models.length} local AI model${payload.models.length === 1 ? "" : "s"} ready. Your item details stay on this computer.`;
      return;
    }
  } catch { /* The sample draft remains usable offline. */ }
  modelStatus.textContent = "No local AI model detected. Install Ollama and a model, or use the sample draft preview.";
  demoCheckbox.checked = true;
}

loadModels();

function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const demo = data.get("demo") === "on";
  const input = Object.fromEntries(data.entries());
  delete input.demo;
  error.hidden = true;
  button.disabled = true;
  button.textContent = "Creating…";
  try {
    const response = await fetch(`/api/listings/draft${demo ? "?demo=1" : ""}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Could not create listing.");
    const listing = payload.listing;
    result.replaceChildren();
    result.append(element("h3", listing.title));
    result.append(element("p", listing.description, "description"));
    const prices = element("div", "", "prices");
    for (const [label, key] of [["Per day", "daily"], ["Per week", "weekly"], ["Per month", "monthly"], ["Suggested deposit", "deposit"]]) {
      const card = element("div", "", "price-card");
      card.append(element("span", label));
      card.append(element("strong", `S$${listing.prices[key]}`));
      prices.append(card);
    }
    result.append(prices);
    result.append(element("h4", "Handover checklist"));
    const list = element("ul", "");
    for (const item of listing.handoverChecklist) list.append(element("li", item));
    result.append(list);
    mode.textContent = payload.mode === "demo" ? "Sample draft" : `AI draft · ${payload.model}`;
    empty.hidden = true;
    result.hidden = false;
  } catch (caught) {
    error.textContent = caught.message;
    error.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = "Create my listing ↗";
  }
});

