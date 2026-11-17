# Content guidance

This directory contains editorial guidance and historical design and quality reviews. It is not a second source of live copy or a store for private interview notes.

Published page copy lives in `index.html`, `about.html`, `projects.html` and `contact.html`. The CV uses `assets/data/resume-data.json` and optional overrides in `assets/data/variants/`. Run `npm run cv:sync` to regenerate the Swedish fallback in `resume.html`.

## Structure

- `portfolio-texts.md` — Page responsibilities, positioning and publication boundaries.
- `resume-texts.md` — CV variants, factual consistency and role descriptions.
- `snippets.md` — Shared tone and wording guidance.
- `*-review.md` — Historical review records. Their checks describe the version reviewed, not later changes; preserve those records and report new verification separately.

Keep private career notes, unpublished employer details and sensitive personal information out of this public repository. Existing copy is not independent verification of a claim.
