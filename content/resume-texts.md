# Resume content

The source is `assets/data/resume-data.json`, with three overrides in `assets/data/variants/`. Preserve Swedish and English, and use the same facts in both languages.

The default is the broader career profile. Keep these stable URL IDs and this display order:

1. `platform-dev` — Helhetsprofil: technical work alongside business development, delivery and operational experience.
2. `mainframe-dev` — Stordator: mainframe and related systems experience.
3. `modern-dev` — Webb & backend: web, backend and related technical work.

An emphasis may select or shorten experience, but must not change its facts. Update every override affected by a correction, along with the static fallback in `resume.html`. Keep interface labels, language strings and default-selection behaviour consistent with the data.

The owner's corrections take precedence over old CV copy. In particular, Paf was an early administrative role performed remotely; do not describe it as Linux server administration, infrastructure ownership or software development. Sales was an early professional strength, with deeper software development following later.

Describe actual responsibilities without promoting them into unconfirmed official titles. Do not infer seniority, executive authority, full financial responsibility or measured outcomes from broad involvement. Existing titles, dates, technology lists and achievements are not automatically verified. Keep personal work distinct from team contributions and company performance, and completed work distinct from intentions.

Bank entries may include public, general responsibilities and working practices. Exclude internal assignments and project descriptions, test or deployment environments, LPAR details, adoption figures, privileged-access details and strategy plans. Do not invent achievements, business results or numbers. Do not store private interview notes here.
