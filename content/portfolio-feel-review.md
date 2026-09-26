# Portfolio feel review — 2026-09-26

Reviewed the `4ad60b0` release with three agent workstreams covering visual references, terminal interaction and the small desktop programs. The target is a recognisable, usable interpretation of the periods, not a pixel-for-pixel emulator. Responsive layouts, readable text and accessible controls take priority over reproducing original screen limitations.

## Changes

- **Windows 2000:** retained the desktop, title bars, inset controls, taskbar and native pointer behaviour. The shared shell already provides the right continuity between programs.
- **Vanilla WoW:** moved the quest list above the parchment. The previous side-by-side layout resembled a wide quest-log addon. Added a compact metal frame and book emblem; removed unrelated inventory badges. Personal copy and normal links remain intact.
- **Counter-Strike 1.3 / WON:** replaced the generic graphite dashboard treatment with warm orange/yellow menu choices and descriptions alongside. Removed the decorative radar, scanlines, stamps and oversized lettering. The project descriptions stay readable.
- **Lunarstorm:** retained the orange/turquoise profile, krypin language and `exposure_` identity after reference comparison.
- **Mainframe / ISPF:** tightened spacing, reduced display-style headings and replaced raised section tabs with flat text choices. The panel identifier and translated title now follow the selected section. Added `END`; F1 works in the command field, while F3 protects unfinished commands. Replaced the internal encoding label with a translated read-only status. This remains an accessible web CV rather than a fixed 24-by-80 terminal emulator.
- **Winamp:** gave the player its own metallic Classic-inspired title bar, symbol transport controls, previous-track control, framed playlist and single-row Window Shade mode. Both play controls share the same playback state. It remains completely silent, with no media requests. Track names await the user's selections.
- **mIRC:** added bounded Up/Down command history with recovery of an unsent draft. Ordinary messages no longer receive repetitive bot replies. The local visitor nick is consistently `besokare`.
- **Notepad:** disabled modern spellchecking. Notes remain temporary and local to the tab.
- **Program launch:** collapse the Programs disclosure after choosing a program, so it does not cover Winamp on a narrow CV page. Closing the program restores focus to the disclosure summary.

The artwork uses existing HTML, CSS and SVG. No reference images, fonts, new dependencies or nonfunctional controls were added.

## References

- [Windows 2000 Professional screenshots, GUIdebook](https://guidebookgallery.org/screenshots/win2000pro/)
- [Wide Quest Log Plus, author's description of the expanded layout](https://www.curseforge.com/wow/addons/wide-quest-log-plus)
- [Counter-Strike WON menus by version](https://steamcommunity.com/sharedfiles/filedetails/?id=3359467114) — the guide distinguishes original menus from its later reconstructions.
- [Lunarstorm, Internetmuseum](https://internetmuseum.se/utstallningar/sociala-medier/lunarstorm/)
- [Winamp's player guide, Classic and Window Shade modes](https://support.winamp.com/winamp-desktop-player-for-windows)
- [mIRC keyboard combinations](https://www.mirc.com/help/html/key_combinations.html)
- [Microsoft's 2024 Notepad spellcheck announcement](https://blogs.windows.com/windows-insider/2024/03/21/spellcheck-in-notepad-begins-rolling-out-to-windows-insiders/)
- [IBM ISPF function keys](https://www.ibm.com/docs/en/zos/3.2.0?topic=selection-using-function-keys)
- [IBM ISPF menus](https://www.ibm.com/docs/en/zos/3.1.0?topic=types-menus)
- [IBM 3270 screen models](https://www.ibm.com/docs/en/personal-communications/15.0.0?topic=considerations-psid-definitions)

## Browser checks

- Desktop and 320 CSS-pixel layouts for the changed worlds; all five main pages checked at 320 pixels with no horizontal overflow, duplicate IDs or broken ARIA references in the rendered DOM.
- WoW/CS panel switching, heading focus, direct fragments and browser history.
- Winamp previous/next wrapping, play/pause in normal and shade modes, mobile controls, close/focus restoration and Start-menu stacking.
- mIRC command history, ordinary messages without bot replies, draft restoration and the `/winamp` handoff.
- Notepad opening/focus and the Lunarstorm mobile layout.
- CV section commands, translated panel identifiers/titles, F1 help from the command field, protection of an unfinished command from F3, empty-field F3 and `END` navigation. English CV at 320 CSS pixels has no horizontal overflow and keeps a 16px command input.
- The CV Programs menu now collapses on launch; normal and compact Winamp receive visible focus, and closing returns focus to the summary. mIRC receives input focus after the same launch flow.

`npm run validate`, all 16 native CV regression tests and `git diff --check` pass. Targeted extras event-handler checks also pass, including the disclosure/focus change. Print-specific CV typography remains explicit; the earlier release's print-preview check is not being presented as a new print test here.

These are targeted browser checks and design judgements, not a claim of exact historical reproduction or exhaustive device coverage.
