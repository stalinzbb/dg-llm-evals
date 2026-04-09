# Old UI Rebuild Baseline

This document started as the target for the UI return after the multi-page workspace stabilization.

It is now also the implementation record for the parity rebuild work that has been shipped on top of the stabilized backend and shared workspace store.

## Baseline

- Pre-refactor single-page UI baseline commit: `ed1582b`
- Refactor entry point that moved the app to the multi-page workspace shell: `5de7c55`
- Current shipped rebuild keeps the shared state/store layer intact and restores `/` as the canonical single-page workspace surface.

## Phase 2 Goal

Rebuild the old single-page tabbed experience with visual parity on top of the stabilized current backend and persistence layer.

This is not intended to be an exact code rollback. The later rebuild should reuse the current API and shared workspace state instead of restoring the old monolithic page implementation.

## Required Behaviors to Preserve

- Same-page navigation between Playground, Batch, and History
- Familiar visual hierarchy and action placement from the old UI
- Equivalent workflows for:
  - case editing and saving
  - prompt editing and saving
  - variant editing and generation
  - batch case selection and CSV import
  - history browsing and ratings

## Component Strategy

- Preferred UI foundation: `shadcn/ui`
- Primitive fallback when needed: Radix primitives
- Use reusable library components for tabs, cards, alerts, tables, badges, forms, toggles, separators, loading states, and dialogs/drawers
- Avoid bespoke replacements for standard UI primitives when a library component fits

## What Was Implemented

### Routing and workspace shell

- `/` now renders a unified single-page workspace again.
- The primary shell is query-driven with `?tab=playground|batches|history`.
- `pages/index.js` now server-loads the initial tab and renders a shared `WorkspaceHome` shell.
- `pages/batches.js` and `pages/history.js` were converted from standalone page implementations into compatibility redirects to `/?tab=batches` and `/?tab=history`.
- `pages/settings.js` remains separate and unchanged as the dedicated settings route.

### Shared state behavior

- The rebuild reuses `useWorkspaceState()` from `lib/workspace.js` rather than reviving the old monolithic page state.
- Tab switches now reuse the same loaded workspace state instead of re-running bootstrap on each route change.
- Playground generation now sends the user back to the History tab again inside the shared shell.
- Existing API routes and persistence behavior were preserved.

### UI foundation

- `shadcn/ui` was initialized in the project.
- Tailwind v4 support was added through:
  - `components.json`
  - `postcss.config.mjs`
  - updated `styles/globals.css`
- The first-pass shadcn primitives added to the repo are:
  - `button`
  - `tabs`
  - `card`
  - `alert`
  - `badge`
  - `input`
  - `textarea`
  - `select`
  - `table`
  - `dialog`
  - `drawer`
  - `separator`
  - `switch`
  - `skeleton`
  - `checkbox`
  - `label`
- New supporting dependencies were added for the shadcn/base-ui stack, including Tailwind/PostCSS packages and `vaul`.

### Theme and status handling

- Theme application now updates both `document.documentElement.dataset.theme` and the `.dark` class so shadcn components respond correctly.
- `pages/_document.js` was updated to initialize both theme mechanisms on first paint.
- `components/workspace-status.js` now uses shadcn `Alert` and `Skeleton` primitives for status and loading states.

## Current State

The rebuild is functional and shipped at the shell/routing/state-foundation level:

- same-page tab navigation between Playground, Batch, and History is restored
- direct links into Batch and History still work through redirects
- shared draft state, run history, batch staging, and save state now live under one workspace session on `/`
- the project has a working shadcn/Tailwind foundation for further UI conversion

## Remaining Gap Versus Full UI Parity

The current implementation is not a full component-by-component shadcn rewrite of the entire workspace body yet.

What is complete:

- route model parity
- single-page tabbed experience
- state/persistence preservation
- shadcn foundation and core primitives
- shadcn-based status/loading treatment

What is still partial:

- `components/workspace-sections.js` still carries the bulk of the existing section markup and styling
- the old multi-page shell was replaced as the primary UX, but not every inner form/table/drawer pattern has been migrated onto shadcn composition
- the visual result is workflow-first parity, not near-pixel parity with `ed1582b`

If a later pass is needed, the next logical step is to refactor the inner section components and supporting wrappers onto the new `components/ui/*` primitives incrementally without changing store or API behavior.

## Validation Completed

- `npm run lint`
- `npm run build`

Both passed after the rebuild changes.

## Constraints

- Do not revert the stabilized store or API behavior just to match the old UI
- Do not reintroduce browser-only workspace persistence as the primary state store
- Keep app-specific wrappers thin so the UI remains replaceable later
