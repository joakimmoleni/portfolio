# Portfolio quality review — 2026-09-26

Reviewed the published `3fba9b7` release with three independent agent workstreams and direct browser checks. The focus was correctness, maintainability, accessibility and delivery cost. No new dependencies or hosting changes were introduced.

## Findings addressed

- A failed CV variant request could label base data as the requested profile. The CV now preserves the last successful profile, or explicitly identifies base data on an initial failure. Errors and loading status survive language changes. Failed requests can be retried; stale success and failure responses cannot replace a newer selection.
- CV implementation state is now local to its script instead of being stored on `window`. JSON requests use conditional revalidation rather than bypassing the browser cache entirely.
- Winamp covered the Start menu on narrow screens. Start now appears above the player.
- Closing Winamp after collapsing the CV Programs menu could lose keyboard focus. Focus now returns to the summary. The browser check exposed a WebKit detail: controls inside a closed `details` element can retain nonzero geometry, so geometry alone is insufficient for this check.
- The outer CV panel now has a visible keyboard focus indicator. The theme toggle keeps a stable accessible name while its pressed state changes. Swedish extras and their launch menu declare their language on the English CV page.
- WoW/CS panel switching also brings a heading back into view when it is above the viewport.
- Site validation now checks cross-page fragments and root-relative local references.
- Removed unused legacy `style.css` and `script.js`: 1,286 lines / 37,277 bytes of dead source. They were not loaded, so this is a maintenance improvement, not a claimed network saving. Existing illustration assets and their design documentation remain intact.

## Evidence and checks

- `npm run validate`, `npm test` and `git diff --check`.
- Native Node CV regression tests use real event handlers with a small DOM stand-in, covering failures, retries, request ordering, language changes, history and theme state. Real browser checks separately cover focus and layout.
- All ten CV regressions passed. The final browser matrix checked all three profiles in both languages with direct links to the experience panel at 320 px; the selected profile, language, displayed section and job count matched, with no overflow or broken ARIA references.
- A temporary local server deliberately returned HTTP 503 for a variant and for the base data, and delayed JSON responses by 700 ms. Browser checks confirmed honest fallback labels, persistent translated errors and correct selection after rapid profile/language changes and Back navigation.
- At 320 px, all five pages were checked for horizontal overflow. Runtime DOM checks found no duplicate IDs or broken ARIA references in the checked pages.
- At 390 px, browser hit-testing and screenshots confirmed Start appears above Winamp. The collapsed Programs → close Winamp flow returns focus to the summary in WebKit.
- Extra-player checks covered timekeeping, pause/resume, track changes, seeking, completion, stop and cleanup on page navigation. Chat text uses textContent; no audio or external chat request is introduced.
- Selected sensitive text/background pairs pass the intended contrast levels: CS button 4.70:1, Lunar footer 4.58:1, small Lunar masthead labels at least 4.53:1. This is targeted contrast inspection, not a full accessibility certification.

## Performance observations

Production HTTP responses use gzip, ETags and a 600-second cache lifetime. A direct check from this machine measured the homepage HTML at 4,949 transferred bytes and 248 ms to the first byte; the shared stylesheet was 4,111 bytes / 163 ms, extras script 4,546 bytes / 174 ms, and base CV JSON 3,514 bytes / 134 ms. These are individual local network samples, not representative user percentiles or rendering metrics.

Source-based gzip estimates put a complete cold page at roughly 18–29 KB including its active scripts/styles and, for the CV, its data. No remote fonts, external display images, framework runtime or analytics are needed. The shared shell and small scripts do not justify adding a bundler or a new loading abstraction.

The Chrome performance-tracing tool is unavailable in this environment. No Lighthouse score, LCP, CLS or INP result is claimed. Responsive browser checks do not substitute for every physical device or assistive technology. The earlier release review records the native print-preview check; print styles are unchanged by this review.
