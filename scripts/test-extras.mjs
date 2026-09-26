import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const source = readFileSync(new URL('../assets/js/extras.js', import.meta.url), 'utf8');
const noteKey = 'portfolio-extra-note-v1';

// Only the browser APIs used at startup and by note persistence are needed here.
// Real dialog focus, layout and the player controls are checked in the browser.
function page(storage, access = { blocked: false }) {
  class Element {
    constructor() {
      this.children = [];
      this.dataset = {};
      this.handlers = new Map();
      this.nodes = new Map();
      this.attributes = new Map();
      this.classList = { toggle() {} };
    }
    addEventListener(name, handler) { this.handlers.set(name, handler); }
    fire(name, properties = {}) { this.handlers.get(name)?.({ target: this, ...properties }); }
    closest(selector) { return selector === '[data-open-extra]' && this.dataset.openExtra ? this : null; }
    focus() {}
    setAttribute(name, value) { this.attributes.set(name, value); }
    append(...children) { this.children.push(...children); }
    querySelector(selector) {
      if (!this.nodes.has(selector)) this.nodes.set(selector, new Element());
      return this.nodes.get(selector);
    }
    querySelectorAll() { return []; }
  }
  class Dialog extends Element {
    showModal() { this.open = true; }
  }
  const nodes = new Map([
    ['extras-player', new Element()],
    ['extras-mirc', new Dialog()],
    ['extras-notepad', new Dialog()],
    ['extras-player-progress', new Element()],
    ['extras-chat-input', new Element()],
    ['extras-notepad-text', new Element()]
  ]);
  let inserted = false;
  const listeners = new Map();
  const documentListeners = new Map();
  const context = vm.createContext({
    HTMLElement: Element,
    HTMLDialogElement: Dialog,
    document: {
      body: { append() { inserted = true; } },
      getElementById: id => inserted ? nodes.get(id) : null,
      createElement: () => new Element(),
      querySelectorAll: () => [],
      addEventListener: (name, handler) => documentListeners.set(name, handler)
    },
    sessionStorage: {
      getItem(key) {
        if (access.blocked) throw new Error('Storage unavailable');
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (access.blocked) throw new Error('Storage unavailable');
        storage.set(key, value);
      }
    },
    addEventListener: (name, handler) => listeners.set(name, handler)
  });
  context.window = context;
  vm.runInContext(source, context, { filename: 'extras.js' });
  return {
    note: nodes.get('extras-notepad-text'),
    status: nodes.get('extras-notepad').querySelector('.extras-notepad-status'),
    restore() { listeners.get('pageshow')?.({ persisted: true }); },
    openNote() {
      const trigger = new Element();
      trigger.dataset.openExtra = 'notepad';
      documentListeners.get('click')({ target: trigger, preventDefault() {} });
    }
  };
}

test('a restored page reads notes edited on another page before the next edit', () => {
  const storage = new Map([[noteKey, 'First note']]);
  const first = page(storage);
  const second = page(storage);
  second.note.value = 'New text from another page';
  second.note.fire('input');

  first.restore();
  assert.equal(first.note.value, 'New text from another page');
  first.note.value += '\nContinued here';
  first.note.fire('input');
  assert.equal(storage.get(noteKey), 'New text from another page\nContinued here');
});

test('restoring an intentionally empty note does not bring back old text', () => {
  const storage = new Map([[noteKey, 'First note']]);
  const first = page(storage);
  storage.set(noteKey, '');
  first.restore();
  assert.equal(first.note.value, '');
});

test('opening notes replaces stale form values restored after pageshow', () => {
  const storage = new Map([[noteKey, 'First note']]);
  const first = page(storage);
  storage.set(noteKey, 'Latest note from another page');
  first.restore();
  first.note.value = 'First note';
  first.openNote();
  assert.equal(first.note.value, 'Latest note from another page');
  storage.set(noteKey, '');
  first.openNote();
  assert.equal(first.note.value, '');
});

test('unavailable session storage preserves the in-memory note and explains its lifetime', () => {
  const access = { blocked: true };
  const first = page(new Map(), access);
  first.note.value = 'Still editable';
  first.note.fire('input');
  first.restore();
  first.openNote();
  assert.equal(first.note.value, 'Still editable');
  assert.match(first.status.textContent, /Finns i minnet tills du lämnar sidan/);
});
