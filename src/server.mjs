import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { generateWithOllama, listOllamaModels } from "./ai/ollama.mjs";
import { draftListing, suggestedPrices, validateItem } from "./core/listing.mjs";
import { AREAS, CATEGORY_DISPLAY, SEED_LISTINGS, validatePublishedListing } from "./core/catalog.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const port = Number(process.env.PORT ?? 3000);
const publishedListings = [];

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 20000) throw new Error("Request is too large.");
  }
  return JSON.parse(body);
}

function sendJson(response, status, value) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  if (request.method === "GET" && url.pathname === "/api/health") {
    return sendJson(response, 200, { status: "ok" });
  }
  if (request.method === "GET" && url.pathname === "/api/models") {
    try {
      return sendJson(response, 200, { available: true, models: await listOllamaModels() });
    } catch {
      return sendJson(response, 200, { available: false, models: [] });
    }
  }
  if (request.method === "GET" && url.pathname === "/api/catalog") {
    return sendJson(response, 200, { areas: AREAS, categories: CATEGORY_DISPLAY, listings: [...publishedListings, ...SEED_LISTINGS] });
  }
  if (request.method === "POST" && url.pathname === "/api/listings") {
    try {
      const listing = validatePublishedListing(await readJson(request));
      const category = CATEGORY_DISPLAY.find((entry) => entry.name === listing.category);
      const published = { ...listing, id: randomUUID(), icon: category.icon, featured: false, sample: false };
      publishedListings.unshift(published);
      return sendJson(response, 201, { listing: published });
    } catch (error) {
      return sendJson(response, 400, { error: error instanceof Error ? error.message : "Could not publish listing." });
    }
  }
  if (request.method === "POST" && url.pathname === "/api/listings/draft") {
    try {
      const input = await readJson(request);
      const item = validateItem(input);
      const prices = suggestedPrices(item);
      const demo = url.searchParams.get("demo") === "1";
      if (demo) return sendJson(response, 200, { item, listing: draftListing(item, prices), mode: "demo" });
      try {
        const installed = await listOllamaModels();
        const model = process.env.OLLAMA_MODEL ?? installed.find((name) => name.startsWith("qwen3.5:0.8b")) ?? installed[0];
        if (!model) throw new Error("No local model installed.");
        const listing = await generateWithOllama(item, prices, { model });
        return sendJson(response, 200, { item, listing, mode: "local-ai", model });
      } catch {
        return sendJson(response, 200, { item, listing: draftListing(item, prices), mode: "demo" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not draft listing.";
      const status = error instanceof SyntaxError || message.includes("must") || message.includes("Choose") || message.includes("Enter") ? 400 : 502;
      return sendJson(response, status, { error: message });
    }
  }
  const assets = new Map([["/", ["index.html", "text/html"]], ["/app.js", ["app.js", "text/javascript"]], ["/styles.css", ["styles.css", "text/css"]]]);
  const asset = request.method === "GET" ? assets.get(url.pathname) : undefined;
  if (asset) {
    try {
      const content = await readFile(join(root, asset[0]));
      response.writeHead(200, { "content-type": `${asset[1]}; charset=utf-8` });
      return response.end(content);
    } catch {
      return sendJson(response, 500, { error: "Could not load application." });
    }
  }
  return sendJson(response, 404, { error: "Not found." });
});

server.listen(port, "127.0.0.1", () => console.log(`LetsShareLah at http://localhost:${port}`));

