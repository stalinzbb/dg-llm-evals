# Old UI Rebuild Baseline

This document preserves the target for the later UI return after the current multi-page workspace is stabilized.

## Baseline

- Pre-refactor single-page UI baseline commit: `ed1582b`
- Refactor entry point that moved the app to the multi-page workspace shell: `5de7c55`
- Current stabilization target keeps the multi-page routes and shared state/store layer intact.

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

## Constraints

- Do not revert the stabilized store or API behavior just to match the old UI
- Do not reintroduce browser-only workspace persistence as the primary state store
- Keep app-specific wrappers thin so the UI remains replaceable later
