# Joakim Moléni — Portfolio

A personal Windows 2000 desktop, with a few places to explore. Plain HTML, CSS and JavaScript; no runtime dependencies, install or build step.

## Programs

- `index.html`: a compact Windows 2000 desktop with a short introduction and four clear routes into the portfolio.
- `resume.html`: a mainframe-inspired CV with three professional emphases, Swedish/English, clickable terminal panels and ordinary print/PDF output.
- `about.html`: a vanilla-WoW-inspired personal quest log.
- `projects.html`: two selected projects in a Counter-Strike 1.3-inspired project browser.
- `contact.html`: a Lunarstorm-inspired profile, using the personal nickname `exposure_`.
- Start → Program: a completely silent Winamp toy, a local mIRC bot and a temporary editable Notepad. They do not connect to chat servers or load music.

Each main program has its own URL. Ordinary links and browser history keep navigation predictable; closing a program returns to the desktop. The original homepage anchor IDs and resume variant URLs remain valid. The home overview and personal pages remain readable without JavaScript.

The CV opens in Swedish for new visitors and preserves the chosen language on return. Its command line is optional, below the CV; all sections also have ordinary clickable controls.

The resume continues to use `assets/data/resume-data.json` and its three variant overrides. Public copy does not include internal bank assignments or unverified project/adoption figures. Specific gaming achievements, character details and music selections are left out until supplied.

## Preview and validate

```sh
npm run dev
npm run validate
npm test
```

Preview: `http://127.0.0.1:4173`. Validation covers local links/assets, duplicate IDs and fragment targets (including links between pages), canonical URLs, JavaScript syntax, resume data and the silent-player requirement. The native Node regression tests cover CV loading failures, retries, competing requests, language changes, history, focus restoration, terminal keyboard behaviour and printing during loading. They test state through UI events; real browser checks cover layout and focus. All tooling uses Node's standard library only.

Production is GitHub Pages from `main`, at `https://portfolio.moleni.se/`. No hosting or DNS change is required.

## Visual references

The interface artwork is drawn in HTML, CSS and SVG. These references establish the periods and general visual language; their images are not bundled:

- [Windows 2000 Professional, GUIdebook](https://guidebookgallery.org/screenshots/win2000pro/)
- [Original Counter-Strike WON menus by version](https://steamcommunity.com/sharedfiles/filedetails/?id=3359467114)
- [World of Warcraft's original quest log, 2004 screenshot](https://www.mobygames.com/game/15620/world-of-warcraft/screenshots/windows/91220/)
- [Lunarstorm, Internetmuseum](https://internetmuseum.se/utstallningar/sociala-medier/lunarstorm/)

The [feel review](content/portfolio-feel-review.md) records the later reference comparison, refinements and browser checks, including Winamp, mIRC and ISPF. The [polish review](content/portfolio-polish-review.md) records the subsequent content, navigation and responsive-layout pass.

## Link preview image

The pages share `assets/images/og-card-20260907.png` (1200 × 630).
Its editable source is `assets/images/og-card-source.svg`. Give a replacement image a new filename and update its page references to avoid stale sharing previews.
