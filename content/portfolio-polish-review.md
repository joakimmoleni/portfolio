# Portfolio polish review — 2026-09-26

This pass addresses visitors with different goals: recruiters and managers looking for experience or contact details; developers looking for implementation and projects; colleagues and friends exploring the personal worlds. Three parallel reviews covered content ownership, visual hierarchy and interaction behaviour.

## Content and design

- The desktop is a short introduction and launcher. Full career, project and personal copy lives in the relevant program instead of being repeated on the homepage.
- Desktop shortcuts, the main menu and Start remain useful alternative navigation. Their labels and destinations agree. Every main menu follows Desktop / About / Projects / CV / Contact, including mobile.
- WoW retains the quest list and parchment, with tighter spacing and fewer repeated headings and calls to action.
- Counter-Strike retains its WON-era server-browser structure. Project roles, years and implementation details sit close to the selected case, without an artificial minimum panel height.
- Lunarstorm retains `exposure_`, with Joakim's name and contact purpose made explicit. Email, LinkedIn and GitHub precede the longer presentation.
- The CV gives reading priority to the person and professional sections. Terminal commands are optional, after the content; programs sit in the toolbar. New visitors get Swedish, and return navigation respects the chosen language.
- Removed obsolete home styles and unused SVG symbols. No dependencies or runtime services were added.

## Behaviour repaired

- Generic CV links no longer reset a visitor's English selection. Links to a project's CV role retain that selection.
- Re-rendering CV sections restores relevant keyboard focus without taking it from unrelated controls. Browser Back/Forward similarly restores focus in project and quest panels.
- Terminal commands reveal and scroll to their result. F1 opens usable help; a second F1 returns to the command input.
- Valid commands entered during initial loading report the loading state. Printing is disabled while data changes, preventing output of the preceding variant; the command path provides the same protection.
- Empty CV project sections use neutral text and a route to the project archive.

## Verification

- `npm run validate`: local links, fragment targets, IDs, data, JavaScript syntax and silent-player checks passed.
- `npm test`: all 26 native regression tests passed, including loading failures, retries, competing requests, language, history, focus and print guards.
- Browser checks at 960px desktop and 320px mobile: all five pages, both CV languages, menus, heading wrapping and page overflow. No duplicate IDs or broken ARIA references in the final mobile matrix.
- Clicked through English CV → Projects → CV and a project's role link; checked Back/Forward focus, F1 help and command-result scrolling.
- A temporary local server delayed CV data by three seconds to verify initial/variant loading feedback and print protection.
- Opened, played and closed the silent Winamp on mobile; focus returned to Start. Checked the revised desktop in light and dark themes. The final local page reported no browser console warnings or errors.

Native print-preview pagination could not be inspected because computer use cannot access the host app's print dialog. The button and command invocation are covered, but this pass does not claim a fresh visual verification of the exported PDF.

## Follow-up: icons and mainframe

- Replaced the abstract About and Projects desktop icons with a parchment quest scroll and a CS-inspired server browser. Checked them on the desktop, launcher and window chrome; removed unused old symbols.
- Reworked the CV around a clearer name/role hierarchy and a readable system monospace font. Consolidated desktop controls, shortened contact labels, removed the duplicate profile label and arbitrary panel height, and made the terminal colours serve distinct roles. The [IBM ISPF Primary Option Menu](https://www.ibm.com/docs/en/zos/3.1.0?topic=ispf-primary-option-menu-panel) informed the panel title, text choices and function row.
- Kept complete contact URLs in print. Inspected the print styles on a local preview at an A4-content-like width; all populated sections were visible, screen controls hidden and addresses complete. This checks CSS layout, not native PDF pagination.
- Fixed terminal loading feedback that could remain stale after data arrived. A focused regression verifies completion, failure and preserving a newer command's message. All 27 tests and site validation pass.
- Browser checks cover all three CV variants in Swedish and English at 320px, the 960px desktop layout, section/history focus, F1 and command results, Programs → mIRC → focus restoration, light/dark frames and the no-JavaScript fallback. No horizontal overflow, duplicate IDs or broken ARIA references were found in the checked mobile layouts. No browser console warnings or errors on the final normal preview.

No dependencies, fonts or professional claims were added. The CV's colours and structure are an accessible interpretation of a terminal, not a fixed-size emulator.

## Follow-up: Lunarstorm krypin and ISPF command placement

- Rebuilt contact around the compact orange headers, blue navigation and personally decorated presentation seen in [Lunarstorm's own 2006 demo (page 12)](https://arkiv.internetdagarna.se/2006/65-e-mobbning/bjarneotterdahl.pdf#page=12). The profile uses exposure_, a small illustrated retrocomputer, real contact links and a local mIRC shortcut. No fabricated visitors, friends, messages or activity were added.
- Email and professional links remain above the longer presentation, including at 320px. Navigation anchors, visible link names and mIRC open/close with focus restoration were checked. Small orange-header text was adjusted for readable contrast.
- Moved the always-visible Command ===> field directly below the panel title. Compact labeled identity fields and flat section choices replace the larger heading and tab treatment; F1/F3 remain at the bottom. [IBM's current ISPF options](https://www.ibm.com/docs/en/zos/3.1.0?topic=fields-select-options) allow command placement at either the top or bottom; this portfolio deliberately uses the top configuration.
- F1, both help buttons and the help command share one inline help panel. There is no automatic input focus. The obsolete terminal disclosure and its event handler were removed.
- Site validation and all 27 native regression tests pass. Fresh browser checks covered all six language/variant combinations at 320px, desktop layouts, command results, history focus, F1 toggling and slow-loading feedback. No overflow, duplicate IDs or broken ARIA references appeared in the checked mobile layouts.
- The no-JavaScript fallback remains readable. Print CSS at an A4-like content width shows all populated sections and full profile URLs while hiding command/navigation controls. This verifies layout styles, not native PDF pagination.

No dependencies were added. Shared-world CSS changes are confined to Lunarstorm, preserving the other program designs.

## Follow-up: whole-site shell and navigation audit

All five main pages now use the same desktop shortcuts, Start menu, taskbar, clock, theme control and system dialog. The CV reuses portfolio.js for these behaviours; its separate theme listener and duplicate Programs launcher were removed. Its toolbar keeps language and print controls. Window controls and active desktop markers share the same CSS. Contact no longer loads the unused world-panel script.

Repaired behaviours:

- Active-page links return to the current content instead of reloading and resetting the selected project or quest. Start links identify the active program consistently.
- Project/quest history preserves the selected pane through ordinary anchors such as the taskbar's #main, including Back/Forward and focus recovery.
- F1/F3 do not interrupt the non-modal Winamp window. Shared desktop preferences refresh when a document is restored from browser cache.
- Notes refresh from session storage both on restoration and when opened. A real browser check caught form restoration overwriting the first fix; rereading on open also passed the CV → Contact → Back reproduction, including preserving the latest edit.
- Mobile title bars use the same readable labels and controls. Start's maximum height accounts for the device's safe bottom inset.
- The 404 recovery stays on the current host. Without JavaScript, all personal/project sections remain readable and the first section is no longer incorrectly labelled current.

Verification:

- Static validation covers shared shell elements and navigation order/destinations in addition to links, IDs, assets and data. Deliberately broken shell, external menu and 404 links were rejected in a temporary validation copy.
- The native test suite covers 29 CV/shared-theme cases, a world-pane history regression sequence, and four note persistence cases. No dependencies were added.
- Browser layouts checked for all five main pages at 320, 651, 768, 960 and 1440 pixels, with no horizontal overflow, duplicate IDs or unnamed visible controls in the checked matrices. Start, theme and system-dialog focus were exercised on all five pages. A 320 × 390 viewport confirmed the Start menu scrolls within the screen and Notepad remains usable.
- All five CV sections were clicked in each of the six language/variant combinations. English CV → Projects → linked role preserves English and selects the correct experience. All WoW panes, both project panes and history through the taskbar were exercised.
- Winamp play/pause, stop, previous/next, playlist, seek, compact mode, Escape and focus return were exercised. F1/F3 stay within the CV page while Winamp has focus. mIRC commands, input history/draft restoration, plain-text rendering and /winamp transition passed. Notes were restored to their prior contents after the browser check.
- All five pages remain readable at 320px with scripts removed. CV print styles at an A4-like content width hide the entire desktop shell and show populated sections with complete profile URLs. Native PDF pagination remains unverified in this environment.
- The real local 404 recovered to localhost. GitHub profile and repository links returned HTTP 200. LinkedIn rejected automated retrieval (HTTP 999), so its external page availability is not claimed as verified. Email destination was inspected without sending mail.

The preserved hierarchy is desktop → program → content. Desktop shortcuts, the window menu and Start are consistent alternatives; each program retains its own inner visual language.
