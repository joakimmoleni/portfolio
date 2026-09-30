# Joakim Moléni — Portfolio

A personal Windows 2000 desktop, with a few places to explore. Plain HTML, CSS and JavaScript; no runtime dependencies, install or build step.

## Programs

- `index.html`: a compact Windows 2000 desktop with a short introduction and four clear routes into the portfolio.
- `resume.html`: a mainframe-inspired CV with three perspectives on the same career, Swedish/English, clickable terminal panels and ordinary print/PDF output.
- `about.html`: a dungeon automap with four linked rooms and a reading journal.
- `projects.html`: five selected works in a pause menu over an original first-person industrial scene.
- `contact.html`: a Lunarstorm-inspired profile, using the personal nickname `exposure_`.
- Start → Program: a completely silent Winamp toy, a local mIRC bot and a temporary editable Notepad. They do not connect to chat servers or load music.

Winamp has a scrollable 16-track nostalgia playlist spanning dance, nu metal and classic rock, starting with Freestyler, Wait and Bleed, Detroit Rock City, 9 PM and Black Dog. Titles and a visual playback clock are the whole demo; there are no audio files. mIRC has three small Easter eggs: `/join #exposure_` opens a hidden local channel (return with `/join #lobby`); slapping the bot three times costs you the trout for the current page session; and `how much is the fish?` selects Scooter in Winamp. `/np` reports that selection, and `/winamp` opens the player. The hidden channel's delayed greeting is cancelled when leaving, minimizing or closing it. Track 7 appears as `Track07.mp3`; selecting it reveals a Spårinformation disclosure with Unknown artist/album, Other genre and a comment pointing to the hidden channel.

All five main programs share the same desktop shortcuts, Start menu, taskbar, theme control and system dialog. Theme and extras live in Start; the CV toolbar contains only its language and print controls. Each main program has its own URL. Ordinary links and browser history keep navigation predictable; closing a program returns to the desktop. The original homepage anchor IDs and resume variant URLs remain valid. The home overview and personal pages remain readable without JavaScript.

The light/dark preference applies to reading surfaces, controls and open mIRC/Notepad windows, and syncs between open tabs. The Start menu keeps a stable label with a visible checkmark for dark mode. Winamp retains its own skin.

Start opens with a short slide; its Programs submenu opens to the side when the screen has room, and inline on smaller screens. Program windows remain non-modal, with a distinct active titlebar. mIRC can be minimized to the taskbar without losing its draft or chat history. Opening animations respect reduced-motion preferences.

The CV opens in Swedish for new visitors and preserves the chosen language on return. Its command line stays visible below the panel title; using it is optional, and all sections also have ordinary clickable controls. F1 opens help beside the field, and the function-key row sits below the panel content.

The full profile opens first; mainframe and web/backend views adjust emphasis while retaining earlier experience. Existing focus URLs remain valid.

The resume continues to use `assets/data/resume-data.json` and its three variant overrides. Public copy describes general bank responsibilities, not internal assignments, environments or unverified project/adoption figures. Earlier career entries cover sales, business development, customer websites, production and logistics. The personal narrative is deliberately selective: employers remain in CV and project headings, while private anecdotes and explanations of the interface references stay out of the page copy.

## Preview and validate

```sh
npm run dev
npm run validate
npm test
```

Preview: `http://127.0.0.1:4173`. Validation covers local links/assets, duplicate IDs and fragment targets (including links between pages), canonical URLs, shared desktop structure and navigation, JavaScript syntax, resume data and the silent-player requirement. The native Node regression tests cover CV loading failures, retries, competing requests, language changes, history, focus restoration, terminal keyboard behaviour, printing during loading, theme changes between tabs, project/journal history through taskbar anchors, and restoring the latest local note. They test state through UI events; real browser checks cover layout and focus. All tooling uses Node's standard library only.

Production is GitHub Pages from `main`, at `https://portfolio.moleni.se/`. No hosting or DNS change is required.

## Visual references

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
