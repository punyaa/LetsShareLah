# LetsShareLah

**Turn an unused item into a clear rental listing.** LetsShareLah helps someone in Singapore estimate rental prices, write an item description, and prepare a handover checklist. The current prototype runs locally and can use an open-weight model through Ollama. A built-in sample draft mode lets you explore the interface without installing a model.

> Status: early prototype. It does not publish listings, take bookings, process payments, or provide insurance or escrow. Price suggestions are simple estimates; the owner decides the final price.

## Why build it?

People often own equipment they use only occasionally. Listing it for rent can create side income, but deciding on a price and writing a trustworthy listing takes time. LetsShareLah makes that first step easier. A local model keeps item details on the user's computer and avoids per-listing AI API charges.

## What works today

- Enter an item, condition, replacement value, and nearby MRT station or neighbourhood.
- Receive daily, weekly, monthly, and deposit suggestions in SGD.
- Generate a listing title, description, and three-step handover checklist with a local Ollama model.
- Preview the workflow with a sample draft when no model is installed.
- Run without cloud accounts, API keys, or application dependencies.

The AI writes the listing. A deterministic pricing formula supplies transparent starting estimates and prevents a model response from silently changing prices. The formula is a prototype assumption, not market data.

## Quick start

You need Node.js 20 or newer.

```bash
git clone https://github.com/punyaa/LetsShareLah.git
cd LetsShareLah
npm start
```

Open <http://localhost:3000> and tick **Use sample draft** to test immediately.

For the local AI flow, install [Ollama](https://ollama.com/) and an open-weight model, then start the app:

```bash
ollama pull llama3.2
npm start
```

The browser lists installed Ollama models so you can choose one. The default is `llama3.2:latest` if no model is selected. Set `OLLAMA_MODEL` if your setup differs. No API key is needed. For privacy, the server only connects to Ollama on this computer.

## Development

```bash
npm run dev
npm test
```

The local server exposes:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Basic health and model configuration |
| `GET /api/models` | List installed local Ollama models |
| `POST /api/listings/draft` | Generate prices and a local AI listing |
| `POST /api/listings/draft?demo=1` | Generate a sample listing without Ollama |

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

