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
    id: '', dataset: {}, attributes: {}, children: [], textContent: '', innerHTML: '', value: '',
    classList: { toggle() {} },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name]; },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(name, handler) { handlers.set(name, handler); },
    fire(name) { return handlers.get(name)?.({ target: this, preventDefault() {} }); },
    focus() { this.onFocus?.(); }, querySelectorAll() { return []; },
    contains(node) { return node === this || this.children.includes(node); },
    matches(selector) { return selector === '.section-tab' && this.className === 'section-tab'; },
    closest(selector) { return selector === '[hidden]' && this.hidden ? this : null; },
    getBoundingClientRect() { return this.bounds || { top: 0, bottom: 100 }; },
    scrollIntoView() { this.scrolled = true; },
    appendChild(child) { this.children.push(child); },
    replaceChildren() { this.children = []; }
  };
}
async function page(search = '?lang=en&focus=mainframe-dev', responses = new Map(), storage = new Map()) {
  const nodes = new Map();
  for (const id of ['resumeContent', 'resumeStatus', 'resumePanelId', 'resumePanelTitle', 'langEnBtn', 'langSvBtn', 'variantList', 'commandFeedback', 'btnExportPdf', 'resumeTerminal', 'resumeCommandForm', 'resumeCommand', 'resumeHelp', 'themeToggle']) nodes.set(id, element());
  nodes.get('resumeHelp').hidden = true;
  nodes.get('resumeTerminal').open = false;
  const sectionTabs = [];
  const panels = ['profile', 'work', 'skills', 'education', 'projects'].map(panel => {
    const section = element();
    section.dataset.panel = panel;
    nodes.set(`resume-${panel}`, section);
    const tab = element();
    tab.dataset.panel = panel;
    tab.className = 'section-tab';
    sectionTabs.push(tab);
    nodes.set(`section-tab-${panel}`, tab);
    return section;
  });
  const listeners = new Map();
  const documentListeners = new Map();
  let currentUrl = new URL(`https://portfolio.example/resume.html${search}`);
  let dialogOpen = false;
  let printCount = 0;
  const location = {
    get href() { return currentUrl.href; },
    set href(value) { currentUrl = new URL(value, currentUrl); },
    get search() { return currentUrl.search; },
    get searchParams() { return currentUrl.searchParams; },
    toString() { return currentUrl.href; }
  };
  const document = {
    body: element(), documentElement: { lang: 'en', dataset: {} }, title: '', activeElement: null,
    getElementById: id => nodes.get(id) || null,
    createElement: element,
    querySelector: selector => selector === 'dialog[open]' && dialogOpen ? element() : null,
    querySelectorAll(selector) {
      if (selector === '#variantList .tab-btn') return nodes.get('variantList').children;
      if (selector === '.resume-panel') return panels;
      if (selector === '.section-tab') return sectionTabs;
      return [];
    },
    addEventListener: (name, listener) => documentListeners.set(name, listener)
  };
  document.activeElement = document.body;
  for (const [id, node] of nodes) {
    node.id = id;
    node.onFocus = () => { document.activeElement = node; };
  }
  const content = nodes.get('resumeContent');
  content.contains = node => node === content || panels.includes(node) || sectionTabs.includes(node);
  content.querySelectorAll = selector => selector === '.section-tab' ? sectionTabs : [];
  let contentMarkup = '';
  Object.defineProperty(content, 'innerHTML', {
    get: () => contentMarkup,
    set(markup) {
      // Replacing real DOM children drops their focus; retain ID lookups in this stand-in.
      if (document.activeElement !== content && content.contains(document.activeElement)) document.activeElement = document.body;
      contentMarkup = markup;
    }
  });
  const context = vm.createContext({
    document, location, URL, URLSearchParams, innerHeight: 800, console: { error() {} },
    print() { printCount += 1; },
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
    nodes, responses, location, listeners, document, storage,
    printed: () => printCount,
    clickVariant: id => nodes.get('variantList').children.find(button => button.dataset.variant === id).fire('click'),
    selectedVariant: () => nodes.get('variantList').children.find(button => button.getAttribute('aria-selected') === 'true')?.dataset.variant ?? null,
    setLanguage: lang => nodes.get(lang === 'sv' ? 'langSvBtn' : 'langEnBtn').fire('click'),
    setDialogOpen: value => { dialogOpen = value; },
    pressKey(key, { field = null, ...properties } = {}) {
      const event = {
        key, defaultPrevented: false, ...properties,
        target: { closest: () => field === 'command' ? nodes.get('resumeCommand') : field },
        preventDefault() { this.defaultPrevented = true; }
      };
      documentListeners.get('keydown')(event);
      return event.defaultPrevented;
    },
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
  assert.match(nodes.get('resumeStatus').textContent, /Webb & backend/);
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
  assert.match(nodes.get('resumeStatus').textContent, /Webb & backend/);
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
  assert.equal(nodes.get('resumePanelId').textContent, 'JM02');
  assert.equal(nodes.get('resumePanelTitle').textContent, 'CV / ERFARENHET');
  location.href = 'https://portfolio.example/resume.html?lang=en&focus=mainframe-dev&panel=skills';
  listeners.get('popstate')();
  await settle();
  assert.equal(nodes.get('langEnBtn').getAttribute('aria-pressed'), 'true');
  assert.equal(selectedVariant(), core.id);
  assert.equal(nodes.get('resume-skills').hidden, false);
  assert.equal(nodes.get('resume-work').hidden, true);
  assert.equal(nodes.get('resumePanelId').textContent, 'JM03');
  assert.equal(nodes.get('resumePanelTitle').textContent, 'RESUME / SKILLS');
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

await test('the panel line follows section and language changes', async () => {
  const { nodes, command, setLanguage } = await page('?lang=en&focus=mainframe-dev&panel=projects');
  assert.equal(nodes.get('resumePanelId').textContent, 'JM05');
  assert.equal(nodes.get('resumePanelTitle').textContent, 'RESUME / SELECTED PROJECTS');
  setLanguage('sv');
  assert.equal(nodes.get('resumePanelTitle').textContent, 'CV / UTVALDA PROJEKT');
  command('profile');
  assert.equal(nodes.get('resumePanelId').textContent, 'JM01');
  assert.equal(nodes.get('resumePanelTitle').textContent, 'CV / PROFIL');
});

await test('generic CV entry defaults to Swedish and preserves a chosen language on return', async () => {
  const first = await page('');
  assert.equal(first.document.documentElement.lang, 'sv');
  assert.equal(first.location.searchParams.get('lang'), 'sv');
  first.setLanguage('en');
  const returning = await page('', new Map(), first.storage);
  assert.equal(returning.document.documentElement.lang, 'en');
  const explicit = await page('?lang=sv', new Map(), first.storage);
  assert.equal(explicit.document.documentElement.lang, 'sv');
  assert.equal(explicit.nodes.get('variantList').children[0].textContent, 'Stordator');
});

await test('history keeps focus on the active CV section after replacing content', async () => {
  const { nodes, location, listeners, document } = await page('?lang=sv&panel=work');
  nodes.get('section-tab-work').focus();
  location.href = '?lang=sv&focus=mainframe-dev&panel=skills';
  listeners.get('popstate')();
  await settle();
  assert.equal(document.activeElement.id, 'section-tab-skills');
  nodes.get('resume-skills').focus();
  location.href = '?lang=en&focus=mainframe-dev';
  listeners.get('popstate')();
  await settle();
  assert.equal(document.activeElement.id, 'resume-profile');
});

await test('a variant finishing loading does not steal focus from the command field', async () => {
  const { nodes, clickVariant, responses, document } = await page();
  const pending = delayedResponse();
  responses.set(modern.path, pending.get);
  const request = clickVariant(modern.id);
  nodes.get('resumeCommand').focus();
  pending.finish(files.get(modern.path));
  await request;
  assert.equal(document.activeElement.id, 'resumeCommand');
});

await test('an empty project section links to the portfolio cases', async () => {
  const { nodes, setLanguage } = await page('?lang=sv&focus=mainframe-dev&panel=projects');
  assert.match(nodes.get('resumeContent').innerHTML, /href="\.\/projects\.html">Se projekt i portfolion/);
  setLanguage('en');
  assert.match(nodes.get('resumeContent').innerHTML, /href="\.\/projects\.html">View projects in the portfolio/);
});

await test('a section command focuses its result and scrolls when it is above the viewport', async () => {
  const { nodes, command, document } = await page();
  const panel = nodes.get('resume-work');
  panel.bounds = { top: -300, bottom: -20 };
  nodes.get('resumeCommand').focus();
  command('work');
  assert.equal(document.activeElement, panel);
  assert.equal(panel.scrolled, true);
});

await test('known commands report initial loading or failure while unknown commands remain unknown', async () => {
  const pending = delayedResponse();
  const { nodes, command, document } = await page('?lang=sv', new Map([['./assets/data/resume-data.json', pending.get]]));
  nodes.get('resumeCommand').focus();
  for (const state of ['loading', 'error']) {
    assert.equal(nodes.get('resumeStatus').dataset.state, state);
    for (const value of ['work', 'skills', 'erfarenhet', '1', '2', '3']) {
      command(value);
      assert.equal(nodes.get('commandFeedback').textContent, nodes.get('resumeStatus').textContent);
      assert.equal(document.activeElement.id, 'resumeCommand');
    }
    command('unknown');
    assert.match(nodes.get('commandFeedback').textContent, /Okänt kommando: unknown/);
    if (state === 'loading') {
      pending.fail();
      await settle();
    }
  }
});

await test('a successful variant command reveals the result without stealing later focus', async () => {
  for (const moveFocus of [false, true]) {
    const { nodes, command, responses, document } = await page();
    const pending = delayedResponse();
    responses.set(modern.path, pending.get);
    nodes.get('resumeCommand').focus();
    command('2');
    if (moveFocus) nodes.get('langSvBtn').focus();
    pending.finish(files.get(modern.path));
    await settle();
    assert.equal(document.activeElement.id, moveFocus ? 'langSvBtn' : 'resume-profile');
  }
});

await test('a failed variant command reports the error beside the command field', async () => {
  const { nodes, command, responses, document } = await page();
  responses.set(modern.path, fail);
  nodes.get('resumeCommand').focus();
  command('2');
  await settle();
  assert.equal(document.activeElement.id, 'resumeCommand');
  assert.match(nodes.get('commandFeedback').textContent, /could not be loaded/);
});

await test('printing waits for pending data and is restored after success or failure', async () => {
  for (const result of ['success', 'failure']) {
    const { nodes, command, clickVariant, responses, printed } = await page();
    const pending = delayedResponse();
    responses.set(modern.path, pending.get);
    const request = clickVariant(modern.id);
    assert.equal(nodes.get('btnExportPdf').disabled, true);
    command('print');
    assert.equal(printed(), 0);
    assert.match(nodes.get('commandFeedback').textContent, /resume is loading/);
    if (result === 'success') pending.finish(files.get(modern.path));
    else pending.fail();
    await request;
    assert.equal(nodes.get('btnExportPdf').disabled, false);
    command('pdf');
    assert.equal(printed(), 1);
  }
});

await test('END exits to the desktop, like home and exit', async () => {
  for (const value of [' end ', 'HOME', 'exit']) {
    const { command, location } = await page();
    command(value);
    assert.equal(location.href, 'https://portfolio.example/index.html');
  }
});

await test('F1 toggles help in the command field without changing its text', async () => {
  const { nodes, pressKey, document } = await page();
  nodes.get('resumeCommand').value = 'skills';
  assert.equal(pressKey('F1', { field: 'command' }), true);
  assert.equal(nodes.get('resumeHelp').hidden, false);
  assert.equal(nodes.get('resumeTerminal').open, true);
  assert.equal(document.activeElement.id, 'resumeHelp');
  assert.equal(nodes.get('resumeCommand').value, 'skills');
  pressKey('F1', { field: 'command' });
  assert.equal(nodes.get('resumeHelp').hidden, true);
  assert.equal(document.activeElement.id, 'resumeCommand');
});

await test('closing terminal commands clears help state and F1 reopens visible help', async () => {
  const { nodes, pressKey, document } = await page();
  pressKey('F1');
  const terminal = nodes.get('resumeTerminal');
  terminal.open = false;
  terminal.fire('toggle');
  assert.equal(nodes.get('resumeHelp').hidden, true);
  pressKey('F1');
  assert.equal(terminal.open, true);
  assert.equal(nodes.get('resumeHelp').hidden, false);
  assert.equal(document.activeElement.id, 'resumeHelp');
});

await test('F3 protects an unfinished command and exits from an empty command field', async () => {
  const { nodes, pressKey, location } = await page();
  const initialUrl = location.href;
  nodes.get('resumeCommand').value = 'skills';
  assert.equal(pressKey('F3', { field: 'command' }), false);
  assert.equal(location.href, initialUrl);
  assert.equal(nodes.get('resumeCommand').value, 'skills');
  nodes.get('resumeCommand').value = '  ';
  assert.equal(pressKey('F3', { field: 'command' }), true);
  assert.equal(location.href, 'https://portfolio.example/index.html');
});

await test('terminal shortcuts remain inactive in other fields, dialogs, composition and modified events', async () => {
  const { nodes, pressKey, setDialogOpen, location } = await page();
  const initialUrl = location.href;
  for (const key of ['F1', 'F3']) {
    for (const field of ['input', 'textarea', 'select', 'contenteditable']) {
      assert.equal(pressKey(key, { field: { nodeName: field, value: '' } }), false);
    }
    for (const flag of ['shiftKey', 'ctrlKey', 'altKey', 'metaKey', 'isComposing']) {
      assert.equal(pressKey(key, { field: 'command', [flag]: true }), false);
    }
    pressKey(key, { defaultPrevented: true });
    setDialogOpen(true);
    assert.equal(pressKey(key, { field: 'command' }), false);
    setDialogOpen(false);
  }
  assert.equal(nodes.get('resumeHelp').hidden, true);
  assert.equal(location.href, initialUrl);
});

await test('F1 and F3 still work outside input fields', async () => {
  const { nodes, pressKey, location } = await page();
  assert.equal(pressKey('F1'), true);
  assert.equal(nodes.get('resumeHelp').hidden, false);
  assert.equal(pressKey('F3'), true);
  assert.equal(location.href, 'https://portfolio.example/index.html');
});

for (const result of results) if (result.passed) console.log(`PASS ${result.name}`);
if (results.some(result => !result.passed)) process.exitCode = 1;
