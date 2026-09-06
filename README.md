# Joakim Moléni — Portfolio

A static, Windows 2000-inspired personal portfolio built with HTML, CSS and vanilla JavaScript. No runtime dependencies or build step.

## Features

- One open main window; normal scrolling and direct anchor links
- Mobile layout with vertical content and touch targets
- Start navigation and an optional native system-properties dialog
- Persistent light/dark colour scheme, keyboard focus and reduced-motion support
- Three resume variants in Swedish and English, with direct URLs and print/PDF output
- Readable portfolio without JavaScript

## Source

- `index.html`, `assets/css/portfolio.css`, `assets/js/portfolio.js`: portfolio
- `resume.html`, `assets/css/resume.css`, `assets/js/resume-shell.js`, `assets/js/resume.js`: resume
- `assets/data/`: bilingual resume data and existing variant overrides
- `content/`: content constraints and asset provenance

Internal bank assignments and project/adoption figures are excluded from public copy and CV data. Public professional history and contact links are retained from the previous portfolio.

## Preview and validate

```sh
npm run dev
npm run validate
```

The preview serves `http://127.0.0.1:4173`. No install is necessary. The existing `python3 -m http.server 8000` workflow also works. Production remains plain static files at `portfolio.moleni.se`; no hosting or DNS changes are required.

## Visual references

Windows 2000 Professional screenshots from [GUIdebook](https://guidebookgallery.org/screenshots/win2000pro/): desktop and Display Properties. The CSS uses the classic Standard palette (#3a6ea5 desktop, #d4d0c8 system surface, #0a246a title bar), inset/raised borders and Tahoma with system fallbacks. Small functional SVG icons are drawn on a 32-pixel grid.
