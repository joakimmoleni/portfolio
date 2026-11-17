// The published fallback is ordinary HTML, including when the JSON request fails.
import { readFile, writeFile } from 'node:fs/promises';

const page = new URL('../resume.html', import.meta.url);
const html = await readFile(page, 'utf8');
const cv = JSON.parse(await readFile(new URL('../assets/data/resume-data.json', import.meta.url), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const list = items => items.map(item => '<li>' + escape(item) + '</li>').join('');

function renderJob(job) {
  const years = job.years_sv || job.years;
  const dates = years ? `<span class="job-years">${escape(years)}</span>` : '';
  const heading = `<h3 class="job-company" id="job-${escape(job.id)}" tabindex="-1">${escape(job.company_sv || job.company)}</h3>`;
  return `            <article class="job"><div class="job-header">${heading}${dates}</div><p class="job-position">${escape(job.role_sv || job.role)}</p><ul class="job-highlights">${list(job.highlights_sv || job.highlights)}</ul></article>`;
}

const person = cv.personal;
const body = [
  `<h1>${escape(person.name)}</h1>`,
  `<p>${escape(person.title_sv)}</p>`,
  `<p>${escape(person.location_sv)} · <a href="mailto:${escape(person.email)}">${escape(person.email)}</a> · <a href="https://${escape(person.linkedin)}">LinkedIn</a> · <a href="https://${escape(person.github)}">GitHub</a></p>`,
  `<section><h2>Profil</h2>${cv.profile_sv.split(/\n\s*\n/).map(text => `<p>${escape(text)}</p>`).join('')}</section>`,
  `<section><h2>Erfarenhet</h2>\n${cv.experience.map(renderJob).join('\n')}\n          </section>`,
  `<section><h2>Kärnkompetens</h2><ul>${list(cv.coreStack_sv)}</ul></section>`,
  `<section><h2>Utbildning</h2>${cv.education.map(item => `<p>${escape(item.school)} — ${escape(item.degree_sv || item.degree)}</p><p>${escape(item.years_sv || item.years)}</p>`).join('')}</section>`,
  '<section><h2>Utvalda arbeten</h2><p><a href="./projects.html">Se några av arbetena i projektarkivet.</a></p></section>'
].map(line => '          ' + line).join('\n');

const region = /(?<=<!-- resume-fallback:start -->\n)[\s\S]*?(?=\n        <!-- resume-fallback:end -->)/;
if (!region.test(html)) throw new Error('Missing fallback markers in resume.html');
const next = html.replace(region, () => body);
if (next !== html) {
  if (process.argv.includes('--check')) throw new Error('Fallback CV is outdated. Run npm run cv:sync.');
  await writeFile(page, next);
}
