# Portfolio worlds — release review, 2026-09-26

The Windows 2000 overview is retained. The new programs are a mainframe CV, a WoW-inspired personal quest log, a CS 1.3-inspired project browser and a Lunarstorm-inspired contact profile. Winamp, mIRC and Notepad are optional extras. No dependencies, hosting changes, audio, analytics or external chat services were added.

## Validation performed

- Site validation and JavaScript syntax checks pass; no whitespace errors in the diff.
- All five pages fit a 320 px viewport without horizontal overflow. Desktop layouts and a 390 px mobile layout were visually inspected.
- Navigation, direct links, selected panels and browser back/forward were exercised. An independent review found and fixed inconsistent project selection when returning through the taskbar anchor.
- All three CV variants were exercised in both Swedish and English, including panel changes, language changes, keyboard navigation and commands. Targeted native Node checks covered failed data loads, stale requests and keyboard shortcuts inside inputs.
- A temporary local server stripped script tags to check that every page remains readable without JavaScript. The CV retains its static English Core Systems fallback.
- Safari's native print preview produced two A4 pages for the Swedish Platform variant. Print styles were also visually inspected through a temporary local CSS override: all five sections were present with black text on white. A saved, paginated PDF was not rendered separately.
- Winamp play, pause, next, compact mode, closing and focus restoration were exercised. The player has no audio element, audio API or music request.
- mIRC commands, the transition to Winamp, Escape, focus restoration and literal rendering of HTML-like input were checked. Chat remains local and bounded.
- Notepad retained a test edit across reload in the same tab; the note was then reset. Storage failures have an in-memory fallback.
- The shared dark theme, Start menu, dialogs and terminal extras were exercised. No warnings or errors appeared in the tested browser flows.

Responsive checks use browser viewport overrides, not a physical phone. Print pagination may vary between browsers. No claim of exhaustive browser or assistive-technology coverage is made.

## Deliberate content choices

Music names remain explicit demo tracks until a playlist is supplied. Character, guild and specific world-first details remain unspecified. Professional content comes from the existing portfolio and CV data; no new achievement figures or internal bank assignment details were introduced.

The pre-existing local changes were preserved in a named Git stash before updating from the last published version.
