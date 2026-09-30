# Multipart Upload Tray — Bulk Resume (PORTAL-13077)

**Branch:** `multipart-updates`
**Ticket:** [PORTAL-13077](https://greenfly.atlassian.net/browse/PORTAL-13077) — Resume interrupted uploads by reselecting files in bulk
**Status:** Simplified flow from the 2026-09-29 call is built (see §5a). Edge cases (changed / extra / expired / ambiguous) to cover when the team reconvenes.

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

## 5a. Call decisions (2026-09-29) and what's built

> **Partly superseded by §5b (2026-09-30).** Retry All no longer opens a picker. The bulk reselect/matching and the success-history duplicate check were removed from the prototype; they're still in git history at `115f739` if they come back.

This came out of a call about CS feedback via Lucy: bulk retry is missing, so users handle failures row by row. The call **narrowed the ticket**. The ticket's grouped summary dialog is dropped in favor of the lighter flow below.

| Call decision | Prototype |
|---|---|
| Bulk retry is a **banner**, not in the header. Its single CTA is **"Retry All"**. | One banner line ("N uploads failed.", with a sub-line when some need reselecting) and one **Retry All** button. It restarts in-memory failures immediately, and if any were interrupted, the same click opens one multi-select picker. |
| Match on name + last modified + size, via a key-value map. | `matchReselectedFiles` in `mockUploadData.ts` uses a Map keyed `name\|size\|lastModified`. It's 1:1 and order-independent. |
| A confident match auto-resumes. | It resumes from confirmed parts (the bar keeps prior %). No confirm step. |
| A file with no match is flagged "no matching file found", with a prompt to reselect individually. | Interrupted rows no pick matched get "No matching file found. Click the refresh icon to reselect this file." Picked files that matched nothing are counted in the toast. The row ↻ opens a real single-file picker using prod's rules: a name/size mismatch shows prod's error, and a changed lastModified restarts from 0. |
| Failures persist in local storage across refreshes until cleared or X'd. | `src/lib/uploadPersistence.ts`, keyed `gf-resumable-uploads-<userId>` with a 12h TTL, as in prod. A reload brings rows back as interrupted, with progress kept. X, close and success all remove the entry. |
| A short-lived **success history** avoids duplicates, with the warning "already uploaded, add again or skip?" | `gf-upload-history-<userId>` (metadata only, 12h). A picked file that matches no failure but is in history opens an "already uploaded" dialog with **Skip / Upload Again**. **New in prod: it only stores failures today.** |
| A file that still fails after retry is left as-is and bulk retry stays available. | It goes back to FAILED and the banner returns. No special casing. |
| No failed/succeeded filter in the tray; the view stays mixed. | Unchanged. Failures sort to the top, as in prod. |

**Where the call and the ticket still disagree (for the next sync):**
- **Changed files** (same name/size, new lastModified). The ticket wants "upload fresh or leave it". Under the call's flow they're simply unmatched. Prod's single-row reselect still silently restarts them, which the ticket says must ask first.
- **Extra files** (picked, matching nothing). The ticket wants "upload as new or ignore". The call only flags them, so the prototype counts them in a toast and doesn't upload them.
- **Expired sessions and ambiguous matches** weren't discussed. Today, duplicate keys pair first-come, and expired entries are just pruned on load.
- The tooltip bug on the Library multi-select banner, from the same call, is a separate prod patch and isn't on this branch.

**Demo:** Upload files, then run `__uploadDemo.interrupt()` in the console and reload the page. Click **Retry All** and re-pick the same files.

## 5b. Order of operations (2026-09-30 call)

Background auto-retry now comes **first**. The user only sees a failure once it gives up.

1. When a connection drops, the row goes to RECONNECTING (prod's existing state) and retries in the background with backoff (2s, 4s, 8s). The row reads "Connection lost. Retrying automatically (2 of 3)…".
2. When an attempt succeeds, the upload carries on from its progress, and nothing else is shown.
3. When all attempts are spent, the row goes to FAILED with an **inline error**: "Upload failed after 3 retries. Click the refresh icon to try again." Only then does the banner appear.
4. **Retry All retries every failed row in one click, with no file picker**, so nobody has to go row by row. Rows whose file was lost after a refresh can't be retried without a pick, so they keep an **inline "reselect the file" error** on the row (the same treatment as the upload error), and the row ↻ opens a single-file picker. When every failure is a reselect, Retry All hides: there's nothing it can do.
5. The banner shows **just the count** ("1 upload failed."), and the explanation lives on the row. **Retry All** is kept for the dev discussion, since it may be redundant once background retry exists.
6. The minimize/close warning is unchanged: closing the tray still cancels uploads.

The attempt count is `AUTO_RETRY_ATTEMPTS = 3` in `mockUploadData.ts`, so the "once / 2-3 / button" question is a one-line change.

**Feasibility to raise with dev:** background retry only works while the page still holds the `File`, which covers a network drop or a server error. After a refresh or a closed tab, the browser won't reopen a file from stored metadata alone, so those rows still need a user pick (Retry All's picker, or the row's ↻). The one exception is the Chromium-only File System Access API: file *handles* can be stored in IndexedDB and re-permissioned with a single prompt. That's worth asking about if true auto-resume after a refresh matters.

Demo: `__uploadDemo.scenario()` seeds one row per state for design review (reselect ask, retries used up, retrying, uploading, done). `__uploadDemo.drop()` recovers on the first retry. `__uploadDemo.fail()` uses up all 3 attempts and then shows the banner.

## 6. Build plan (prototype)

1. **Model:** add `lastModified` and `expiresAt` to `ChunkedUpload`, and keep `completedChunks` as the resume point.
2. **Interrupt simulation:** `__uploadDemo.interrupt()` converts in-flight uploads to the restored state (FAILED + `needsFileReselection`, prod copy). `__uploadDemo.expire(id)` marks one expired. Real files queued through the upload modal keep their real name/size/lastModified, so reviewers can re-pick the same files from disk and see true matches.
3. **Matcher** (`src/lib/resumeMatcher.ts`, pure, over a `{name,size,lastModified}` descriptor so demos can pass fakes without allocating huge blobs): index uploads by `name|size` in a Map (O(n), fine for hundreds). Outcomes: resuming / changed / already-finished (matches a completed upload) / expired / not-selected / extra / ambiguous. Enforce 1:1 and flag many-to-one and one-to-many as ambiguous.
4. **Banner** in `UploadProgressWindow` + one hidden `<input type="file" multiple>` (plus a folder option via `webkitdirectory` where supported).
5. **Summary** (dialog, pending decision): grouped, counts reconcile to *selected + pending*, per-row choices (changed: fresh/leave; extra: upload/ignore; ambiguous: pick file), `aria-live` counts, keyboard operable.
6. **Apply:** matched → resume from `completedChunks` (progress bar starts at prior %). Changed + "fresh" → reset. Extras + "upload" → new rows. Expired → cleared and offered fresh. Not selected → left as is.
7. **Failure paths:** a re-interrupted resume goes back to resumable with progress intact. A matcher/storage error shows a message in the tray, and fresh upload still works.
8. `__uploadDemo.reselectScenario()` to populate every summary group for design review in one go.
