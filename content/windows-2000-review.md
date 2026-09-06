# Windows 2000 redesign — review

## Scope

The existing `joakimmoleni/portfolio` static site is retained. There is no new hosting project, framework, backend or dependency installation. The public domain and original contact destinations are unchanged. Original anchor IDs and the resume's three variant IDs remain valid.

The portfolio, resume chrome and 404 page now share classic system colours and sharp inset/raised edges. Main content is ordinary HTML. Start is a disclosure navigation and About uses the native dialog element. The main window cannot be closed or dragged out of view. The optional dark scheme remains available.

Bank entries retain employer, dates, role and general technologies. Internal assignments, project descriptions and adoption figures have been removed from the visible portfolio, all CV overrides and the old copy drafts. Fragsheet and the public portfolio/CV are the selected examples.

## Verification

- Existing dependency-free site validator: passed, including all three resume JSON variants and 17 local references.
- Changed JavaScript syntax and `git diff --check`: passed.
- Browser visual review: desktop 1363 × 936; mobile content in a 360 × 800 iframe, also checked at 320px width. This is viewport testing, not a physical-phone test.
- Main navigation: anchor click and browser Back restored the expected URL.
- Start, About, Escape and return focus: checked in browser. Closing About returned focus to Start and left the main content visible.
- Mobile Start, theme switching and contact navigation: checked.
- Resume: all three variants loaded; English/Swedish switching, arrow-key tab navigation, direct variant URL and browser Back/Forward checked.
- 200% text at narrow width: an email/taskbar overflow was found and corrected; document scroll width then matched its client width.
- Mobile and desktop screenshots captured and visually inspected. Mobile CV and contact section also inspected.

The preview-only mobile harness is kept outside the production source. Print/PDF continues to use the browser's native print flow with dedicated A4 styles; physical printing and PDF pagination have not been separately certified. External contact links retain the existing verified destinations; no email was sent and no LinkedIn sign-in was performed.
