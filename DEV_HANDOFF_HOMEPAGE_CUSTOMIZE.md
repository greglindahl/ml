# Dev Handoff — Homepage Redesign + Customize Homepage

**Updated:** 2026-07-10.
**Branch:** `customize`, branched cleanly off `main` at `570f1ed` (PR #16 merge). 8 commits ahead, pushed to origin, **no PR opened yet**.

Read `SESSION_HANDOFF.md` first for repo-wide state/conventions. This doc covers only the homepage + customize-drawer work.

---

## 1. What shipped this session (newest first)

**2026-07-10 follow-up session (all pushed, still no PR):**

1. `83574ba` Wire homepage View All navigation and polish module layout — View All targets: Recent Assets → Library/assets, Recent Galleries → Library/galleries, Recent Activity → Insights/activity, Connect Jobs → Connect, Requests → Requests. New `HomeViewAllTarget` type + `onViewAll` prop chain (Index → ContentScreen → HomeScreen); tab deep-links via consume-once `pendingLibraryTab`/`pendingStatsTab` + `initialActiveTab` (LibraryScreen) / `initialTab` (StatsScreen). Customize button lives in the Quick Actions header row now, falls back to the Welcome row if Quick Actions is hidden. ActivityCard is `h-full` so paired modules match heights. TwoLineTable date header columns removed.
2. `d67ed55` Generalize activity module pairing — `COMPACT_ACTIVITY_MODULES` set; consecutive compacts chunk into rows of 2, odd one out full width; fixes latent 3+-modules dropout. Add future compact modules (Engage Campaigns, Workflows) to that set.
3. `fffeae0` Customize drawer: 12px (mb-3) between section titles and rows.
4. `f493f36` Get Started module stacks below `sm` (576px): copy full-width, gallery card under it, other 3 tour images hidden.
5. `a39b8eb` Asset modal: joined white Previous/count/Next button group (border `#D2DDEC` = portal `$gray-400`), `bi-list-ul` toggle icon, built-in dialog X removed via new `hideClose` prop on `DialogContent`, crop button at bottom-right of image container.

**Original customize session:**

1. `66078b4` Switch Customize drawer to a bottom sheet on narrow screens
2. `ca4c849` Match homepage responsive breakpoints to production, fix card overlap
3. `6b3ecd8` Add accent color palette and fix activity icon colors
4. `5b80420` Add homepage customization drawer and fix sticky left nav
5. `e03c4ec` Add asset detail modal matching Figma, wire it in everywhere
6. `fec3fea` Route Starter Gallery through the standard GalleryDetailsView
7. `770a3f4` Add Starter Gallery module and details page to homepage
8. `97e183f` Implement new homepage design, replacing placeholder

Plus earlier `archive-updates`/`subfolders` work already merged to `main` (folder gallery-count rollup, archive-toggle union fix, bulk-select removal from folder tables, Galleries column) — not part of this doc, already shipped.

## 2. Homepage (`HomeScreen.tsx`)

Built from Figma `ELfA4d5Vhd9c98uiHHDx18` ("Portal | New Homepage V1"), node `4493:843`. Replaced the old dead placeholder screen in `ContentScreen.tsx`.

- **Sections, top to bottom:** Welcome + Customize button row → Quick Actions (pill row) → Get Started accordion (onboarding) → Recent Media (assets/galleries grids) → Recent Portal Activity.
- All four section groups are individually hide/reorderable via the Customize drawer (§4). State lives in `HomeScreen.tsx`, persisted to `localStorage` under `homeQuickActions` / `homeOnboardingModules` / `homeRecentMediaModules` / `homeActivityModules`, loaded via a `loadPersistedList<T>(key, fallback)` helper. Defaults: `DEFAULT_QUICK_ACTIONS` (5 items), `DEFAULT_ONBOARDING_MODULES` (1: Starter Gallery), `DEFAULT_RECENT_MEDIA_MODULES` (2: recent-assets, recent-galleries), `DEFAULT_ACTIVITY_MODULES` (3: recent-activity, recent-connect-jobs, recent-requests).
- **Recent Assets** = top 5 of `mockLibraryAssets` sorted by `dateCreated` desc — real data, not ad-hoc mock.
- **Recent Activity icons** now colored per-type via `iconColor` (Tailwind `accent-*` classes, see §5) instead of all being primary blue.
- Quick Actions pill responsive classes (intentionally verbose, matches Figma clamp behavior):
  ```
  flex-shrink-0 flex-grow-0 basis-full sm:basis-[calc(50%-0.75rem)] xl:basis-[calc(33.333%-1rem)] xxl:basis-[clamp(11rem,calc(20%-1.2rem),18rem)]
  ```
- **Known CSS gotcha fixed here:** the Get Started tour-image row is `overflow-x-auto` inside a flex column — it needed `min-w-0` or it forces the whole page wider than the viewport (classic flexbox `min-width: auto` bug). If you touch that row again and responsive testing looks broken, check this first.
- A temporary debug banner (raw `window.innerWidth` / `isNarrow` readout) was added and fully removed during the responsive-testing saga (§7) — if you see any trace of it, it's a regression, not something to keep.

## 3. Starter Gallery

A standalone (not-in-any-folder) gallery reachable by clicking any of the 4 Home tour images. **Must always route through the same `GalleryDetailsView` as every other gallery** — a bespoke `StarterGalleryDetailsView` was built, then deleted, after the user flagged it was missing tabs/search/breadcrumbs.

- `src/lib/mockFolderData.ts` — `starter-gallery` entries added to both `folders` tree and `mockGalleries` array (`thumbnailUrl` imported from `@/assets/starter-gallery/1.svg`).
- `src/lib/mockLibraryData.ts` — `mockLibraryAssets` is now `[...generatedLibraryAssets, ...starterGalleryAssets]`; `starterGalleryAssets` is 18 fixed entries with `folderId: "starter-gallery"`, `creator: "Greenfly"`.
- `src/pages/Index.tsx` — `pendingLibraryFolderId` state + `handleOpenStarterGallery` (sets it to `"starter-gallery"` and switches to the library screen) + a consume-once `useEffect` that clears it right after.
- `src/components/LibraryScreen.tsx` — `initialActiveFolder?: string` prop seeds `useState`.
- `src/components/ContentScreen.tsx` — threads `onOpenStarterGallery` to `HomeScreen`, `initialLibraryFolderId` to `LibraryScreen`.

## 4. Asset Detail Modal (`AssetDetailModal.tsx`)

Restyled to match Figma `WQQBU8t3qX4D8LXoFiFNbc`, node `8020:16550`. Wired up **everywhere** an asset can be clicked: Library grid + table, Gallery details grid + table, Folder details grid + table, Home Recent Assets. Pattern repeated in each consumer: `viewingAssetId`/`viewingAssetIndex`/`viewingAsset` state + `handleViewAsset`/`handlePreviousAsset`/`handleNextAsset`, grid `AssetCard`s wrapped in click-handling `<div>`s, `onOpenAsset` passed to `AssetTableView`.

If a new place in the app renders assets and doesn't open this modal on click, that's a gap — the requirement was "no matter where i'm at in the proto, if i click on an asset, the modal opens."

**Pagination (2026-07-10):** header Previous / "N of M" / Next restyled from separate primary-outline buttons into a joined Dashkit-style `btn-group`: `white` button variant (`bg-white`, `text-foreground`, border `#D2DDEC` = portal `$gray-400`), outer corners rounded only (`rounded-r-none` / `rounded-l-none`), count segment is a `span` with `border-y` only so dividers stay 1px.

## 5. Customize Homepage drawer (`CustomizeHomeDrawer.tsx`)

Drag-to-reorder (`@dnd-kit`) + eye-icon visibility toggle for the 4 module groups (Quick Actions, Onboarding, Recent Media, Recent Portal Activity). Chosen over `framer-motion` (a reference prototype used it) specifically to avoid adding a new dependency — `@dnd-kit` was already used in `FolderSidebar.tsx`.

- **State pattern:** snapshot-on-open / restore-on-cancel / persist-on-save, via a `useRef` snapshot in `HomeScreen.tsx` (`customizeSnapshotRef`, `handleOpenCustomize`/`handleCancelCustomize`/`handleSaveCustomize`). Live changes preview immediately on the page behind the drawer; Cancel reverts to the snapshot, Save commits to localStorage.
- **Responsive:** below **425px** (`useIsNarrowScreen` in `src/hooks/use-mobile.tsx`, inclusive `<=`) it renders as a bottom sheet (shadcn `Sheet`, `side="bottom"`) matching the Library page's `FiltersSheet` pattern, instead of the fixed-right-side drawer. Confirmed working via a real iPhone test (see §7).
- The Figma file's own "Customize Panel" component (node `4491:24529`, same homepage file) was directly edited via `use_figma` to match: drag-handle + eye-icon rows instead of toggle-switches + chevron arrows, across all 11 rows.

## 6. Accent color palette (`tailwind.config.ts`)

Added right after the existing `black: '#12263F'` line, sourced from a Figma "Colors" panel screenshot:

```ts
accent: {
  blue: '#2C7BE5', indigo: '#727CF5', violet: '#9747FF', purple: '#6B5EAE',
  pink: '#FF679B', red: '#E63757', orange: '#FD7E14', yellow: '#F6C343',
  green: '#00D97E', teal: '#02A8B5', cyan: '#39AFD1', gf: '#3AAB47',
},
```

Used as `text-accent-*` to color each Recent Activity/Connect Jobs/Requests icon to match its circle background (was previously all primary blue).

## 7. Responsive breakpoints — ported from production, not invented

Per explicit instruction, checked `/Users/glindahl/Documents/Code/portal` for existing production responsive rules **before** writing new ones. `tailwind.config.ts`'s `screens` already matched Bootstrap 5 exactly (`sm:576px, md:768px, lg:992px, xl:1200px, xxl:1400px`) — pre-existing, not something added this session. The 425px "narrow" threshold for the Customize drawer's bottom-sheet switch is a new value (no production precedent — it mirrors the Library page's own `FiltersSheet` behavior instead).

### Resolved bugs found while wiring this up
- **Uneven grid at exactly 992px**: `RECENT_GALLERIES` had 4 mock items against a `lg:grid-cols-5` grid — fixed by adding a 5th mock entry (`home-gallery-5`, "Community Day").
- **Card overlap at 992px**: `GalleryCard`/`AssetCard` had hardcoded `min-w-[200px]`/`min-w-[160px]` that exceeded the actual grid-track width once fixed 5-column grids were in play. Removed both — safe, since every consumer's `auto-fill minmax(...)` grid already enforces the minimum via the track itself.
- **`useIsNarrowScreen` off-by-one**: was `<` (exclusive), so exactly 425px still showed the side drawer. Fixed to `<=`.

### The DevTools saga (environment issue, not a code bug — for context only)
After the `<=` fix, the bottom sheet still didn't appear across many Chrome DevTools responsive-mode configurations. Verified via direct `curl` of the served Vite module (twice) that the code was correct both times. Eventually traced via the user's own `window.innerWidth` console checks to DevTools reporting a width that didn't match the actual measured width (541px, persistently, across incognito + full resets) — **while investigating this, a real bug was found and fixed** (the `min-w-0` flexbox issue in §2). Even after that fix, DevTools kept reporting 541. A temporary debug banner confirmed via a real iPhone (LAN IP, Safari) that `window.innerWidth` correctly read 393px and the bottom sheet correctly appeared. **Conclusion: the code was correct the whole time — the user's Chrome DevTools "Responsive" emulation was broken/unreliable on their machine** (independently corroborated by not being able to physically drag the browser window narrower than ~500px). Debug banner fully removed afterward.

**If mobile/responsive testing looks broken again on this machine, don't trust Chrome DevTools responsive mode — verify with a real device or `window.innerWidth` console logging first.**

## 8. Environment gotcha (unresolved, every session)

`mcp__Claude_Browser__preview_start` (and all `preview_*` tools) fail every time with `EPERM: process.cwd failed with error operation not permitted, uv_cwd`. Workaround used all session: start the dev server manually via `Bash` (`npm run dev` from repo root, `run_in_background: true`), verify via `lsof -ti:8080` + tailing the background log + `curl -s http://localhost:8080/ -o /dev/null -w "%{http_code}\n"`. Also useful: `curl -s "http://localhost:8080/src/path/to/File.tsx"` to fetch the actual served/transpiled module source directly when debugging stale-HMR suspicions.

## 8b. Known prod divergence (observed 2026-07-13, intentionally not fixed)

Prod's homepage Recent Assets cards are **fixed/capped width** (~297px, left-aligned with leftover row space at wide viewports); the proto's are a stretching `grid-cols-5` that fills the row, so proto cards grow larger than prod's as the viewport widens past ~1600px. User explicitly chose not to change the proto ("not sure i wanna muck with it"). If parity is ever wanted, swap the Recent Assets/Galleries grids to the `auto-fill minmax(...)` pattern used elsewhere or cap the card width — decide at port time.

## 9. Open / not yet requested

- No PR opened for `customize` yet — don't open one unless asked.
- Nothing else flagged as incomplete; all explicit asks in this session were completed and verified (tsc/eslint clean, dev server checked, real-device responsive check done).
