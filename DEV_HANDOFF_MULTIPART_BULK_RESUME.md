# Multipart Upload Tray — Bulk Resume (PORTAL-13077)

**Branch:** `multipart-updates`
**Ticket:** [PORTAL-13077](https://greenfly.atlassian.net/browse/PORTAL-13077) — Resume interrupted uploads by reselecting files in bulk
**Status:** Context + plan only. No code written yet.

---

## 1. Problem

When an upload session is interrupted (tab closed, reload, network loss, laptop sleep), the server-side S3 multipart sessions are still resumable, but the browser can't rehydrate `File` handles. Today the user re-picks files **one row at a time** via the ↻ icon, and a mismatch just errors on that row. There's no report of what matched.

Goal: one multi-select (files, or a folder where supported) → automatic re-match → a clear account of what will resume, what won't, and why.

## 2. Acceptance criteria (condensed from the ticket)

- **Batch action** in the upload progress window whenever ≥1 upload is resumable. It opens one multi-select picker (folder where the browser supports it). Single-row reselect still works.
- **Auto-match** when the picker closes. A file matches when **name + size + lastModified** all agree. Matching doesn't depend on order, and it's 1:1: no file serves two uploads, and no upload claims two files.
- **Resume from where it stopped.** Only unconfirmed parts are uploaded, and the row shows its prior progress (not 0). All matched files resume together under the existing concurrency limits, with no per-file confirm.
- **Summary grouped by outcome:** resuming, already finished, changed since the upload started, expired, not selected, extra. Each group says what happens if the user does nothing, and the counts reconcile.
- **User choices for non-matches:**
  - *Changed* (lastModified differs): upload fresh or leave it. Progress is never discarded without the user choosing.
  - *Extra* (no matching upload): upload as new or ignore. Extras are never uploaded silently.
  - *Already finished*: default is do nothing, and the summary says it's already in the library (to avoid a duplicate).
  - *Not selected*: the entry survives for later, until the session expires.
  - *Expired*: the only option is a fresh upload, and the dead entry is cleared.
- **Ambiguity → ask, don't guess.** When ≥2 selected files could match one upload, or one file could satisfy two uploads, prompt the user to pick, or mark the upload unresolved with an explanation.
- **Ownership.** Only the user who started an upload can see or resume it, within their company context. Entries are scoped per user, entries past the session TTL are pruned, and no existing ownership check on resume/abort/complete is weakened.
- **Accessibility / performance.** The summary is keyboard-operable and per-group counts are announced to screen readers. Batch progress, failure and completion show in the existing tray. Matching several hundred files must not freeze the browser.
- **Re-interruption.** A file that fails again returns to resumable with its progress intact. If matching itself fails (corrupt state, storage unavailable), tell the user and still allow fresh uploads. Never leave rows that do nothing.

## 3. How prod works today (reference — `portal/web/greenflyPortal/src/app/`)

- `core/upload/upload-persistence.service.ts` — localStorage key `gf-resumable-uploads` **suffixed with the current user id**. 12h TTL mirrors the S3 multipart session, and expired entries are pruned. Persists `queueId, filename, fileSize, lastModified, totalChunks, chunkSize, completedChunks[{index,eTag}], createdAt`, plus `uploadId/companyId` once init has run, plus gallery/title/tags metadata. SUCCESS/CANCELLED entries are removed. **Per-user scoping and TTL already exist.**
- `core/upload/state-upload-progress-window/upload-progress-window.effects.ts` → `createChunkedUploadFromPersisted` restores rows as `status: 'FAILED'`, `needsFileReselection: true`, `isResumed: true`, with progress = completedChunks/totalChunks. Messages:
  - With server state: *"Upload interrupted. Please click the refresh icon to reselect file."*
  - Without server state: *"Upload was queued but not started. Please click the refresh icon to reselect file."*
- `feature-shared/upload/upload-progress-window/upload-progress-window.component.ts` → `handleFileReselected` (single file):
  1. No persisted state → *"Upload session not found. Please start a new upload."*
  2. Name or size mismatch → *"Selected file doesn't match the original…"*
  3. lastModified differs → `fileReselectedForRestart` (**silently restarts from scratch**, which the new AC forbids without a user choice)
  4. Otherwise → `fileReselectedForResume`
- The item template has a hidden `<input type="file">` per row for reselection.

**Implication:** bulk matching is a new front-end layer over the existing resume/restart actions. The biggest behavior change is that *changed* files must now ask before restarting.

## 4. Prototype today (`ml`)

- `src/hooks/useUploadQueue.tsx` — context queue + tick simulation. `retryUpload` just flips back to UPLOADING. There's no interrupted/restored state, and nothing sets `needsFileReselection`.
- `src/lib/mockUploadData.ts` — `ChunkedUpload` mirrors prod (already has `needsFileReselection`, `isResumed`, `completedChunks`), but it has **no `lastModified`** and no persistence/TTL.
- `src/components/UploadProgressWindow.tsx` / `UploadProgressWindowItem.tsx` — tray + row. The row already labels retry as "Select file to resume upload" when `needsFileReselection`.
- Console demo hooks: `__uploadDemo.drop() / fail() / list()`.

## 5. Decisions so far

- **Batch action = banner pinned above the row list** (chosen 2026-09-28). It shows whenever anything is resumable, e.g. "ⓘ 3 uploads were interrupted — [Reselect files]". Per-row ↻ stays for single reselect.
- **Summary surface: OPEN.** The recommendation is a **modal dialog** (grouped sections, a choice per unclear file, one "Resume N uploads" confirm; progress then continues in the tray). The alternative is inline in the tray, which gets cramped with many files. Greg hasn't confirmed yet.

## 6. Build plan (prototype)

1. **Model:** add `lastModified` and `expiresAt` to `ChunkedUpload`, and keep `completedChunks` as the resume point.
2. **Interrupt simulation:** `__uploadDemo.interrupt()` converts in-flight uploads to the restored state (FAILED + `needsFileReselection`, prod copy). `__uploadDemo.expire(id)` marks one expired. Real files queued through the upload modal keep their real name/size/lastModified, so reviewers can re-pick the same files from disk and see true matches.
3. **Matcher** (`src/lib/resumeMatcher.ts`, pure, over a `{name,size,lastModified}` descriptor so demos can pass fakes without allocating huge blobs): index uploads by `name|size` in a Map (O(n), fine for hundreds). Outcomes: resuming / changed / already-finished (matches a completed upload) / expired / not-selected / extra / ambiguous. Enforce 1:1 and flag many-to-one and one-to-many as ambiguous.
4. **Banner** in `UploadProgressWindow` + one hidden `<input type="file" multiple>` (plus a folder option via `webkitdirectory` where supported).
5. **Summary** (dialog, pending decision): grouped, counts reconcile to *selected + pending*, per-row choices (changed: fresh/leave; extra: upload/ignore; ambiguous: pick file), `aria-live` counts, keyboard operable.
6. **Apply:** matched → resume from `completedChunks` (progress bar starts at prior %). Changed + "fresh" → reset. Extras + "upload" → new rows. Expired → cleared and offered fresh. Not selected → left as is.
7. **Failure paths:** a re-interrupted resume goes back to resumable with progress intact. A matcher/storage error shows a message in the tray, and fresh upload still works.
8. `__uploadDemo.reselectScenario()` to populate every summary group for design review in one go.
