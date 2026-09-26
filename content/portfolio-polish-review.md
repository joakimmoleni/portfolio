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
