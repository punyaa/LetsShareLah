import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateWithOllama, listOllamaModels } from "./ai/ollama.mjs";
import { draftListing, suggestedPrices, validateItem } from "./core/listing.mjs";
import { AREAS, CATEGORY_DISPLAY, SEED_LISTINGS, validatePublishedListing } from "./core/catalog.mjs";
import { createMemoryStore, createMongoStore } from "./store.mjs";
import { ownerAccessAllowed } from "./owner-access.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const port = Number(process.env.PORT ?? 3000);
const production = process.env.NODE_ENV === "production";
const ownerAccessCode = process.env.OWNER_ACCESS_CODE ?? "";
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("PORT must be a valid port number.");
if (production && !process.env.MONGODB_URI) throw new Error("Production requires MONGODB_URI so listings survive restarts.");
if (production && !ownerAccessCode) throw new Error("Production requires OWNER_ACCESS_CODE to prevent anonymous publishing.");
if (ownerAccessCode && ownerAccessCode.length < 16) throw new Error("OWNER_ACCESS_CODE must be at least 16 characters.");
const store = process.env.MONGODB_URI ? await createMongoStore(process.env.MONGODB_URI, process.env.MONGODB_DB) : createMemoryStore();

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
  const url = new URL(request.url, "http://localhost");
  if (request.method === "GET" && url.pathname === "/api/health") {
    try { await store.health(); return sendJson(response, 200, { status: "ok" }); }
    catch { return sendJson(response, 503, { status: "unavailable" }); }
  }
  if (request.method === "GET" && url.pathname === "/api/config") {
    return sendJson(response, 200, { ownerAccessRequired: Boolean(ownerAccessCode), storage: store.mode });
  }
  if (request.method === "POST" && url.pathname === "/api/owner-access") {
    if (!ownerAccessAllowed(request.headers.authorization, ownerAccessCode)) return sendJson(response, 403, { error: "Invalid owner access code." });
    return sendJson(response, 200, { allowed: true });
  }
  if (request.method === "GET" && url.pathname === "/api/models") {
    try {
      return sendJson(response, 200, { available: true, models: await listOllamaModels() });
    } catch {
      return sendJson(response, 200, { available: false, models: [] });
    }
  }
  if (request.method === "GET" && url.pathname === "/api/catalog") {
    try { return sendJson(response, 200, { areas: AREAS, categories: CATEGORY_DISPLAY, listings: [...await store.list(), ...SEED_LISTINGS] }); }
    catch { return sendJson(response, 503, { error: "Catalog temporarily unavailable." }); }
  }
  if (request.method === "POST" && url.pathname === "/api/listings") {
    if (!ownerAccessAllowed(request.headers.authorization, ownerAccessCode)) return sendJson(response, 403, { error: "Owner access required." });
    try {
      const listing = validatePublishedListing(await readJson(request));
      const category = CATEGORY_DISPLAY.find((entry) => entry.name === listing.category);
      const published = await store.publish({ ...listing, icon: category.icon, featured: false, sample: false });
      return sendJson(response, 201, { listing: published });
    } catch (error) {
      if (error instanceof SyntaxError || /must|Choose/.test(error?.message ?? "")) return sendJson(response, 400, { error: error.message });
      return sendJson(response, 503, { error: "Could not save listing. Please try again." });
    }
  }
  if (request.method === "POST" && url.pathname === "/api/listings/draft") {
    if (!ownerAccessAllowed(request.headers.authorization, ownerAccessCode)) return sendJson(response, 403, { error: "Owner access required." });
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

const host = process.env.HOST ?? (production ? "0.0.0.0" : "127.0.0.1");
server.listen(port, host, () => console.log(`LetsShareLah listening on ${host}:${port} (${store.mode} storage)`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(async () => { await store.close(); process.exit(0); }));

