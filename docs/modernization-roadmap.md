# Modernization Roadmap

## Overview

This document is the living source of truth for the long-term modernization of `dg-llm-evals`.

The sequencing is intentional:

1. Introduce TypeScript and shared domain/API types.
2. Extract state management and data-fetching boundaries.
3. Break up the workspace sections monolith.
4. Unify the design system and remove remaining CSS Modules.
5. Migrate to the Next.js App Router last.

Current overall phase: **Phase 4**

## Phase Summary

| Phase | Status | Objective | Depends On | Exit Criteria |
| --- | --- | --- | --- | --- |
| Phase 1: TypeScript and shared contracts | Done | Add compiler safety and canonical shared types | None | TS config exists, shared types exist, workspace/domain path compiles, roadmap updated |
| Phase 2: State and data boundaries | Done | Extract orchestration and fetch/persistence concerns out of the UI surface | Phase 1 | Typed actions/services/selectors replace wide UI-owned orchestration |
| Phase 3: Break up `workspace-sections.js` | Done | Split the monolith into feature-scoped components | Phase 2 | Feature sections consume explicit typed props instead of a broad workspace contract |
| Phase 4: Design system unification | Not started | Remove CSS Modules and standardize Tailwind/shadcn/ui usage | Phase 3 | No active CSS Module dependencies remain |
| Phase 5: App Router migration | Not started | Move to `app/` after architecture and UI are stable | Phase 4 | Main flows run under App Router with behavior parity |

## Phase 1

**Status:** Done

**Objective:** Add TypeScript infrastructure, shared domain/API contracts, and typed boundaries for the main workspace path without changing runtime behavior.

**Why now:** Structural refactors on `workspace-sections.js` and `useWorkspaceState` are high risk without compiler feedback.

**Planned changes**

- Add `tsconfig.json`, `next-env.d.ts`, TS dependencies, and a `typecheck` script.
- Create shared domain, API, and workspace contract modules.
- Convert smaller pure lib modules to `.ts`.
- Add typed declarations or typed wrappers for larger JS modules.
- Migrate API handlers to `.ts` so request and response payloads are explicit.

**Interfaces/types affected**

- Shared domain types in `lib/types/domain.ts`
- Shared API payloads in `lib/types/api.ts`
- Shared workspace surface in `lib/types/workspace.ts`
- Explicit `useWorkspaceState` return type and section prop contracts

**Acceptance criteria**

- TypeScript is configured as the compiler source of truth.
- Shared domain and API contract modules exist and are reused by typed runtime code.
- The workspace/domain path has explicit contracts instead of implicit object bags.
- The roadmap reflects what is complete, what is deferred, and the exact next task.

**Checklist**

- [x] Create living roadmap doc
- [x] Add TypeScript config and dependency updates
- [x] Create shared domain/API/workspace type modules
- [x] Convert smaller pure library modules to `.ts`
- [x] Add typed store and runner boundaries
- [x] Migrate API routes to `.ts`
- [x] Type the main workspace entry path
- [x] Run `npm install`, `npm run typecheck`, `npm run lint`, and `npm run build`
- [ ] Perform manual workspace QA on playground, batches, history, settings, and source-pool flows
- [x] Decide whether `lib/workspace.js` and `components/workspace-sections.js` should be directly converted in Phase 1 or remain declaration-backed compatibility shims until Phase 2

**Discovered during execution**

- `workspace-sections.js` is 1600+ lines and not a good candidate for a full rewrite inside the same pass as TS setup.
- `lib/workspace.js` owns a wide orchestration surface that will need a dedicated Phase 2 extraction.
- Two CSS Modules remain: `components/drawer-shell.module.css` and `components/library-drawer.module.css`.
- The safest Phase 1 approach was to type the large JS workspace modules via explicit declaration contracts while converting the smaller pure domain/orchestration modules to `.ts`.
- Next.js automatically updated `tsconfig.json` to use `jsx: react-jsx`.
- `lib/workspace.js` was replaced in Phase 2 with a real typed `lib/workspace.ts`; `components/workspace-sections.js` was intentionally deferred to Phase 3.

**Carry-forward risks**

- The current workspace object is still broad even after typing; narrowing it further should happen in Phase 2.
- Store payload shapes are partially inferred from persistence adapters and may need normalization cleanup once Phase 2 starts.
- `components/workspace-sections.js` was still a large JS implementation at the end of Phase 1 and became the main structural target for Phase 3.

**Next session start point**

Run manual QA on the main workspace flows as a carry-forward verification task, then continue Phase 2 extraction work only if a new state/data seam is still mixed into `lib/workspace`.

## Phase 2

**Status:** Done

**Objective:** Extract state, data fetching, persistence, and derived selectors out of the workspace UI surface.

**Why now:** `useWorkspaceState` currently coordinates browser persistence, API requests, normalization, and view data, which blocks safe component decomposition.

**Planned changes**

- Split `useWorkspaceState` into typed services, actions, selectors, and UI state.
- Move API access and persistence logic behind stable adapters.
- Introduce feature-oriented workspace boundaries for playground, batches, history, and settings.

**Interfaces/types affected**

- `WorkspaceState`
- Typed workspace actions and service contracts
- Feature-specific view model types

**Acceptance criteria**

- UI components no longer own fetch/persistence logic.
- Derived view data comes from typed selectors instead of component-local ad hoc shaping.

**Checklist**

- [x] Extract fetch and persistence helpers from `lib/workspace`
- [x] Create typed action layer for user operations
- [x] Create typed selectors for history, counts, and model availability
- [x] Narrow feature view-model contracts
- [x] Extract typed browser persistence and theme helpers from `lib/workspace`
- [x] Extract typed API client helpers from `lib/workspace`
- [x] Extract typed selectors for run filtering, selected run, and save-state comparisons
- [x] Replace `lib/workspace.js` with `lib/workspace.ts` wired through those boundaries

**Discovered during execution**

- The most effective first Phase 2 cut was not a state-library change; it was separating browser persistence, API access, and derived selectors from the hook.
- The `workspace` return surface is still broad internally even though Phase 2 introduced narrower view models for the UI.
- Direct UI splitting should wait until per-feature view models exist in front of the section components.
- Per-feature typed adapters now sit between `useWorkspaceState` and the section entry points, so pages no longer spread the full workspace bag directly into every section.
- The main workspace hook now delegates user operations to a dedicated typed action module, leaving the hook focused on state, effects, and composition.
- Shared workspace stats, source-pool summaries, and settings model-availability state now come from typed selectors instead of inline UI calculations.

**Carry-forward risks**

- `useWorkspaceState` is now better bounded, but it still coordinates feature state for all sections in one hook.
- `components/workspace-sections.js` still contains multiple features in one file even though its public entry contracts are now narrowed per feature.
- Manual UI regression coverage is still needed because the Phase 2 refactor preserved behavior by structure, not by automated UI tests.

**Next session start point**

Read this document, then start Phase 3 with the playground section while keeping manual workspace QA on the near-term verification list.

## Phase 3

**Status:** Done

**Objective:** Break up `workspace-sections.js` into typed, feature-scoped components after the workspace contract is stable.

**Why now:** Splitting before Phase 2 would only create several smaller god components that still depend on the same oversized state object.

**Planned changes**

- Split by feature area: playground, batches, history, settings, and shared UI primitives.
- Replace spread workspace props with explicit feature contracts.
- Keep presentational components free of fetching/storage concerns.

**Interfaces/types affected**

- Section prop interfaces
- Feature view models

**Acceptance criteria**

- `workspace-sections.js` no longer exists as the monolith.
- No section depends on the old broad workspace bag.

**Checklist**

- [x] Create feature containers
- [x] Extract shared primitives only where reuse is real
- [x] Delete or retire the monolithic section file

**Discovered during execution**

- The existing typed view-model layer from Phase 2 was sufficient for the split, so no additional workspace contract work was needed before extraction.
- A small shared primitives/helpers layer was enough; most of the previous file content was feature-local and did not need further abstraction.
- Direct feature names such as `playground.js`, `batches.js`, `history.js`, and `settings.js` read better than repeating `-section` inside a `workspace-sections/` folder.

**Carry-forward risks**

- Manual QA across playground, batches, history, and settings is still recommended because this phase was primarily structural and verified by lint/typecheck rather than full browser interaction.

**Next session start point**

Start Phase 4 by replacing the remaining CSS Modules and consolidating the section styling approach around Tailwind/shadcn primitives.

## Phase 4

**Status:** Not started

**Objective:** Standardize the UI system on Tailwind utility classes and shadcn/ui, removing the remaining CSS Modules.

**Why now:** Styling cleanup should happen after the component and state structure stop moving.

**Planned changes**

- Remove the remaining CSS Modules.
- Unify drawer, list, table, field, and section patterns on Tailwind/shadcn.
- Reduce overlapping custom styling patterns.

**Interfaces/types affected**

- Shared visual component contracts only.

**Acceptance criteria**

- No active `.module.css` imports remain in the workspace experience.
- Shared UI patterns are visually consistent across the product.

**Checklist**

- [ ] Replace drawer shell module styles
- [ ] Replace library drawer module styles
- [ ] Audit repeated form and table patterns

**Discovered during execution**

- None yet.

**Carry-forward risks**

- None yet.

**Next session start point**

Start with the drawer components and shared section shells.

## Phase 5

**Status:** Not started

**Objective:** Migrate the app from the Pages Router to the App Router after types, state boundaries, and UI structure are already stable.

**Why now:** Framework migration should be isolated from architecture and design changes.

**Planned changes**

- Move page entry points to `app/`.
- Move API routes to App Router handlers when ready.
- Preserve existing typed request/response contracts.

**Interfaces/types affected**

- Route handler entry points
- Page-level data-loading interfaces

**Acceptance criteria**

- Main flows run under the App Router.
- Behavior remains equivalent to the Pages Router baseline.

**Checklist**

- [ ] Migrate page entrypoints
- [ ] Migrate route handlers
- [ ] Validate navigation and data-loading parity

**Discovered during execution**

- None yet.

**Carry-forward risks**

- None yet.

**Next session start point**

Begin only after Phases 1 through 4 are complete.

## Decision Log

- 2026-04-14: TypeScript is the first major modernization step because structural refactors on the current workspace surface need compiler safety.
- 2026-04-14: State and data boundaries come before breaking up `workspace-sections.js`.
- 2026-04-14: App Router migration remains last to avoid combining framework migration with architecture and styling changes.
- 2026-04-14: Phase 2 will use extracted browser/API/selector modules before considering any external state library.
- 2026-04-14: Phase 3 should keep only a minimal shared section-primitives layer and otherwise split by feature file.
- 2026-04-14: Files inside `components/workspace-sections/` should use direct feature names, while shared files should be named by role such as `section-primitives` and `section-helpers`.

## Discovered Issues

- The app is still on the Pages Router.
- Manual browser QA still has not been rerun after the Phase 3 section split.
- `lib/workspace.js` mixes UI state, network requests, persistence, and derived data.
- Two CSS Modules remain in active use.

## Session Handoff

- Read this file first in every future session.
- Verified in this session: `npm run typecheck` and `npm run lint` succeeded after the Phase 3 split.
- Phase 1 is complete from a compiler and contract perspective. Manual UI QA remains a recommended regression check, but it no longer blocks the architecture sequence.
- Phase 3 progress in this session: `components/workspace-sections.js` was replaced by feature-scoped files under `components/workspace-sections/`, using direct feature names plus `section-primitives` and `section-helpers` for the shared layer.
- Next recommended task: begin Phase 4 by removing `drawer-shell.module.css` and `library-drawer.module.css`, then standardize the remaining workspace styling patterns.
- Update `Status`, `Checklist`, `Discovered during execution`, `Decision Log`, and this section before ending each session.

## Completion Log

- 2026-04-14: Roadmap document created and Phase 1 started.
- 2026-04-14: Added TypeScript infrastructure, shared domain/API/workspace contracts, converted smaller domain modules plus store/runner/API boundaries to TypeScript, and verified typecheck/lint/build.
- 2026-04-14: Extracted browser persistence, API client, and selector boundaries from `lib/workspace`, and replaced the old workspace JS implementation with typed `lib/workspace.ts`.
- 2026-04-14: Split `components/workspace-sections.js` into feature-scoped files with explicit typed props, added shared section primitives/helpers, and removed the monolithic section module.
