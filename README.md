# Joakim Moléni — Portfolio

A personal Windows 2000 desktop, with a few places to explore. Plain HTML, CSS and JavaScript; no runtime dependencies, install or build step.

## Programs

- `index.html`: a compact Windows 2000 desktop with a short introduction and four clear routes into the portfolio.
- `resume.html`: a mainframe-inspired CV with three perspectives on the same career, Swedish/English, clickable terminal panels and ordinary print/PDF output.
- `about.html`: a reading journal with four linked chapters in an open book.
- `projects.html`: five selected works in a game-inspired selector, with project details and flow diagrams.
- `contact.html`: a Lunarstorm-inspired profile, using the personal nickname `exposure_`.
- Start → Program: a completely silent Winamp toy, a local mIRC bot and a temporary editable Notepad. They do not connect to chat servers or load music.

Winamp has a scrollable 16-track nostalgia playlist spanning dance, nu metal and classic rock, starting with Freestyler, Wait and Bleed, Detroit Rock City, 9 PM and Black Dog. Titles and a visual playback clock are the whole demo; there are no audio files. Selecting a playlist track starts its clock; Play/Pause, Stop, seeking and compact mode share the same playback state. Try `/whois exposure_` for the local nickname entry. There are also three small Easter eggs: `/join #exposure_` opens a hidden local channel (return with `/join #lobby`); slapping the bot three times costs you the trout for the current page session; and `how much is the fish?` selects Scooter in Winamp. `/np` reports that selection, and `/winamp` opens the player. The hidden channel's delayed greeting is cancelled when leaving, minimizing or closing it. Track 7 appears as `Track07.mp3`; selecting it reveals a Spårinformation disclosure with Unknown artist/album, Other genre and a comment pointing to the hidden channel.

All five main programs share the same desktop shortcuts, Start menu, taskbar, theme control, language switch and system dialog. Theme and extras live in Start. The CV toolbar has the print control. Each main program has its own URL. Ordinary links and browser history keep navigation predictable; closing a program returns to the desktop. The original homepage anchor IDs and resume variant URLs remain valid. The home overview and personal pages remain readable without JavaScript.

The light/dark preference applies to reading surfaces, controls and open mIRC/Notepad windows, and syncs between open tabs. The Start menu keeps a stable label with a visible checkmark for dark mode. Winamp retains its own skin.

Start opens with a short slide; its Programs submenu opens to the side when the screen has room, and inline on smaller screens. Program windows remain non-modal, with a distinct active titlebar. mIRC can be minimized to the taskbar without losing its draft or chat history. Opening animations respect reduced-motion preferences.

The portfolio opens in Swedish for new visitors. The SV / EN control beside the clock changes the current page in place. A shared link with `?lang=en` opens in English, including when local storage is unavailable. Personal copy is translated where it is authored, with the Swedish HTML as the no-script version. Keep both versions in sync and check that the English reads naturally aloud. Its command line stays visible below the panel title; using it is optional, and all sections also have ordinary clickable controls. F1 opens help beside the field, and the function-key row sits below the panel content. CV shortcuts remain available when mIRC is minimized or focus has returned from an extra window to the CV; they stay inactive inside extra windows and while a modal system dialog is open.

The full profile opens first; mainframe and web/backend views adjust emphasis while retaining earlier experience. Existing focus URLs remain valid.

The overview uses `assets/data/resume-data.json` directly. Two specialist profiles override selected fields and jobs. Project links open the matching employer in the CV. Run `npm run cv:sync` after changing base data to refresh the printable bilingual HTML fallback. Validation checks that it is current. Public copy describes general bank responsibilities, not internal assignments, environments or unverified project/adoption figures. Earlier career entries cover sales, business development, customer websites, production and logistics. The personal narrative is deliberately selective: employers remain in CV and project headings, while private anecdotes and explanations of the interface references stay out of the page copy.

Spökvarvet opens from its illustrated sleeve on the desktop. Steering works with the arrow keys, A/D and the two touch buttons. Releasing the steering on asphalt for 0.6 seconds starts a smooth speed increase to 115% over the next 0.9 seconds. Steering or reaching the gravel cancels the bonus. Running wide gradually bleeds speed. Going deeper into gravel costs more, with no time added at the finish. The last completed lap is recorded locally and becomes the ghost on the next run. Minimizing the window or leaving the tab pauses the race. After finishing, the player can use the frame as the portfolio desktop wallpaper and restore the original in Start.

Periapsis is a horizontal pixel shooter. Fly through three sectors of eight formations and intercept the flagship. Cells unlock twin lasers, prism fire, guided missiles and a paired salvo at 3, 6, 10 and 15 pickups. Early interceptions, unbroken kill chains and a fast, clean boss fight reward repeat runs. It supports arrow keys, WASD and relative dragging. Both games and the desktop programs have taskbar buttons and are listed in Start under Öppna fönster while open or minimized. Closing a game ends that run.


## Arcade scores

Both games have a shared top ten. Periapsis ranks points and Spökvarvet ranks lap ticks. A player enters three initials after finishing. The server filters initials and reproduces the game from its controls before ranking a score. It keeps just the ranked entries. The local preview uses Node 24+ and stores the two boards in `.local/arcade.sqlite`. Set `ARCADE_SCORE_DB=:memory:` for a disposable preview.

Production uses the Cloudflare Worker `moleni-arkad.jcrooge.workers.dev` with the D1 database `moleni-arkad-scores` bound as `DB`. The public endpoints are `/api/scores/space` and `/api/scores/rally`. The initial deployment bundle and schema are on the `arkad-deploy` branch under `cloudflare-deploy/`. When the game rules change, rebuild the server with the matching engines and deploy the Worker alongside the client.

## Preview and validate

```sh
npm run dev
npm run validate
npm test
```

Preview: `http://127.0.0.1:4173`. Validation covers local links/assets, duplicate IDs and fragment targets (including links between pages), canonical URLs, shared desktop structure and navigation, JavaScript syntax, resume data and the silent-player requirement. The native Node regression tests cover CV loading failures, retries, competing requests, language changes, history, focus restoration, terminal keyboard behaviour, printing during loading, theme changes between tabs, project/journal history through taskbar anchors, and restoring the latest local note. Controllable-clock tests also cover Winamp playback, pause/resume, seeking, playlist selection, stopping and compact mode, plus Stockholm minute boundaries and page restoration. They test state through UI events; real browser checks cover layout and focus. All tooling uses Node's standard library only.

GitHub Actions runs validation and tests on Node.js 24 for pushes and pull requests. No dependency installation is needed. The workflow reports check results; it does not deploy the site or configure branch protection.

Production is GitHub Pages from `main`, at `https://portfolio.moleni.se/`. No hosting or DNS change is required.

## Visual references

Keep interface changes tied to the task and the identity of each program. Give colour a consistent meaning and keep labels, type and icons readable. Use effects for meaningful feedback. Check rendered spacing, keyboard focus, touch targets and empty or unavailable states at both mobile and desktop widths.

The interface artwork is drawn in HTML, CSS and SVG. About uses a journal with chapters; Projects uses a compact FPS-style selector with a flow preview for each project. Contact has a persistent profile, content tabs and a separate mIRC launcher. Their page-specific styles live in `about-world.css`, `projects-world.css` and `contact-world.css`. All three use ordinary fragment links enhanced into panels; the content remains readable without JavaScript.

These references record the original desktop and game-specific direction; their images are not bundled:

- [Windows 2000 Professional, GUIdebook](https://guidebookgallery.org/screenshots/win2000pro/)
- [Original Counter-Strike WON menus by version](https://steamcommunity.com/sharedfiles/filedetails/?id=3359467114)
- [World of Warcraft's original quest log, 2004 screenshot](https://www.mobygames.com/game/15620/world-of-warcraft/screenshots/windows/91220/)
- [Lunarstorm, Internetmuseum](https://internetmuseum.se/utstallningar/sociala-medier/lunarstorm/)

The [feel review](content/portfolio-feel-review.md) records the later reference comparison, refinements and browser checks, including Winamp, mIRC and ISPF. The [polish review](content/portfolio-polish-review.md) records the subsequent content, navigation and responsive-layout pass.

## Link preview image

The pages share `assets/images/og-card-20260926-perspective.png` (1200 × 630).
Its editable source is `assets/images/og-card-source.svg`. Give a replacement image a new filename and update its page references to avoid stale sharing previews.
