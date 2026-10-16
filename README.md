# LetsShareLah

**Rent more, own less.** LetsShareLah is a Singapore neighbourhood rental marketplace prototype. Browse items, search by category or keyword, filter by neighbourhood, and see approximate distances. Owners can create a listing with private, local AI writing help.

> Status: local demo. The catalog begins with fictional sample listings. Owner listings are published only to the running server's memory and disappear when it restarts. Demo role profiles are **not real accounts**. There are no bookings, messages, payments, insurance or escrow. Price suggestions are estimates, not market data.

## Why build it?

People often own equipment they use only occasionally. Renting nearby items can save money and space, while owners can make side income. LetsShareLah makes discovery straightforward and helps owners write a clear first listing. A local model avoids per-listing AI API charges and keeps draft details on the user's computer.

## What works today

- Browse a fictional Singapore rental catalog by category, keyword and neighbourhood.
- Optionally use browser location permission to see demo items within 12 km; coordinates stay in the browser.
- Open item detail cards showing condition, pickup neighbourhood, daily rate and owner name.
- Enter renter or owner demo mode without creating an account.
- As an owner, enter an item, condition, replacement value and pickup neighbourhood, then edit and publish a demo listing.
- Receive daily, weekly, monthly and deposit suggestions in SGD. A local Ollama model drafts the title and description; the handover checklist uses a standard, deterministic template. The UI selects a local model automatically, preferring Qwen3.5 0.8B when installed.
- Fall back to a clearly labelled template draft if local AI is unavailable.
- Run without cloud accounts, API keys, or application dependencies.

AI drafts the listing copy for owner review. A deterministic pricing formula supplies transparent starting estimates and prevents a model response from silently changing prices. Owners can edit the daily rent before publishing. The formula is a prototype assumption, not market data.

## Quick start

You need Node.js 20 or newer.

```bash
git clone https://github.com/punyaa/LetsShareLah.git
cd LetsShareLah
npm start
```

Open <http://localhost:3000>. Browsing and the owner demo flow work without installing a model.

For the local AI flow, install [Ollama](https://ollama.com/) and an open-weight model, then start the app:

```bash
ollama pull qwen3.5:0.8b
npm start
```

The UI does not expose a model picker to renters. The server uses `OLLAMA_MODEL` if set, otherwise prefers an installed `qwen3.5:0.8b`, then another installed local model. If model generation fails, it returns a template draft and labels it as such. No API key is needed. The server only connects to Ollama on this computer. [Qwen3.5 0.8B](https://huggingface.co/Qwen/Qwen3.5-0.8B) publishes its weights under Apache 2.0; model licenses differ, so check the exact model you choose.

## Development

```bash
npm run dev
npm test
```

The local server exposes:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Basic server health |
| `GET /api/models` | List installed local Ollama models |
| `GET /api/catalog` | Get categories, neighbourhood coordinates and demo listings |
| `POST /api/listings/draft` | Generate prices and a local AI listing |
| `POST /api/listings/draft?demo=1` | Generate a sample listing without Ollama |
| `POST /api/listings` | Publish a validated listing to server memory |

Example request:

```bash
curl -X POST 'http://localhost:3000/api/listings/draft?demo=1' \
  -H 'content-type: application/json' \
  -d '{"name":"4-person camping tent","category":"Outdoor & travel","condition":"Excellent; used twice","replacementValue":250,"area":"Bishan"}'
```

## Repository map

```text
public/              Browser interface
src/ai/              Local model integration
src/core/            Input validation, pricing, sample listing
src/server.mjs       HTTP routes and static file server
test/                Core behaviour tests
docs/roadmap.md      Challenge and product roadmap
```

## Challenge fit

**Hacktoberfest 2026 Week 2 — Side Hustle:** a local open-weight model is used to prepare listings for a potential rental side hustle. A valid entry requires a new project built within that challenge's window and a DEV submission. This repository alone is not a submission or a badge.

**Amazon Developer Hackathon:** the current prototype is a base for a future simulated Alexa+ workflow. It does **not yet** meet the Amazon primary-track requirement. See [the roadmap](docs/roadmap.md) for the work still needed.

If a related university group project informed the idea, its code, diagrams, and report text should be reused only with the appropriate contributors' permission. This repository's implementation is written as a separate prototype.

## Contributing

Small improvements are welcome. Please open an issue describing the user problem before a large change. Keep examples fictional, avoid personal addresses in test data, and run `npm test` before proposing a change.

## License

MIT. See [LICENSE](LICENSE).

