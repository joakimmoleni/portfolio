import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shellSource = readFileSync(path.join(root, 'assets/js/resume-shell.js'), 'utf8');
const resumeSource = readFileSync(path.join(root, 'assets/js/resume.js'), 'utf8');
const base = JSON.parse(readFileSync(path.join(root, 'assets/data/resume-data.json'), 'utf8'));
const files = new Map([
  ['./assets/data/resume-data.json', base],
  ...base.variants.map(variant => [variant.path, JSON.parse(readFileSync(path.join(root, variant.path), 'utf8'))])
]);
const [core, modern, platform] = base.variants;
const settle = () => new Promise(resolve => setImmediate(resolve));

// A small DOM stand-in for state tests. Browser checks cover layout and real focus.
function element() {
  const handlers = new Map();
  return {
    dataset: {}, attributes: {}, children: [], textContent: '', innerHTML: '',
    classList: { toggle() {} },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name]; },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(name, handler) { handlers.set(name, handler); },
    fire(name) { return handlers.get(name)?.({ target: this, preventDefault() {} }); },
    focus() {}, querySelectorAll() { return []; },
    appendChild(child) { this.children.push(child); },
    replaceChildren() { this.children = []; }
  };
}
async function page(search = '?lang=en&focus=mainframe-dev', responses = new Map()) {
  const nodes = new Map();
  for (const id of ['resumeContent', 'resumeStatus', 'langEnBtn', 'langSvBtn', 'variantList', 'commandFeedback', 'btnExportPdf', 'resumeCommandForm', 'resumeCommand', 'resumeHelp', 'themeToggle']) nodes.set(id, element());
  const panels = ['profile', 'work', 'skills', 'education', 'projects'].map(panel => {
    const section = element();
    section.dataset.panel = panel;
    nodes.set(`resume-${panel}`, section);
    return section;
  });
  const listeners = new Map();
  const storage = new Map();
  const location = new URL(`https://portfolio.example/resume.html${search}`);
  const document = {
    body: element(), documentElement: { lang: 'en', dataset: {} }, title: '',
    getElementById: id => nodes.get(id) || null,
    createElement: element,
    querySelector: () => null,
    querySelectorAll(selector) {
      if (selector === '#variantList .tab-btn') return nodes.get('variantList').children;
      if (selector === '.resume-panel') return panels;
      return [];
    },
    addEventListener() {}
  };
  const context = vm.createContext({
    document, location, URL, URLSearchParams, console: { error() {} },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    history: {
      pushState(_state, _title, url) { location.href = new URL(url, location).href; },
      replaceState(_state, _title, url) { location.href = new URL(url, location).href; }
    },
    addEventListener: (name, listener) => listeners.set(name, listener),
    async fetch(file) {
      if (responses.has(file)) return responses.get(file)();
      if (!files.has(file)) throw new Error(`Unexpected request: ${file}`);
      return { ok: true, json: async () => files.get(file) };
    }
  });
  context.window = context;
  vm.runInContext(shellSource, context, { filename: 'resume-shell.js' });
  vm.runInContext(resumeSource, context, { filename: 'resume.js' });
  await settle();
  return {
    nodes, responses, location, listeners,
    clickVariant: id => nodes.get('variantList').children.find(button => button.dataset.variant === id).fire('click'),
    selectedVariant: () => nodes.get('variantList').children.find(button => button.getAttribute('aria-selected') === 'true')?.dataset.variant ?? null,
    setLanguage: lang => nodes.get(lang === 'sv' ? 'langSvBtn' : 'langEnBtn').fire('click'),
    command(value) {
      nodes.get('resumeCommand').value = value;
      nodes.get('resumeCommandForm').fire('submit');
    }
  };
}
function fail() { throw new Error('Network unavailable'); }
function delayedResponse() {
  let resolve, reject;
  const promise = new Promise((done, failed) => { resolve = done; reject = failed; });
  return {
    get: () => promise,
    finish: data => resolve({ ok: true, json: async () => data }),
    fail: () => reject(new Error('Network unavailable'))
  };
}

const results = [];
async function test(name, run) {
  try { await run(); results.push({ name, passed: true }); }
  catch (error) { results.push({ name, passed: false }); console.error(`FAIL ${name}: ${error.message}`); }
}

await test('failed variant keeps the last successful CV and its error after a language change', async () => {
  const { clickVariant, selectedVariant, setLanguage, nodes, responses, location } = await page();
  responses.set(modern.path, fail);
  await clickVariant(modern.id);
  assert.equal(selectedVariant(), core.id);
  assert.equal(location.searchParams.get('focus'), core.id);
  assert.equal(nodes.get('resumeStatus').dataset.state, 'error');
  setLanguage('sv');
  assert.equal(nodes.get('resumeStatus').dataset.state, 'error');
  assert.match(nodes.get('resumeStatus').textContent, /Modern Backend/);
  assert.match(nodes.get('resumeContent').innerHTML, /Kärnsystemsprofil/);
});

await test('initial variant failure labels base data honestly and can be retried', async () => {
  const { clickVariant, selectedVariant, setLanguage, nodes, responses, location } = await page('?lang=sv&focus=modern-dev', new Map([[modern.path, fail]]));
  assert.equal(selectedVariant(), null);
  assert.notEqual(nodes.get('resumeContent').getAttribute('role'), 'tabpanel');
  assert.equal(location.searchParams.has('focus'), false);
  assert.match(nodes.get('resumeContent').innerHTML, /Grund-CV/);
  setLanguage('en');
  assert.equal(nodes.get('resumeStatus').dataset.state, 'error');
  assert.match(nodes.get('resumeContent').innerHTML, /Base resume/);
  responses.delete(modern.path);
  await clickVariant(modern.id);
  assert.equal(selectedVariant(), modern.id);
  assert.equal(nodes.get('resumeContent').getAttribute('aria-labelledby'), `tab-${modern.id}`);
  assert.equal(nodes.get('resumeStatus').dataset.state, 'ready');
  assert.match(nodes.get('resumeContent').innerHTML, /Backend profile/);
});

await test('changing language during a pending variant keeps the loading state', async () => {
  const { clickVariant, selectedVariant, setLanguage, nodes, responses } = await page();
  const pending = delayedResponse();
  responses.set(modern.path, pending.get);
  const request = clickVariant(modern.id);
  setLanguage('sv');
  assert.equal(nodes.get('resumeStatus').dataset.state, 'loading');
  assert.match(nodes.get('resumeStatus').textContent, /Modern Backend/);
  pending.finish(files.get(modern.path));
  await request;
  assert.equal(selectedVariant(), modern.id);
  assert.equal(nodes.get('resumeStatus').dataset.state, 'ready');
  assert.match(nodes.get('resumeContent').innerHTML, /Backendprofil/);
});

await test('changing language before the base file arrives preserves a linked variant', async () => {
  const pending = delayedResponse();
  const { selectedVariant, setLanguage, location } = await page('?lang=sv&focus=modern-dev', new Map([['./assets/data/resume-data.json', pending.get]]));
  setLanguage('en');
  assert.equal(location.searchParams.get('focus'), modern.id);
  pending.finish(base);
  await settle();
  assert.equal(selectedVariant(), modern.id);
  assert.equal(location.searchParams.get('lang'), 'en');
});

for (const result of ['success', 'failure']) {
  await test(`a stale ${result} cannot replace a newer successful selection`, async () => {
    const { clickVariant, selectedVariant, nodes, responses } = await page();
    const pending = delayedResponse();
    responses.set(modern.path, pending.get);
    const older = clickVariant(modern.id);
    await clickVariant(platform.id);
    if (result === 'success') pending.finish(files.get(modern.path));
    else pending.fail();
    await older;
    assert.equal(selectedVariant(), platform.id);
    assert.equal(nodes.get('resumeStatus').dataset.state, 'ready');
  });
}

await test('base-file failure remains an error after a language change', async () => {
  const { nodes, setLanguage } = await page('?lang=sv', new Map([['./assets/data/resume-data.json', fail]]));
  assert.equal(nodes.get('resumeStatus').dataset.state, 'error');
  assert.match(nodes.get('resumeStatus').textContent, /engelska kärnsystemsversionen/);
  setLanguage('en');
  assert.equal(nodes.get('resumeStatus').dataset.state, 'error');
  assert.match(nodes.get('resumeStatus').textContent, /saved English Core Systems CV/);
  assert.equal(nodes.get('resumeContent').getAttribute('aria-busy'), 'false');
});

await test('history restores language, focus and section', async () => {
  const { clickVariant, selectedVariant, setLanguage, command, nodes, location, listeners } = await page();
  await clickVariant(modern.id);
  setLanguage('sv');
  command('work');
  location.href = 'https://portfolio.example/resume.html?lang=en&focus=mainframe-dev&panel=skills';
  listeners.get('popstate')();
  await settle();
  assert.equal(nodes.get('langEnBtn').getAttribute('aria-pressed'), 'true');
  assert.equal(selectedVariant(), core.id);
  assert.equal(nodes.get('resume-skills').hidden, false);
  assert.equal(nodes.get('resume-work').hidden, true);
});

await test('failed history navigation keeps data and URL on the available variant', async () => {
  const { nodes, selectedVariant, responses, location, listeners } = await page();
  responses.set(modern.path, fail);
  location.href = 'https://portfolio.example/resume.html?lang=sv&focus=modern-dev&panel=work';
  listeners.get('popstate')();
  await settle();
  assert.equal(selectedVariant(), core.id);
  assert.equal(location.searchParams.get('focus'), core.id);
  assert.equal(nodes.get('resumeStatus').dataset.state, 'error');
  assert.equal(nodes.get('resume-work').hidden, false);
});

await test('theme name remains stable while its pressed state changes', async () => {
  const { nodes } = await page();
  const button = nodes.get('themeToggle');
  const name = button.getAttribute('aria-label');
  button.fire('click');
  assert.equal(button.getAttribute('aria-label'), name);
  assert.equal(button.getAttribute('aria-pressed'), 'true');
});

for (const result of results) if (result.passed) console.log(`PASS ${result.name}`);
if (results.some(result => !result.passed)) process.exitCode = 1;
