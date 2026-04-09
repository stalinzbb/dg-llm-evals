# DG Fundraiser LLM Eval Tool Reference

This document explains how the project works end to end so it can be used later as a quick operational reference.

## 1. What This Project Is

This is an internal evaluation tool for fundraiser cause-statement generation.

The app lets a user:

- create or save fundraiser test cases
- create or save prompt templates
- run a single generation
- compare multiple model and prompt variants side by side
- run a batch across many saved/imported cases
- review saved run history
- score outputs with a human rubric
- export cases and run results to CSV

The app is built as a single Next.js application with:

- a browser UI in `pages/index.js`
- backend API routes in `pages/api/*`
- shared business logic in `lib/*`
- optional Supabase persistence
- local JSON fallback persistence for development and demos
- optional password gate for shared internal access

## 2. High-Level Architecture

### Runtime shape

This project is not split into separate deployable backend and frontend services.

It is one Next.js app that contains:

- frontend pages and components
- server-side API endpoints
- server-side generation and persistence logic

That means the browser talks to same-origin API routes such as:

- `/api/bootstrap`
- `/api/generate`
- `/api/batch-runs`
- `/api/test-cases`
- `/api/prompt-templates`
- `/api/runs`
- `/api/ratings`
- `/api/auth/login`

### Main execution flow

1. The browser loads `/`.
2. The page requests `/api/bootstrap`.
3. The backend loads test cases, prompt templates, and run history from Supabase if configured.
4. If Supabase is unavailable or not configured, the backend falls back to `.runtime/dg-llm-evals.json`.
5. The user edits the current fundraiser case, prompt recipe, generation settings, and variants in the UI.
6. When the user clicks generate, the app sends the payload to `/api/generate` or `/api/batch-runs`.
7. The backend normalizes input, creates a run record, executes each variant, stores each result, marks the run completed, and returns the hydrated run.
8. The UI adds that run to History and lets the user score outputs.
9. Ratings are saved through `/api/ratings` and attached to the run.

## 3. Backend

## 3.1 Backend entry points

The backend is implemented with Next.js Pages Router API routes.

### `pages/api/bootstrap.js`

Purpose:

- initial app load
- returns all data needed to render the app

Response includes:

- `storageMode`
- `testCases`
- `promptTemplates`
- `runs`
- `openRouterConfigured`
- `gateEnabled`

### `pages/api/generate.js`

Purpose:

- execute a playground run

Behavior:

- only accepts `POST`
- calls `executePlaygroundRun()` from `lib/runner.js`
- returns one completed run with its stored results

### `pages/api/batch-runs.js`

Purpose:

- execute a batch run across many cases

Behavior:

- only accepts `POST`
- calls `executeBatchRun()` from `lib/runner.js`

### `pages/api/test-cases.js`

Purpose:

- list and save fundraiser cases

Behavior:

- `GET`: returns saved test cases
- `POST`: saves one or many entries, then returns refreshed test cases

### `pages/api/prompt-templates.js`

Purpose:

- list and save prompt templates

Behavior:

- `GET`: returns saved prompt templates
- `POST`: saves one template, then returns refreshed templates

### `pages/api/runs/index.js`

Purpose:

- fetch all runs

Behavior:

- returns `runs` from the bootstrap payload

### `pages/api/runs/[id].js`

Purpose:

- fetch one run by ID

Behavior:

- returns 404 if the run does not exist

### `pages/api/ratings.js`

Purpose:

- save human evaluation data for a generated result

Behavior:

- only accepts `POST`
- saves the rating
- reloads the run
- returns the updated run

### `pages/api/auth/login.js`

Purpose:

- handle the simple password gate

Behavior:

- only accepts `POST`
- if `APP_ACCESS_PASSWORD` is not configured, returns success without enforcing auth
- if the password matches, sets `dg_eval_gate` cookie
- cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production

## 3.2 Core backend libraries

### `lib/runner.js`

This is the main orchestration layer.

It is responsible for:

- normalizing inputs
- creating the run record
- resolving which prompt template each variant should use
- merging shared generation settings with per-variant overrides
- calling the LLM provider
- constructing full output text
- calculating token, latency, and character metrics
- storing each variant result
- marking the run as completed

There are two main public functions:

- `executePlaygroundRun(payload)`
- `executeBatchRun(payload)`

Important behavior:

- runs are processed sequentially, not in parallel
- each variant is wrapped in `runVariantSafely()`
- a failed variant is still saved as a result record with `error`
- the entire run still completes unless the higher-level run setup itself fails

### `lib/openrouter.js`

This file owns the LLM call behavior.

Responsibilities:

- estimate token counts when necessary
- estimate output cost from static model pricing
- call OpenRouter when `OPENROUTER_API_KEY` exists
- return a deterministic mock-style fallback response when the API key is absent

Important production detail:

- the app still functions without OpenRouter credentials
- in that case it generates a synthetic cause statement from the test case data
- this makes the app demo-friendly but not a real model evaluation environment

### `lib/prompt.js`

This file owns normalization and prompt composition.

Responsibilities:

- normalize test cases
- normalize prompt templates
- normalize generation settings
- normalize variants
- render the final user prompt text
- build the final fundraiser message from prefix + generated cause statement + suffix
- compute character counts

Important rules:

- only allowed cause tags are persisted
- cause tags are capped at 3
- blank or missing settings fall back to defaults
- variants can point at the current prompt draft or a saved prompt template by ID

### `lib/store.js`

This is the storage abstraction layer.

Responsibilities:

- call Supabase-backed methods first
- if Supabase is unavailable or throws, fall back to the local JSON store

This design means the rest of the app does not need to know which persistence backend is active.

### `lib/local-store.js`

This is the local development persistence backend.

Data file:

- `.runtime/dg-llm-evals.json`

Responsibilities:

- create the runtime file if missing
- seed a default case and default prompt template
- read and write all app data as JSON
- hydrate runs with their related results and ratings

Stored collections:

- `testCases`
- `promptTemplates`
- `runs`
- `variantResults`
- `ratings`

### `lib/supabase-store.js`

This is the hosted persistence backend.

Behavior:

- only active when both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` exist
- seeds a default case and prompt template if the related tables are empty
- stores full app records largely inside `payload jsonb` columns
- hydrates run responses by joining `runs`, `variant_results`, and `ratings`

### `lib/constants.js`

Contains:

- cause tag options
- supported model list
- per-model pricing used for estimate display
- default test case
- default prompt template
- default generation settings
- default rubric

### `lib/csv.js`

Purpose:

- import and export CSV without adding a dependency

Functions:

- `toCsv(rows)`
- `parseCsv(text)`

## 3.3 Authentication / access control

The project uses a lightweight shared-password gate rather than full user accounts.

Implementation:

- request interception is handled in `proxy.js`
- `/login`, Next static assets, favicons, and `/api/auth/login` are allowed without the cookie
- all other routes are redirected to `/login` when the cookie is missing or incorrect
- `/api/bootstrap` is excluded from the matcher in `proxy.js`

What this means:

- this is not role-based auth
- there is no user identity model
- access is team-shared and environment-password-based

This is adequate for a small internal tool, but it is not a full security model.

## 4. Frontend

## 4.1 Frontend structure

The frontend is a Pages Router UI centered in `pages/index.js`.

Supporting files:

- `components/result-card.js`
- `pages/login.js`
- `pages/_app.js`
- `pages/_document.js`
- `styles/globals.css`

### `pages/index.js`

This is the main application shell and holds most client state.

Major state areas:

- active tab
- playground mode (`single` or `compare`)
- saved test cases
- saved prompt templates
- run history
- storage mode
- platform status flags
- current case draft
- current prompt draft
- shared generation settings
- variant matrix
- selected run
- search term for history
- selected batch case IDs
- imported CSV cases
- theme

Important UI behavior:

- bootstrap data is loaded on first render
- theme is read from `localStorage`
- history search uses `useDeferredValue`
- navigation to History after generation uses `startTransition`

## 4.2 Main UI sections

### Playground

Purpose:

- run one output quickly
- or compare multiple variants for the same case

Main editable areas:

- fundraiser case
- message recipe
- shared generation settings
- variant definitions

User actions:

- save case
- save prompt template
- add/remove variants
- generate
- export saved cases

### Batch Runs

Purpose:

- run the same variant matrix across many cases

Input sources:

- saved case library
- staged imported CSV rows

User actions:

- select saved cases
- import CSV
- save imported cases to the library
- run batch
- export run rows

Important rule:

- batch runs reuse the same variant matrix configured in Playground

### History

Purpose:

- review completed runs and outputs
- search historical runs
- export result rows
- score outputs

Capabilities:

- search by run ID, case, model, or variant label
- inspect one selected run
- export one selected run as CSV
- save ratings per result

## 4.3 Result review UX

`components/result-card.js` handles display and rating of one generated result.

It supports:

- switching between cause-only view and full-message view
- showing model/provider metadata
- showing prompt, completion, total cost-related stats and latency
- entering rubric scores
- writing review notes
- marking one output as preferred

Rubric dimensions:

- clarity
- specificity
- fundraiser relevance
- emotional resonance
- brand safety
- overall

## 4.4 Styling and design system

Styling is custom CSS in `styles/globals.css`.

Notable design choices:

- CSS variables for theme tokens
- light and dark themes via `data-theme`
- custom typography using `Space Grotesk` and `IBM Plex Sans`
- glassmorphism-like panels with blur and soft borders
- responsive grid layout for navigation + content

There is no external UI component library in use.

## 5. Database

## 5.1 Persistence modes

The app supports two persistence modes.

### Mode A: Supabase

Used when both of these environment variables are present:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Mode B: Local JSON fallback

Used when Supabase is not configured or if the Supabase call fails.

Data file:

- `.runtime/dg-llm-evals.json`

Operational consequence:

- local development is easy
- production can run without a database, but history will only persist inside the server filesystem
- filesystem persistence is usually not reliable on serverless platforms, so Supabase should be treated as the real production database

## 5.2 Supabase schema

Defined in `supabase/schema.sql`.

Tables:

### `test_cases`

Columns:

- `id`
- `name`
- `payload jsonb`
- `created_at`
- `updated_at`

Purpose:

- stores normalized fundraiser case definitions

### `prompt_templates`

Columns:

- `id`
- `name`
- `is_active`
- `payload jsonb`
- `created_at`
- `updated_at`

Purpose:

- stores reusable prompt recipes

### `runs`

Columns:

- `id`
- `mode`
- `label`
- `status`
- `payload jsonb`
- `created_at`
- `updated_at`

Purpose:

- one top-level experiment execution

### `variant_results`

Columns:

- `id`
- `run_id`
- `model`
- `variant_label`
- `payload jsonb`
- `created_at`

Purpose:

- one generated output within a run

### `ratings`

Columns:

- `id`
- `run_id`
- `variant_result_id`
- `comparison_key`
- `payload jsonb`
- `created_at`
- `updated_at`

Purpose:

- stores human evaluation metadata for outputs

## 5.3 Data model notes

This schema is intentionally flexible because most rich data is stored inside `payload jsonb`.

Advantages:

- easier iteration on app fields
- fewer schema migrations while the tool evolves
- the UI payloads can be stored almost directly

Tradeoffs:

- weaker relational enforcement for nested fields
- querying analytics from SQL is harder
- indexing fine-grained JSON fields would require extra work later

This is a good fit for an internal iteration-stage tool.

## 5.4 Seed behavior

Both storage backends automatically ensure at least one default test case and one default prompt template exist.

Default IDs:

- `case_default`
- `prompt_default`

This prevents the UI from starting empty.

## 6. Production / Deployment

## 6.1 Runtime assumptions

The project is written to be Vercel-friendly.

Evidence:

- Next.js API routes for backend behavior
- no custom long-running server
- no Docker or separate worker setup
- README explicitly calls out Vercel-friendly routes

There is no explicit `vercel.json`, Dockerfile, or separate infra definition in the repo.

So the intended deployment model is likely:

- deploy the Next.js app on Vercel
- configure environment variables there
- use Supabase as the persistent store

## 6.2 Required and optional environment variables

Based on `.env.example` and the code:

### Required for real LLM generations

- `OPENROUTER_API_KEY`

### Optional but important

- `APP_ACCESS_PASSWORD`
- `OPENROUTER_REFERER`
- `OPENROUTER_TITLE`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 6.3 Production behavior by configuration

### If OpenRouter is configured

- real requests are sent to OpenRouter
- token usage, latency, and estimated cost are captured

### If OpenRouter is not configured

- the app generates mock responses
- useful for demos and UI work
- not valid for real model evaluation

### If Supabase is configured

- data persists in the hosted database
- suitable for production use

### If Supabase is not configured

- data goes to `.runtime/dg-llm-evals.json`
- this is acceptable locally
- this is not reliable for serverless production deployments

### If `APP_ACCESS_PASSWORD` is configured

- the shared password gate is enabled

### If `APP_ACCESS_PASSWORD` is missing

- the app is openly accessible

## 6.4 Recommended production setup

For a real internal deployment, the practical setup should be:

- deploy on Vercel
- configure all OpenRouter environment variables
- configure Supabase URL and service role key
- configure `APP_ACCESS_PASSWORD`
- apply `supabase/schema.sql` before first production use

This gives:

- persistent run history
- real LLM execution
- lightweight access control

## 6.5 Operational limitations

These are important for future maintenance.

### 1. Password gate is intentionally simple

It is not full authentication or authorization.

### 2. Supabase uses service-role access server-side

That is acceptable for trusted server-only API routes, but the key must remain server-side only.

### 3. Local JSON fallback should not be treated as a production database

It exists for convenience and resilience, not serious hosted persistence.

### 4. Runs execute sequentially

Large batch runs may become slow as case count or variant count grows.

### 5. There is no job queue or background worker

All execution happens in request/response API flow.

This is fine for small internal usage, but can become a limitation for longer runs.

### 6. There are no automated tests in the current repo

There is no visible test suite, CI config, or typed contract layer.

Future changes should be made carefully around:

- prompt normalization
- storage hydration
- CSV import/export behavior
- run result shape
- rating payload shape

## 7. File Map

### Core app files

- `pages/index.js`: main application UI
- `pages/login.js`: password-gated login page
- `components/result-card.js`: generated result viewer + rubric scorer
- `styles/globals.css`: global theme and component styling

### Backend routes

- `pages/api/bootstrap.js`
- `pages/api/generate.js`
- `pages/api/batch-runs.js`
- `pages/api/test-cases.js`
- `pages/api/prompt-templates.js`
- `pages/api/runs/index.js`
- `pages/api/runs/[id].js`
- `pages/api/ratings.js`
- `pages/api/auth/login.js`

### Shared logic

- `lib/runner.js`: run orchestration
- `lib/openrouter.js`: model provider integration
- `lib/prompt.js`: normalization and prompt rendering
- `lib/store.js`: storage abstraction and fallback
- `lib/local-store.js`: filesystem persistence
- `lib/supabase-store.js`: Supabase persistence
- `lib/constants.js`: defaults, model list, pricing, rubric
- `lib/csv.js`: CSV parsing/export

### Infrastructure and config

- `supabase/schema.sql`: database schema
- `.env.example`: environment contract
- `next.config.mjs`: Next.js config
- `proxy.js`: password gate middleware/proxy behavior
- `README.md`: short setup/readme

## 8. Suggested Future Improvements

If this project grows, the highest-value upgrades would be:

1. Add automated tests for normalization, storage hydration, and CSV parsing.
2. Add stronger auth if the app will be shared beyond a small internal team.
3. Add background job handling for large batch runs.
4. Add explicit deployment documentation for Vercel + Supabase setup.
5. Add analytics/reporting views over ratings and model performance.
6. Add schema versioning or migrations if payload structures become more complex.

## 9. Short Practical Summary

If someone needs to understand the project quickly:

- frontend and backend live in one Next.js app
- the main page drives everything from `pages/index.js`
- generation is handled by API routes that call `lib/runner.js`
- OpenRouter is the real model provider, with mock fallback when no key exists
- Supabase is the real production database when configured
- local JSON storage is the fallback for development/demos
- ratings and history are first-class features, not an afterthought
- the production model is best understood as: Vercel-hosted internal tool + Supabase + OpenRouter + optional shared-password gate
