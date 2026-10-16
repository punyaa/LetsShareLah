import { draftListing } from "../core/listing.mjs";

const systemPrompt = `You write clear, accurate Singapore peer-to-peer rental listings. Return only a JSON object with keys title and description. Never invent item features, brand, warranties, or guarantees. Describe only the item details supplied. Do not include exact addresses. Prices are calculated by the app and must not be changed. Avoid claims about escrow or insurance.`;

function ollamaUrl(path, baseUrl) {
  const url = new URL(baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434");
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
    throw new Error("For privacy, Ollama must run on this computer.");
  }
  return new URL(path, url);
}

export async function listOllamaModels(options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(ollamaUrl("/api/tags", options.baseUrl), { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`Local AI service returned HTTP ${response.status}.`);
  const payload = await response.json();
  return Array.isArray(payload.models)
    ? payload.models.map((model) => model.name).filter((name) => typeof name === "string")
    : [];
}

export async function generateWithOllama(item, prices, options = {}) {
  const model = options.model ?? process.env.OLLAMA_MODEL ?? "llama3.2:latest";
  if (!/^[A-Za-z0-9._:-]{1,80}$/.test(model)) throw new Error("Choose a valid local model.");
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(ollamaUrl("/api/generate", options.baseUrl), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" }
        },
        required: ["title", "description"]
      },
      think: false,
      options: { num_predict: 300, temperature: 0.2 },
      prompt: `${systemPrompt}\n\nItem: ${JSON.stringify(item)}\nSuggested prices in SGD: ${JSON.stringify(prices)}`
    }),
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`Local AI model returned HTTP ${response.status}. Check that the model is installed.`);
  const payload = await response.json();
  const parsed = JSON.parse(payload.response);
  if (typeof parsed.title !== "string" || !parsed.title.trim() || typeof parsed.description !== "string" || !parsed.description.trim()) {
    throw new Error("Local AI model returned an invalid listing.");
  }
  return {
    title: parsed.title.trim().slice(0, 120),
    description: parsed.description.trim().slice(0, 1200),
    handoverChecklist: draftListing(item, prices).handoverChecklist,
    prices
  };
}

