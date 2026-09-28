import { access, readFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
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
    return true;
  } catch {
    errors.push(`${source}: missing ${relativePath}`);
    return false;
  }
}

async function read(relativePath) {
  return readFile(path.resolve(root, relativePath), 'utf8');
}

const requiredFiles = [
  'index.html',
  'resume.html',
  'about.html',
  'projects.html',
  'contact.html',
  '404.html',
  'favicon.svg',
  'assets/css/portfolio.css',
  'assets/css/resume.css',
  'assets/css/worlds.css',
  'assets/css/about-world.css',
  'assets/css/projects-world.css',
  'assets/css/contact-world.css',
  'assets/css/extras.css',
  'assets/js/portfolio.js',
  'assets/js/resume.js',
  'assets/js/resume-shell.js',
  'assets/js/worlds.js',
  'assets/js/extras.js',
  'assets/images/og-card-20260926-perspective.png',
  'assets/images/mirc-icon.svg',
  'assets/images/winamp-icon.svg',
  'assets/images/notepad-icon.svg',
  'assets/data/resume-data.json'
];

await Promise.all(requiredFiles.map(file => exists(file, 'required files')));

const htmlFiles = ['index.html', 'resume.html', 'about.html', 'projects.html', 'contact.html', '404.html'];
const mainNavigation = ['/index.html', '/about.html', '/projects.html', '/resume.html', '/contact.html'];
for (const htmlFile of htmlFiles) {
  const html = await read(htmlFile);
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) errors.push(`${htmlFile}: duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);

  const references = [...html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g)].map(match => match[1]);
  for (const reference of references) {
    if (/^(?:https?:|mailto:|tel:|\/\/)/.test(reference)) continue;
    if (reference.startsWith('#')) {
      if (reference.length > 1 && !ids.includes(reference.slice(1))) errors.push(`${htmlFile}: missing anchor ${reference}`);
      continue;
    }
    const clean = reference.split(/[?#]/)[0];
    if (!clean) continue;
    const resolved = clean.startsWith('/')
      ? clean.slice(1)
      : path.relative(root, path.resolve(root, path.dirname(htmlFile), clean));
    const found = await exists(resolved, htmlFile);
    const fragment = reference.includes('#') ? reference.slice(reference.indexOf('#') + 1) : '';
    if (found && fragment && path.extname(resolved) === '.html') {
      const destination = await read(resolved);
      const destinationIds = [...destination.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
      if (!destinationIds.includes(fragment)) errors.push(`${htmlFile}: missing anchor ${reference}`);
    }
  }
  if (htmlFile !== '404.html') {
    const canonical = htmlFile === 'index.html' ? 'https://portfolio.moleni.se/' : `https://portfolio.moleni.se/${htmlFile}`;
    if (!html.includes(`rel="canonical" href="${canonical}"`)) errors.push(`${htmlFile}: canonical URL missing`);
    const classes = [...html.matchAll(/\sclass=["']([^"']+)["']/g)].flatMap(match => match[1].split(/\s+/));
    for (const className of ['desktop', 'desktop-shortcuts', 'taskbar', 'start-panel', 'about-dialog']) {
      if (!classes.includes(className)) errors.push(`${htmlFile}: missing shared shell .${className}`);
    }
    for (const id of ['startButton', 'startPanel', 'aboutDialog', 'themeToggle']) {
      if (!ids.includes(id)) errors.push(`${htmlFile}: missing shared shell #${id}`);
    }
    const menu = html.match(/<nav\b[^>]*\bclass=["'][^"']*\bwindow-menu\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
    const destinations = [...menu.matchAll(/\shref=["']([^"']+)["']/g)].map(match => {
      const destination = new URL(match[1].replaceAll('&amp;', '&'), `https://portfolio.moleni.se/${htmlFile}`);
      if (destination.origin !== 'https://portfolio.moleni.se') return destination.href;
      return destination.pathname === '/' ? '/index.html' : destination.pathname;
    });
    if (destinations.join('|') !== mainNavigation.join('|')) {
      errors.push(`${htmlFile}: main navigation must link to Desktop, About, Projects, CV and Contact in that order`);
    }
  }
}

for (const file of await readdir(path.join(root, 'assets/css'))) {
  if (!file.endsWith('.css')) continue;
  const css = await read(`assets/css/${file}`);
  for (const match of css.matchAll(/url\(["']?([^\s)'"\n]+)["']?\)/g)) {
    if (/^(?:data:|https?:|#)/.test(match[1])) continue;
    await exists(path.relative(root, path.resolve(root, 'assets/css', match[1].split(/[?#]/)[0])), file);
  }
}
for (const file of ['portfolio.js', 'resume.js', 'resume-shell.js', 'worlds.js', 'extras.js']) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, 'assets/js', file)], { encoding: 'utf8' });
  if (result.status !== 0) errors.push(`${file}: JavaScript syntax check failed: ${result.stderr.trim()}`);
}
const extras = await read('assets/js/extras.js');
if (/<audio\b|new\s+Audio\s*\(|\b(?:AudioContext|webkitAudioContext)\b/.test(extras)) {
  errors.push('extras.js: the nostalgic player must remain completely silent');
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
  ...htmlFiles,
  'assets/data/resume-data.json',
  ...(resumeData.variants || []).map(variant => variant.path.replace(/^\.\//, ''))
];
const unsupportedClaims = [
  /850\+/i,
  /50\+ (?:mainframe )?engineers/i,
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
if (!indexHtml.includes('https://portfolio.moleni.se/')) errors.push('index.html: production canonical URL missing');
if (!indexHtml.includes('application/ld+json')) errors.push('index.html: structured data missing');

const notFoundHtml = await read('404.html');
if (!/<a\b(?=[^>]*\bid=["']recoveryLink["'])(?=[^>]*\bhref=["']\/["'])[^>]*>/.test(notFoundHtml)) {
  errors.push('404.html: recoveryLink must target / so recovery stays on the current host');
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} issue${errors.length === 1 ? '' : 's'}:`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validation passed: ${requiredFiles.length} required files, ${resumeData.variants?.length || 0} resume variants, ${checked.size} local references.`);
}
