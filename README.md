# DG Fundraiser LLM Eval Tool

Internal evaluator for fundraiser cause-statement generation. It supports:

- single-use generation for a real organization
- side-by-side comparison across models and prompt variants
- batch runs across saved cases or imported CSV rows
- saved history with human rubric scoring
- OpenRouter-backed inference with a mock fallback when no API key is configured

## Stack

- Next.js
- Vercel-friendly API routes
- Supabase for hosted persistence when configured
- local JSON fallback for development and demos

## Environment

Copy `.env.example` to `.env.local` and set what you need.

Required for live generation:

- `OPENROUTER_API_KEY`

Optional:

- `APP_ACCESS_PASSWORD` for a shared password gate
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

If Supabase is not configured, the app stores data in `.runtime/dg-llm-evals.json`.

## Supabase

Run the schema in [supabase/schema.sql](/Users/stalinthomas/side_projects/dg-llm-evals/supabase/schema.sql) before enabling Supabase credentials.

## Local Development

This repo requires Node 18.18+.

Your current machine was on Node 16 during implementation, so if you do not want to switch your global Node immediately, use a temporary Node 20 runtime:

```bash
npx -y node@20 ./node_modules/next/dist/bin/next dev
```

If you have Node 18+ locally, the normal workflow is:

```bash
npm install
npm run dev
```

## CSV Import Format

Headers:

```text
name,organizationName,teamName,organizationType,teamActivity,teamAffiliation,causeTags,messageLength
```

Use `|` between cause tags in `causeTags`.

## Notes

- `Single output` mode is intended for trying one real organization quickly.
- `Comparison` mode runs multiple variant rows on one shared fundraiser case.
- `Batch runs` reuse the same variant matrix defined in the Playground tab.
- Ratings are stored per generated result with a fixed rubric and optional preferred-output flag.
