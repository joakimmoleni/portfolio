import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const checked = new Set();

async function exists(relativePath, source) {
  const absolutePath = path.resolve(root, relativePath);
  try {
    await access(absolutePath);
    checked.add(path.relative(root, absolutePath));
  } catch {
    errors.push(`${source}: missing ${relativePath}`);
  }
}

async function read(relativePath) {
  return readFile(path.resolve(root, relativePath), 'utf8');
}

const requiredFiles = [
  'index.html',
  'resume.html',
  '404.html',
  'favicon.svg',
  'assets/css/style.css',
  'assets/css/resume.css',
  'assets/js/script.js',
  'assets/js/resume.js',
  'assets/images/og-card.png',
  'assets/data/resume-data.json'
];

await Promise.all(requiredFiles.map(file => exists(file, 'required files')));

const htmlFiles = ['index.html', 'resume.html', '404.html'];
for (const htmlFile of htmlFiles) {
  const html = await read(htmlFile);
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) errors.push(`${htmlFile}: duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);

  const references = [...html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g)].map(match => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|#|\/)/.test(reference)) continue;
    const clean = reference.split(/[?#]/)[0];
    if (!clean) continue;
    const resolved = path.relative(root, path.resolve(root, path.dirname(htmlFile), clean));
    await exists(resolved, htmlFile);
  }
}

const resumeData = JSON.parse(await read('assets/data/resume-data.json'));
for (const variant of resumeData.variants || []) {
  const variantPath = variant.path?.replace(/^\.\//, '');
  if (!variantPath) {
    errors.push(`assets/data/resume-data.json: variant ${variant.id || '(unnamed)'} has no path`);
    continue;
  }
  await exists(variantPath, 'resume variant');
  try {
    JSON.parse(await read(variantPath));
  } catch (error) {
    errors.push(`${variantPath}: invalid JSON (${error.message})`);
  }
}

const publishableFiles = [
  'index.html',
  'resume.html',
  'assets/data/resume-data.json',
  ...(resumeData.variants || []).map(variant => variant.path.replace(/^\.\//, ''))
];
const unsupportedClaims = [
  /billions of SEK/i,
  /50-person/i,
  /one of (?:roughly )?fifteen/i,
  /one of ~15/i,
  /thousands of concurrent users/i,
  /99\.997%/i
];

for (const file of publishableFiles) {
  const contents = await read(file);
  for (const pattern of unsupportedClaims) {
    if (pattern.test(contents)) errors.push(`${file}: contains blocked unverified claim ${pattern}`);
  }
}

const indexHtml = await read('index.html');
if (!indexHtml.includes('https://joakimmoleni.github.io/portfolio/')) errors.push('index.html: production canonical URL missing');
if (!indexHtml.includes('application/ld+json')) errors.push('index.html: structured data missing');

const notFoundHtml = await read('404.html');
if (!notFoundHtml.includes('href="/portfolio/"')) errors.push('404.html: recovery link must target /portfolio/');

if (errors.length) {
  console.error(`Validation failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validation passed: ${requiredFiles.length} required files, ${resumeData.variants?.length || 0} resume variants, ${checked.size} local references.`);
}
