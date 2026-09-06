# Joakim Moléni — Portfolio

Personal portfolio and interactive resume builder. Static site built with HTML, CSS and vanilla JavaScript.

## Features

- Responsive editorial portfolio with persistent dark/light theme and original illustrations
- Multi-variant resume system (Core Systems, Modern Backend, Platform & Leadership)
- Print-optimized PDF export for resumes
- Native scrolling and anchor navigation, reduced-motion support and readable content without JavaScript
- Local validation for links, assets, resume data and unsafe unverified claims

## Structure

- `index.html` — Main portfolio page
- `resume.html` — Interactive resume with variant selector
- `assets/data/` — Resume data (JSON) with per-variant overrides
- `assets/css/` — Stylesheets (portfolio + resume)
- `assets/js/` — Scripts (portfolio + resume)
- `content/illustrations.md` — Generated illustration descriptions and provenance

## Run locally

Serve the repository so the resume JSON can load:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

## Validate

```sh
node scripts/validate-site.mjs
```

The validator is dependency-free and checks local asset paths, JSON variants, duplicate IDs, canonical metadata and a small denylist of claims that require factual verification.

## Contact

Joakim Moléni — [jcrooge@gmail.com](mailto:jcrooge@gmail.com)
