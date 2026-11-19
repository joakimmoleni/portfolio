// The published fallback is ordinary HTML, including when the JSON request fails.
import { readFile, writeFile } from 'node:fs/promises';

const page = new URL('../resume.html', import.meta.url);
const html = await readFile(page, 'utf8');
const cv = JSON.parse(await readFile(new URL('../assets/data/resume-data.json', import.meta.url), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function copy(tag, sv, en, attributes = '') {
  const translation = sv === en ? '' : ' data-en="' + escape(en) + '"';
  return `<${tag}${attributes}${translation}>${escape(sv)}</${tag}>`;
}
function list(sv, en) {
  // Translations can have different paragraph or bullet counts.
  return Array.from({length: Math.max(sv.length, en.length)}, (_, i) =>
    copy('li', sv[i] || '', en[i] || '')).join('');
}
function renderJob(job) {
  const dates = job.years ? copy('span', job.years_sv || job.years, job.years, ' class="job-years"') : '';
  const heading = copy('h3', job.company_sv || job.company, job.company, ` class="job-company" id="job-${escape(job.id)}" tabindex="-1"`);
  const role = copy('p', job.role_sv || job.role, job.role, ' class="job-position"');
  return `            <article class="job"><div class="job-header">${heading}${dates}</div>${role}<ul class="job-highlights">${list(job.highlights_sv || job.highlights, job.highlights)}</ul></article>`;
}

const person = cv.personal;
const svProfile = cv.profile_sv.split(/\n\s*\n/);
const enProfile = cv.profile.split(/\n\s*\n/);
const paragraphs = Array.from({length: Math.max(svProfile.length, enProfile.length)}, (_, i) =>
  copy('p', svProfile[i] || '', enProfile[i] || '')).join('');
const body = [
  `<h1>${escape(person.name)}</h1>`,
  copy('p', person.title_sv, person.title),
  `<p>${copy('span', person.location_sv, person.location)} · <a href="mailto:${escape(person.email)}">${escape(person.email)}</a> · <a href="https://${escape(person.linkedin)}">LinkedIn</a> · <a href="https://${escape(person.github)}">GitHub</a></p>`,
  `<section><h2 data-en="Profile">Profil</h2>${paragraphs}</section>`,
  `<section><h2 data-en="Experience">Erfarenhet</h2>\n${cv.experience.map(renderJob).join('\n')}\n          </section>`,
  `<section><h2 data-en="Core skills">Kärnkompetens</h2><ul>${list(cv.coreStack_sv, cv.coreStack)}</ul></section>`,
  `<section><h2 data-en="Education">Utbildning</h2>${cv.education.map(item => copy('p', item.school + ' — ' + (item.degree_sv || item.degree), item.school + ' — ' + item.degree) + copy('p', item.years_sv || item.years, item.years)).join('')}</section>`,
  '<section><h2 data-en="Selected work">Utvalda arbeten</h2><p><a href="./projects.html" data-en="Explore the project archive.">Se några av arbetena i projektarkivet.</a></p></section>'
].map(line => '          ' + line).join('\n');

const region = /(?<=<!-- resume-fallback:start -->\n)[\s\S]*?(?=\n        <!-- resume-fallback:end -->)/;
if (!region.test(html)) throw new Error('Missing fallback markers in resume.html');
const next = html.replace(region, () => body);
if (next !== html) {
  if (process.argv.includes('--check')) throw new Error('Fallback CV is outdated. Run npm run cv:sync.');
  await writeFile(page, next);
}
