import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const source = readFileSync(new URL('../assets/js/extras.js', import.meta.url), 'utf8');
const noteKey = 'portfolio-extra-note-v1';

// Only the browser APIs used by program state and note persistence are needed here.
// Real dialog focus, layout and the player controls are checked in the browser.
function page(storage, access = { blocked: false }) {
  class Element {
    constructor() {
      this.children = [];
      this.dataset = {};
      this.handlers = new Map();
      this.nodes = new Map();
      this.attributes = new Map();
      this.isConnected = true;
      this.classList = { toggle() {}, contains() { return false; } };
    }
    addEventListener(name, handler) { this.handlers.set(name, handler); }
    fire(name, properties = {}) { this.handlers.get(name)?.({ target: this, ...properties }); }
    closest(selector) {
      if (selector === '[data-open-extra]' && this.dataset.openExtra) return this;
      if (selector === '[data-extra-close]' && this.dataset.extraClose) return this;
      return null;
    }
    matches() { return false; }
    getClientRects() { return this.hidden ? [] : [{}]; }
    focus() {}
    setAttribute(name, value) { this.attributes.set(name, value); }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    after(node) { this.next = node; }
    querySelector(selector) {
      if (!this.nodes.has(selector)) this.nodes.set(selector, new Element());
      return this.nodes.get(selector);
    }
    querySelectorAll() { return []; }
  }
  class Dialog extends Element {
    show() { this.open = true; this.modal = false; }
    showModal() { this.open = true; this.modal = true; }
    close() { this.open = false; this.fire('close'); }
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
  const mainTask = new Element();
  const timeouts = new Map();
  let nextTimeout = 0;
  const context = vm.createContext({
    performance: { now: () => 0 },
    setTimeout(handler) { timeouts.set(++nextTimeout, handler); return nextTimeout; },
    clearTimeout(id) { timeouts.delete(id); },
    HTMLElement: Element,
    HTMLDialogElement: Dialog,
    getComputedStyle: () => ({ visibility: 'visible' }),
    document: {
      body: { append() { inserted = true; } },
      getElementById: id => inserted ? nodes.get(id) : null,
      createElement: () => new Element(),
      querySelector: selector => selector === '.taskbar > .task-button' ? mainTask : null,
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
  function open(name) {
    const trigger = new Element();
    trigger.dataset.openExtra = name;
    documentListeners.get('click')({ target: trigger, preventDefault() {} });
  }
  return {
    note: nodes.get('extras-notepad-text'),
    status: nodes.get('extras-notepad').querySelector('.extras-notepad-status'),
    restore() { listeners.get('pageshow')?.({ persisted: true }); },
    openNote() { open('notepad'); },
    open,
    mirc: nodes.get('extras-mirc'),
    notepad: nodes.get('extras-notepad'),
    chatInput: nodes.get('extras-chat-input'),
    player: nodes.get('extras-player'),
    send(message) {
      nodes.get('extras-chat-input').value = message;
      nodes.get('extras-mirc').querySelector('form').fire('submit', { preventDefault() {} });
    },
    lines() { return nodes.get('extras-mirc').querySelector('.extras-chat-log').children.map(line => line.textContent); },
    finishTimeouts() {
      const callbacks = [...timeouts.values()];
      timeouts.clear();
      callbacks.forEach(handler => handler());
    },
    task: mainTask.next
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

test('minimizing and restoring mIRC preserves its draft and chat log', () => {
  const desktop = page(new Map());
  desktop.open('mirc');
  desktop.chatInput.value = 'Unfinished message';
  const log = desktop.mirc.querySelector('.extras-chat-log');
  const lines = [...log.children];
  desktop.mirc.querySelector('[data-mirc-minimize]').fire('click');
  assert.equal(desktop.mirc.hidden, true);
  assert.equal(desktop.task.hidden, false);
  assert.equal(desktop.task.attributes.get('aria-pressed'), 'false');
  desktop.task.fire('click');
  assert.equal(desktop.mirc.hidden, false);
  assert.equal(desktop.mirc.modal, false);
  assert.equal(desktop.chatInput.value, 'Unfinished message');
  assert.deepEqual(log.children, lines);
});

test('closing mIRC removes its task while reopening restores it', () => {
  const desktop = page(new Map());
  desktop.open('mirc');
  desktop.mirc.close();
  assert.equal(desktop.task.hidden, true);
  desktop.open('mirc');
  assert.equal(desktop.task.hidden, false);
  assert.equal(desktop.mirc.open, true);
});

test('notes remain non-modal alongside mIRC and Escape closes only notes', () => {
  const desktop = page(new Map());
  desktop.open('mirc');
  desktop.openNote();
  assert.equal(desktop.notepad.modal, false);
  assert.equal(desktop.mirc.open, true);
  desktop.notepad.fire('keydown', { key: 'Escape', preventDefault() {} });
  assert.equal(desktop.notepad.open, false);
  assert.equal(desktop.mirc.open, true);
});

test('the hidden channel updates its title and users, greets once and can be left', () => {
  const desktop = page(new Map());
  desktop.open('mirc');
  desktop.send('/join #EXPOSURE_');
  assert.equal(desktop.mirc.querySelector('[data-chat-title]').textContent, 'mIRC — #exposure_');
  assert.equal(desktop.mirc.querySelector('[data-chat-channel]').textContent, '#exposure_');
  assert.equal(desktop.mirc.querySelector('[data-chat-host]').hidden, false);
  assert.ok(desktop.lines().includes('*** Topic: afk, strax tillbaka'));
  desktop.send('/join #exposure_');
  desktop.finishTimeouts();
  assert.equal(desktop.lines().filter(line => line === '<exposure_> fortfarande här?').length, 1);
  desktop.send('/join #lobby');
  assert.equal(desktop.mirc.querySelector('[data-chat-title]').textContent, 'mIRC — #lobby');
  assert.equal(desktop.mirc.querySelector('[data-chat-host]').hidden, true);
  assert.ok(!desktop.lines().some(line => line.includes('fortfarande här')));
});

test('leaving, minimizing and closing the hidden channel cancel its delayed greeting', () => {
  for (const leave of [
    desktop => desktop.send('/join #lobby'),
    desktop => desktop.mirc.querySelector('[data-mirc-minimize]').fire('click'),
    desktop => desktop.mirc.close()
  ]) {
    const desktop = page(new Map());
    desktop.open('mirc');
    desktop.send('/join #exposure_');
    leave(desktop);
    desktop.open('mirc');
    desktop.finishTimeouts();
    assert.ok(!desktop.lines().some(line => line.includes('fortfarande här')));
  }
});

test('only slapping the bot counts and clearing or switching channels does not restore the trout', () => {
  const desktop = page(new Map());
  desktop.send('/slap someone');
  desktop.send('/slap');
  desktop.send('/slap BOT');
  assert.ok(!desktop.lines().some(line => line.includes('tar ifrån')));
  desktop.send('/slap bot');
  assert.equal(desktop.lines().at(-1), '* bot tar ifrån besokare öringen.');
  desktop.send('/clear');
  desktop.send('/join #exposure_');
  desktop.send('/slap someone');
  assert.equal(desktop.lines().at(-1), '*** Du har ingen öring.');
});

test('the fish phrase selects Scooter, resets the position and is reflected in now-playing', () => {
  const desktop = page(new Map());
  desktop.send('How much is the fish?');
  assert.ok(desktop.lines().includes('<bot> den här är lånad'));
  assert.equal(desktop.player.querySelector('[data-player-track]').textContent, 'Scooter — How Much Is the Fish?');
  assert.equal(desktop.player.querySelector('[data-player-time]').textContent, '00:00');
  desktop.send('/np');
  assert.match(desktop.lines().at(-1), /Scooter — How Much Is the Fish\?.*demo utan ljud/);
  desktop.player.querySelector('[data-player-next]').fire('click');
  desktop.send('/np');
  assert.match(desktop.lines().at(-1), /Limp Bizkit/);
});

test('the playlist starts in the agreed order and previous wraps to the final song', () => {
  const desktop = page(new Map());
  desktop.send('/np');
  assert.match(desktop.lines().at(-1), /Freestyler/);
  for (const name of ['Wait and Bleed', 'Detroit Rock City', '9 PM', 'Black Dog']) {
    desktop.player.querySelector('[data-player-next]').fire('click');
    desktop.send('/np');
    assert.ok(desktop.lines().at(-1).includes(name));
  }
  const fresh = page(new Map());
  fresh.player.querySelector('[data-player-previous]').fire('click');
  fresh.send('/np');
  assert.match(fresh.lines().at(-1), /One Step Closer/);
});
