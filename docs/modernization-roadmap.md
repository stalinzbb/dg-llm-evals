# Modernization Roadmap

## Overview

This document is the living source of truth for the long-term modernization of `dg-llm-evals`.

The sequencing is intentional:

1. Introduce TypeScript and shared domain/API types.
2. Extract state management and data-fetching boundaries.
3. Break up the workspace sections monolith.
4. Unify the design system and remove remaining CSS Modules.
5. Migrate to the Next.js App Router last.

Current overall phase: **Phase 4.4**

## Phase Summary

| Phase | Status | Objective | Depends On | Exit Criteria |
| --- | --- | --- | --- | --- |
| Phase 1: TypeScript and shared contracts | Done | Add compiler safety and canonical shared types | None | TS config exists, shared types exist, workspace/domain path compiles, roadmap updated |
| Phase 2: State and data boundaries | Done | Extract orchestration and fetch/persistence concerns out of the UI surface | Phase 1 | Typed actions/services/selectors replace wide UI-owned orchestration |
| Phase 3: Break up `workspace-sections.js` | Done | Split the monolith into feature-scoped components | Phase 2 | Feature sections consume explicit typed props instead of a broad workspace contract |
| Phase 4: Design system unification | Not started | Remove dead CSS, consolidate tokens, standardize Tailwind/shadcn/ui | Phase 3 | Phase 4 chunk map complete; no CSS Modules, no dead CSS files, single token source of truth |
| Phase 4b: UI/UX polish | Not started | Interaction quality, feedback patterns, information density, and targeted usability improvements | Phase 4 | Phase 4b chunk map complete; core UX items addressed, manual QA passes |
| Phase 5: App Router migration | Not started | Move to `app/` after architecture and UI are stable | Phase 4b | Main flows run under App Router with behavior parity |

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

**Status:** In progress

**Objective:** Eliminate dead CSS, resolve the token conflict, remove CSS Modules, and slim globals.css by replacing hand-rolled patterns with shadcn/Tailwind equivalents.

**Why now:** Styling cleanup should happen after the component and state structure stop moving. The current state has three overlapping styling systems creating confusion and dead weight.

### Recommended execution order

| Sub-phase | Status | Priority | Scope | Why this comes next |
| --- | --- | --- | --- | --- |
| Phase 4.1: CSS foundation cleanup | Done | Highest | Delete dead CSS files, merge `tokens.css` + `base.css` into `globals.css`, reduce `_app` to a single stylesheet import | Safest structural wins; unblocks every later styling and UI pass |
| Phase 4.2: Globals reduction | In progress | High | Remove dead legacy classes from `globals.css` in audit batches | Still CSS-only work, and should happen immediately after the single-source-of-truth merge |
| Phase 4.3: Shared/component TS conversion | Done | High | Convert shared workspace shell/support components and low-risk pages to `.tsx` | Low-risk code structure work once styling inputs stabilize |
| Phase 4.4: Feature section TS conversion | Ready | Medium | Convert `settings`, `history`, `batches`, then `playground` to `.tsx` | Feature-owned work that benefits from the earlier shared/component conversion landing first |
| Phase 4.5: Token reconciliation follow-through | Deferred to late Phase 4b | Medium | Clean up remaining semantic token usage after the UI polish work exposes what still matters | Full token reconciliation is easier once the final component surfaces and feedback patterns settle |

### Phase 4 execution rule

- Only work one Phase 4 part at a time.
- Do not mix CSS cleanup and major UX changes in the same implementation pass.
- Mark a part in progress before starting it, and update the next recommended part when it lands.

### Current state audit

| File | Lines | Status |
| --- | --- | --- |
| `styles/globals.css` | 1452 | Active — massive monolith mixing tokens, resets, shadcn theme bridge, and ~900 lines of hand-rolled component classes |
| `styles/tokens.css` | 68 | Active — defines CSS variables that **conflict** with different values in `globals.css` for the same names (`--bg`, `--surface`, `--brand`, etc.) |
| `styles/base.css` | 123 | Active — resets and typography that overlap with both `globals.css` and Tailwind preflight |
| `styles/layout.css` | 239 | **Dead** — not imported anywhere; contains old topbar/sidebar/workspace-shell classes superseded by shadcn `Sidebar` |
| `components/drawer-shell.module.css` | 60 | **Dead** — `drawer-shell.js` was rewritten to use shadcn `Sheet`; module is never imported |
| `components/library-drawer.module.css` | 72 | **Dead** — `library-drawer.js` was rewritten to use Tailwind utilities; module is never imported |

### Organized sections

#### Phase 4.1: CSS foundation cleanup

- Delete `components/drawer-shell.module.css` (no imports exist).
- Delete `components/library-drawer.module.css` (no imports exist).
- Delete `styles/layout.css` (not imported in `_app.js` or anywhere else).

`tokens.css` and `globals.css` both define `:root` blocks with the same variable names but different values. Both are imported in `_app.js`. Since CSS cascade means `globals.css` wins (imported last), `tokens.css` values are silently overridden.

- Audit which token values are actually rendered (globals wins by import order).
- Merge the authoritative values into a single `:root` block in `globals.css`.
- Remove the `tokens.css` import from `_app.js` and delete the file.

`base.css` resets (`* { box-sizing }`, `body` styles, heading typography) overlap with globals and Tailwind preflight.

- Move the typography scale (`h1`–`h6`, `.brand-kicker`, `.brand-copy`) into globals.
- Remove resets that duplicate Tailwind preflight.
- Delete `base.css` and its import from `_app.js`.

Result: `_app.js` imports only `globals.css`.

#### Phase 4.2: Globals reduction

Many classes in `globals.css` are from the pre-shadcn layout and are no longer referenced by any component:

| Dead class category | Examples | Why dead |
| --- | --- | --- |
| Old layout grid | `.app-shell`, `.app-frame`, `.layout-grid`, `.nav-panel`, `.content-panel` | Replaced by shadcn `SidebarProvider` / `SidebarInset` |
| Old sidebar | `.sidebar-title`, `.sidebar-nav`, `.sidebar-toggle`, `.sidebar-link`, `.sidebar-summary`, `.sidebar-stat` | Replaced by shadcn `Sidebar` components |
| Old button variants | `.primary-button`, `.secondary-button`, `.tertiary-button`, `.danger-button`, `.ghost-button`, `.icon-button`, `.mode-button`, `.chip-button` | Replaced by shadcn `Button` with variant props |
| Old form patterns | `.field-group`, `.input-shell`, `.input-adornment`, `.toggle-field`, `.toggle-switch`, `.toggle-thumb` | Replaced by shadcn `Input`, `Label`, `Switch` and `section-primitives.js` |
| Old card patterns | `.panel-block`, `.variant-card`, `.result-card`, `.history-card`, `.rating-card`, `.meta-item` | Replaced by shadcn `Card` / `CardContent` |
| Old table | `table`, `th`, `td` global styles | Replaced by shadcn `Table` components |
| Old misc | `.search-input`, `.help-button`, `.tooltip`, `.message-toggle`, `.callout`, `.error-callout`, `.success-callout` | Replaced by shadcn `Input`, `Tooltip`, `Alert` |

- Grep each class name against `components/` and `pages/` to confirm zero references.
- Remove confirmed dead classes in batches, running visual QA after each batch.

Continue slimming `globals.css` until it contains only:

- The single `:root` / `[data-theme="dark"]` token block.
- The `@theme inline` shadcn bridge and `.dark` class.
- Tailwind base layer (`@layer base`).
- A small number of utility classes that genuinely have no shadcn equivalent (e.g., `.spinner` animation, `.toast-shell` positioning, `.auth-shell` / `.auth-card` layout for the login page).
- Responsive breakpoint overrides.

Target: reduce from ~1452 lines to under ~300 lines.

#### Phase 4.3: Shared/component TS conversion

Convert lower-risk shared files first:

- `section-primitives.js` → `section-primitives.tsx`
- `section-helpers.js` → `section-helpers.tsx`
- `result-card.js` → `result-card.tsx`
- `workspace-layout.js` → `workspace-layout.tsx`
- `workspace-page-header.js` → `workspace-page-header.tsx`
- `drawer-shell.js` → `drawer-shell.tsx`
- `library-drawer.js` → `library-drawer.tsx`
- `icons.js` → `icons.tsx`
- `workspace-status.js` → `workspace-status.tsx` (delete `.d.ts` shim)
- Page files: `_app.js` → `_app.tsx`, `_document.js` → `_document.tsx`, `login.js` → `login.tsx`

#### Phase 4.4: Feature section TS conversion

The workspace-sections are still `.js` despite having typed view-model contracts from Phase 2.

- `settings.js` → `settings.tsx`
- `history.js` → `history.tsx`
- `batches.js` → `batches.tsx`
- `playground.js` → `playground.tsx` (largest — do last)

#### Phase 4.5: Token reconciliation follow-through

- Revisit remaining semantic token aliases after Phase 4b UI work.
- Keep this late on purpose so we do not rename tokens before the final UI surface settles.

**Interfaces/types affected**

- CSS custom property contract (single source of truth after merge).
- Component file extensions (`.js` → `.tsx`).
- Section-primitive prop types become inline TypeScript instead of declaration shims.

**Acceptance criteria**

- No `.module.css` files exist in the project.
- No dead CSS files (`tokens.css`, `base.css`, `layout.css`) remain.
- `globals.css` is under 300 lines.
- All component and page files are `.tsx`.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.
- Visual QA confirms no regressions across playground, batches, history, settings, and login.

**Checklist**

- [x] Phase 4.1: CSS foundation cleanup
- [x] Delete dead CSS Module files (`drawer-shell.module.css`, `library-drawer.module.css`)
- [x] Delete dead `layout.css`
- [x] Resolve token conflict: merge `tokens.css` into `globals.css`, delete `tokens.css`
- [x] Merge `base.css` typography into `globals.css`, delete `base.css`
- [ ] Phase 4.2: Globals reduction
- [ ] Audit and remove dead old-layout classes from `globals.css`
- [ ] Audit and remove dead old-button/form/card classes from `globals.css`
- [ ] Audit and remove dead old-table/misc classes from `globals.css`
- [x] Phase 4.3: Shared/component TS conversion
- [x] Convert section-primitives, section-helpers to TypeScript
- [x] Convert result-card, drawer-shell, library-drawer, workspace-layout, workspace-page-header, icons to `.tsx`
- [x] Convert workspace-status to `.tsx` and remove `.d.ts` shim
- [x] Convert page files (`_app`, `_document`, `login`) to `.tsx`
- [ ] Phase 4.4: Feature section TS conversion
- [ ] Convert settings, history, batches sections to `.tsx`
- [ ] Convert playground section to `.tsx`
- [ ] Phase 4.5: Token reconciliation follow-through
- [ ] Reconcile remaining semantic token aliases after Phase 4b UI work
- [ ] Run `npm run typecheck && npm run lint && npm run build`
- [ ] Manual visual QA across all flows

**Discovered during execution**

- `tokens.css` still carried active sidebar, topbar, and tag-selection variables even though its overlapping base tokens were overridden by `globals.css`; those variables were merged instead of dropped.
- `base.css` mostly duplicated resets already present in `globals.css`, so the real Phase 4.1 merge work was preserving typography and full-height app-shell behavior.
- Phase 4.2 can be executed as repeated audit batches: the first two verified batches removed the dead old app-shell/sidebar/custom-tooltip layer plus a broad set of zero-reference utility/button/toast/toggle/search classes.
- After those batches, `styles/globals.css` dropped to 712 lines, down from roughly 1452 before Phase 4 started.
- A third verified Phase 4.2 batch removed the remaining zero-reference legacy result/card/list classes and associated responsive overrides, bringing `styles/globals.css` down to 579 lines.
- Phase 4.3 needed a lightweight UI declaration shim for the still-JS `components/ui` layer so shared `.tsx` conversions could typecheck cleanly without converting all shadcn/Base UI wrappers in the same pass.

**Carry-forward risks**

- `globals.css` tokens are imported by both the custom design system (`--bg`, `--surface`, `--ink`) and the shadcn theme bridge (`--background`, `--foreground`, etc.). These are two parallel token systems that may need reconciliation in Phase 4b.
- Some remaining vanilla CSS classes (`.auth-shell`, `.auth-card`, login page styles) won't be fully removable until the login page is also migrated to shadcn components.

**Next session start point**

Start with Phase 4.4: convert `settings`, `history`, `batches`, then `playground` to TypeScript in that order, reusing the new shared/component `.tsx` surfaces from Phase 4.3.

## Phase 4b

**Status:** Not started

**Objective:** Improve interaction quality, feedback patterns, and information density across the workspace UI without mixing in the deferred accessibility/responsive hardening pass too early.

**Why now:** The design system is consolidated (Phase 4), the component structure is stable (Phase 3), and state boundaries exist (Phase 2). UX polish is most effective when the underlying architecture has stopped moving.

### Recommended execution order

| Sub-phase | Status | Priority | Scope | Why this comes next |
| --- | --- | --- | --- | --- |
| Phase 4b.1: Safety and feedback | Not started | Highest | Confirmation dialogs, toasts, batch progress, reopen last result | Prevents data loss and fixes the most obvious interaction gaps with limited layout churn |
| Phase 4b.2: Empty states and import confidence | Not started | High | Structured empty states, lightweight onboarding, CSV preview and validation | Adjacent “user confidence” flows that can ship together |
| Phase 4b.3: Shared UI dedup and result experience | Not started | High | Variant card dedup, result card comparison improvements, copy affordances, prompt collapsing, rating UI improvements | These changes touch the same surface area and should be designed together |
| Phase 4b.4: Accessibility and responsive hardening | Deferred | Later | ARIA semantics, focus audit, medium-breakpoint fixes, constrained history layout | Intentionally delayed per current priority; kept as one dedicated pass instead of sprinkled partial fixes |
| Phase 4b.5: Final token reconciliation | Deferred until after 4b.1-4b.4 | Later | Normalize custom tokens vs shadcn tokens after the above polish changes settle | Best done last so token changes reflect the final component set |

### Phase 4b execution rule

- Prioritize user-safety and feedback before visual refinement.
- Keep accessibility and responsive hardening together in one later pass unless a current task directly breaks usability.
- Do not start token reconciliation until the UI polish parts above it are stable.

### UX audit findings

**Information architecture and density**

- The PlaygroundSection receives 30+ props. The component is a prop-drilling bottleneck. While it works, it makes the code fragile and hard to reason about.
- Variant cards repeat the same 3-field grid (Label, Prompt Source, Model) in both playground and batches with near-identical markup. This is duplicated UI logic, not shared.
- The result card packs metrics, message preview, prompt details, and rating into a single vertical scroll. For comparison mode, scanning across multiple results is difficult.

**Feedback and confirmation patterns**

- Destructive actions (delete case, delete prompt, remove variant) have **no confirmation**. A misclick permanently removes data.
- Batch run completion has no progress indicator or estimated time. The user sees "Running…" with no sense of how many items are left.
- The playground result drawer auto-opens on generation but has no way to re-open after dismissal short of running again.
- Save case / save prompt / save rating succeed silently with no toast or visual confirmation.
- CSV import shows a count alert but no preview of what was parsed — users commit blind.

**Empty states and onboarding**

- Empty states are plain text ("No saved cases yet.") with no illustration, suggested action, or link to the relevant flow.
- First-time users see an empty playground with no guided onboarding or sample data.

**Accessibility and keyboard support**

- Cause tag toggle buttons use `Button` but the group has no `role="group"` or `aria-label`.
- The history run list is a series of `<button>` elements but has no `role="listbox"` semantics for keyboard navigation.
- Rating selects are dropdowns but a star/slider rating would be more scannable and touch-friendly.
- No visible focus ring audit has been done on the custom components.
- Theme toggle in sidebar has no `aria-pressed` state.

**Responsive and layout gaps**

- The 3-column variant grid (`grid-cols-3`) does not collapse on medium screens — fields compress rather than stack.
- History layout uses `lg:grid-cols-[280px_1fr]` which works but the run list has no max-height constraint and can push the detail panel off-screen.
- The workspace page header action slot wraps awkwardly on narrow viewports when the action is a full button.

**Visual consistency**

- Two token systems coexist: custom tokens (`--ink`, `--surface`, `--brand`) and shadcn tokens (`--foreground`, `--background`, `--primary`). Components mix both, creating an inconsistent mental model.
- The `SectionCard` primitive wraps shadcn `Card` but adds `gap-0` and `p-5`, creating a subtle visual discrepancy with raw `Card` usage in variant cards.

### Organized sections

#### Phase 4b.1: Safety and feedback

- Add a confirmation dialog (shadcn `AlertDialog`) before all destructive actions: delete case, delete prompt, remove variant.
- Add toast notifications (shadcn `Sonner` or a lightweight toast) for: save case, save prompt, save rating, batch start, batch complete, CSV import complete.
- Add a progress indicator for batch runs (e.g., "Processing 3 of 12 cases…").
- Make the last playground result re-openable via a "Show last result" button that appears after dismissal.

#### Phase 4b.2: Empty states and import confidence

- Replace plain-text empty states with structured empty states that include an icon, message, and a primary call-to-action button linking to the relevant flow.
- Add a first-run detection that shows a brief guided walkthrough or sample data prompt.
- After parsing CSV, show a preview table of the first 5 rows before the user commits with "Save imported cases."
- Show column mapping validation (expected headers vs. actual headers).

#### Phase 4b.3: Shared UI dedup and result experience

- Extract a shared `VariantCardFields` component used by both playground and batches, reducing duplicated grid/select/label markup.
- Keep override controls playground-only since batches don't use them.

- Add a side-by-side comparison layout option for when `playgroundMode === "compare"` — render results in columns instead of a vertical stack.
- Replace the 6-field dropdown rating grid with a visual star or slider rating for faster scanning.
- Add copy-to-clipboard on the message frame.
- Collapse prompt details by default and use shadcn `Collapsible` instead of manual state toggle.

#### Phase 4b.4: Accessibility and responsive hardening

- Add `role="group"` and `aria-label` to the cause tag toggle group.
- Add `role="listbox"` and `aria-selected` to the history run list.
- Audit all interactive elements for visible focus rings.
- Add `aria-pressed` to the theme toggle.
- Ensure the variant grid collapses (`grid-cols-3` → `grid-cols-1` at `md` breakpoint).
- Add `max-h` with overflow scroll to the history run list panel.

#### Phase 4b.5: Final token reconciliation

- Map the custom tokens (`--ink`, `--surface`, `--brand`) to their shadcn equivalents (`--foreground`, `--background`, `--primary`).
- Decide whether to keep the custom token layer as semantic aliases or replace all usages with shadcn tokens.
- Update all component files to use the chosen single system.

**Interfaces/types affected**

- New shared `VariantCardFields` component interface.
- Toast/notification context or provider.
- Empty state component props (icon, action, message).
- Result card layout mode prop.

**Acceptance criteria**

- All destructive actions require confirmation.
- All save/run operations show feedback.
- Empty states have structured content with CTAs.
- Variant card markup is shared between playground and batches.
- Result comparison has a side-by-side layout option.
- Focus rings visible on all interactive elements.
- Token system uses a single consistent set of variable names.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.

**Checklist**

- [ ] Phase 4b.1: Safety and feedback
- [ ] Add confirmation dialogs for delete case, delete prompt, remove variant
- [ ] Add toast notifications for save and run operations
- [ ] Add batch run progress indicator
- [ ] Add "Show last result" re-open button for playground
- [ ] Phase 4b.2: Empty states and import confidence
- [ ] Replace plain-text empty states with structured empty states
- [ ] Add lightweight first-run onboarding or sample-data prompt
- [ ] Add CSV import preview with column validation
- [ ] Phase 4b.3: Shared UI dedup and result experience
- [ ] Extract shared `VariantCardFields` component
- [ ] Add side-by-side comparison layout for results
- [ ] Improve rating UI (star/slider or visual scale)
- [ ] Add copy-to-clipboard on result message
- [ ] Collapse prompt details by default with `Collapsible`
- [ ] Phase 4b.4: Accessibility and responsive hardening
- [ ] Accessibility: cause tag group, history listbox, focus rings, theme toggle
- [ ] Responsive: collapse variant grid at md, constrain history list height
- [ ] Phase 4b.5: Final token reconciliation
- [ ] Reconcile custom tokens with shadcn token system
- [ ] Manual visual QA and keyboard-only navigation test

**Discovered during execution**

- None yet.

**Carry-forward risks**

- Token reconciliation may surface subtle color differences between the custom and shadcn palettes that need design review.
- Side-by-side result layout may need a minimum viewport width constraint.
- First-run onboarding scope could grow — keep it minimal (a dismissible banner, not a full walkthrough).

**Next session start point**

Start with Phase 4b.1 (confirmation dialogs, toasts, progress, reopen last result). Keep accessibility/responsive work deferred unless a change immediately exposes a blocker.

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

Begin only after Phases 1 through 4b are complete.

## Decision Log

- 2026-04-14: TypeScript is the first major modernization step because structural refactors on the current workspace surface need compiler safety.
- 2026-04-14: State and data boundaries come before breaking up `workspace-sections.js`.
- 2026-04-14: App Router migration remains last to avoid combining framework migration with architecture and styling changes.
- 2026-04-14: Phase 2 will use extracted browser/API/selector modules before considering any external state library.
- 2026-04-14: Phase 3 should keep only a minimal shared section-primitives layer and otherwise split by feature file.
- 2026-04-14: Files inside `components/workspace-sections/` should use direct feature names, while shared files should be named by role such as `section-primitives` and `section-helpers`.
- 2026-04-14: Phase 4 expanded to include dead CSS cleanup, token conflict resolution, and TS conversion of all remaining JS components.
- 2026-04-14: Phase 4b introduced as a dedicated UX polish pass covering feedback patterns, accessibility, information density, and token reconciliation.
- 2026-04-14: CSS Modules (`drawer-shell.module.css`, `library-drawer.module.css`) are already dead imports — drawer-shell.js and library-drawer.js were rewritten to use shadcn Sheet and Tailwind utilities respectively, but the old files were never deleted.
- 2026-04-14: `layout.css` (239 lines) is dead — never imported. The old sidebar/topbar layout was fully replaced by shadcn `Sidebar` in `workspace-layout.js`.
- 2026-04-14: `tokens.css` values are silently overridden by `globals.css` (imported later in `_app.js`), making `tokens.css` effectively dead.
- 2026-04-14: Phase 4 and 4b should be executed as explicit parts rather than one long checklist so work can land incrementally without mixing unrelated risk areas.
- 2026-04-14: Accessibility and responsive hardening are intentionally deferred into a dedicated later Phase 4b part unless an earlier task uncovers a blocking usability issue.

## Discovered Issues

- The app is still on the Pages Router.
- Manual browser QA still has not been rerun after the Phase 3 section split.
- `lib/workspace.js` mixes UI state, network requests, persistence, and derived data.
- Two CSS Modules exist but are **dead** (never imported) — safe to delete immediately.
- `layout.css` is dead (not imported) — safe to delete immediately.
- `tokens.css` is silently overridden by `globals.css` — needs merge and deletion.
- `base.css` overlaps with both `globals.css` and Tailwind preflight — needs merge and deletion.
- `globals.css` contains ~900 lines of dead CSS classes from the pre-shadcn era that no component references.
- Two parallel token systems coexist: custom (`--ink`, `--surface`, `--brand`) and shadcn (`--foreground`, `--background`, `--primary`). Components inconsistently mix both.
- PlaygroundSection receives 30+ props — prop drilling bottleneck.
- Variant card markup is duplicated between playground and batches.
- Destructive actions (delete case/prompt, remove variant) have no confirmation dialog.
- Save/run operations complete silently with no toast feedback.
- Batch runs show "Running…" with no progress indicator.
- Empty states are plain text with no structured content or CTAs.
- Cause tag group, history run list, and theme toggle lack proper ARIA semantics.
- Variant card 3-column grid does not collapse responsively at medium breakpoints.
- Rating UI uses 6 separate dropdowns where a visual scale would be more scannable.

## Active chunk tracker

| Area | Current sub-phase | Status | Next after that |
| --- | --- | --- | --- |
| Phase 4 | Phase 4.4: Feature section TS conversion | Ready | Convert feature sections, then revisit Phase 4.2/4.5 cleanup if needed |
| Phase 4b | Phase 4b.1: Safety and feedback | Ready after Phase 4 foundation work | Phase 4b.2: Empty states and import confidence |

### Deferred for later

- Phase 4.5: Token reconciliation follow-through
- Phase 4b.4: Accessibility and responsive hardening
- Phase 4b.5: Final token reconciliation

## Session Handoff

- Read this file first in every future session.
- Verified in this session: `npm run typecheck` and `npm run lint` succeeded after the Phase 3 split.
- Phase 1 is complete from a compiler and contract perspective. Manual UI QA remains a recommended regression check, but it no longer blocks the architecture sequence.
- Phase 3 progress in this session: `components/workspace-sections.js` was replaced by feature-scoped files under `components/workspace-sections/`, using direct feature names plus `section-primitives` and `section-helpers` for the shared layer.
- Phase 4 is now organized as sub-phases 4.1 through 4.5 in recommended execution order.
- Phase 4b is now organized as sub-phases 4b.1 through 4b.5 in recommended execution order.
- Accessibility and responsive hardening are intentionally grouped together as a later dedicated pass instead of being mixed into the next implementation step.
- Next recommended task: start Phase 4.4 by converting `settings`, `history`, and `batches` before tackling the larger `playground` file.
- Update `Status`, `Checklist`, `Discovered during execution`, `Decision Log`, and this section before ending each session.

## Completion Log

- 2026-04-14: Roadmap document created and Phase 1 started.
- 2026-04-14: Added TypeScript infrastructure, shared domain/API/workspace contracts, converted smaller domain modules plus store/runner/API boundaries to TypeScript, and verified typecheck/lint/build.
- 2026-04-14: Extracted browser persistence, API client, and selector boundaries from `lib/workspace`, and replaced the old workspace JS implementation with typed `lib/workspace.ts`.
- 2026-04-14: Split `components/workspace-sections.js` into feature-scoped files with explicit typed props, added shared section primitives/helpers, and removed the monolithic section module.
- 2026-04-14: Expanded Phase 4 with detailed CSS audit (dead files, token conflict, ~900 lines of dead classes identified). Added Phase 4b for UX polish (confirmations, toasts, accessibility, empty states, result comparison, responsive fixes).
- 2026-04-14: Reorganized Phase 4 and 4b into ordered sub-phases (`4.1`-`4.5`, `4b.1`-`4b.5`), with accessibility/responsive hardening explicitly deferred into a later dedicated chunk.
- 2026-04-14: Completed Phase 4.1 by deleting dead CSS files, consolidating stylesheet imports to `globals.css`, and merging the still-used token/typography rules from `tokens.css` and `base.css`.
- 2026-04-14: Started Phase 4.2 and removed the first two verified dead-class batches from `globals.css`, including the legacy app-shell/sidebar/custom-tooltip layer and many zero-reference utility/button/toast/toggle/search classes.
- 2026-04-14: Continued Phase 4.2 with a third verified batch removing the remaining zero-reference legacy result/card/list selectors and shrinking `globals.css` to 579 lines.
- 2026-04-14: Completed Phase 4.3 by converting shared workspace-support components and low-risk pages to TypeScript, removing the `workspace-status` shim, and adding UI declaration shims for the still-JS `components/ui` layer.
