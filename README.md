# LLM Eval Builder

Build and run evals for any LLM-generated content — invite messages, essays, blog posts, product copy, anything. Define reusable prompt templates with `{{variable}}` tokens, feed the variables manually, randomly from saved datasets, or in bulk from a CSV, and compare outputs across models side by side.

## Features

- **Eval Builder** — define an eval as a set of variables, one or more prompt templates using `{{variable}}` tokens, and a custom scoring rubric. Templates are validated live (unknown variables are flagged) with a resolved-value preview.
- **Variable sourcing** — each variable can be entered manually, sampled randomly from a saved **dataset** (reusable value list, fillable by paste or CSV column import), or supplied per-row from a CSV in batch runs. Inline overrides like `{{tone|random}}` are supported; `\{{` escapes a literal brace.
- **Playground** — fill an eval's variables in a dynamic form, run against one model or several variants side by side, with per-variant temperature/top-p/token/seed overrides.
- **Batches** — upload a CSV where each row is one run. Columns auto-map to variables (with a manual mapping UI); every row runs through every model variant.
- **History & ratings** — every run is saved with its resolved variable values, token/cost/latency metrics, and a rating form generated from the eval's rubric.
- **Bring your own key** — paste your OpenRouter API key in Settings. It's stored only in your browser's localStorage and attached per-request; it is never persisted server-side. One key unlocks all supported models (GPT, Claude, Gemini, and more).
- **Zero-config demo mode** — no key, no database? The app stores data in a local JSON file and returns mock output so you can explore the whole flow.

## Quickstart

Requires Node.js ≥ 20.

```bash
npm install
npm run dev
```

That's it — open http://localhost:3000. Data persists to `.runtime/dg-llm-evals.json` and model calls return mock output until a key is configured.

To call real models, either paste an [OpenRouter](https://openrouter.ai) key in **Settings → OpenRouter API Key** (per-browser), or set `OPENROUTER_API_KEY` server-side (see `.env.example`).

## Hosted persistence (Supabase, optional)

1. Create a [Supabase](https://supabase.com) project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor (idempotent — safe to re-run after upgrades).
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### Free-tier keep-alive

Supabase pauses free-tier projects after ~1 week of inactivity. This repo ships a GitHub Actions workflow ([`.github/workflows/keepalive.yml`](.github/workflows/keepalive.yml)) that pings `/api/keepalive` twice a week. Set the `KEEPALIVE_URL` repository variable to `https://<your-deployment>/api/keepalive` to enable it.

## Access gate (optional)

Set `APP_ACCESS_PASSWORD` to require a shared password. Leave it unset to run without a login page.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests (template engine, variable resolution) |
| `npm run lint` / `npm run typecheck` | Static checks |

## Architecture notes

- Next.js (Pages Router) + React + TypeScript + Tailwind/shadcn.
- Storage is a dual backend: Supabase when configured, local JSON otherwise (`lib/store.ts`).
- Template engine: `lib/template.ts` (parse/validate/render). Variable resolution: `lib/resolve-variables.ts` (manual/random/CSV, seeded RNG for reproducible sampling).
- Model calls go through OpenRouter (`lib/openrouter.ts`); a BYOK key arrives via the `x-openrouter-key` header and falls back to the server env key, then mock mode.

## License

[MIT](LICENSE)
