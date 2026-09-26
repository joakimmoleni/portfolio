import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/js/worlds.js', import.meta.url), 'utf8');

// Small DOM/history stand-ins; browser checks cover layout and native focus.
const document = { activeElement: null };
const listeners = {};
const entries = [{ hash: '', state: null }];
let cursor = 0;
const location = { hash: '' };
const history = {
  get state() { return entries[cursor].state; },
  replaceState(state, _title, hash = location.hash) { entries[cursor] = { state, hash }; location.hash = hash; },
  pushState(state, _title, hash) { entries.splice(++cursor); entries.push({ state, hash }); location.hash = hash; }
};
const panels = ['first', 'second', 'third'].map(id => {
  const panel = { id, hidden: false, contains(node) { return node?.panel === this; }, scrollIntoView() {} };
  panel.heading = {
    panel, setAttribute() {},
    focus() { document.activeElement = this; },
    getBoundingClientRect() { return { top: 50, bottom: 100 }; }
  };
  panel.querySelector = () => panel.heading;
  return panel;
});
const links = panels.map(panel => ({
  hash: '#' + panel.id,
  setAttribute(name, value) { this[name] = value; },
  removeAttribute(name) { delete this[name]; }
}));
const navigation = { querySelectorAll() { return links; }, addEventListener(name, callback) { this[name] = callback; } };
const program = { querySelector() { return navigation; }, querySelectorAll() { return panels; } };
document.querySelectorAll = () => [program];
const window = { addEventListener(name, callback) { (listeners[name] ||= []).push(callback); } };
const fire = name => listeners[name]?.forEach(callback => callback());
vm.runInNewContext(source, { document, window, history, location, innerHeight: 800 });

function active() {
  const visible = panels.filter(panel => !panel.hidden);
  assert.equal(visible.length, 1, 'Exactly one pane must be visible');
  return visible[0].id;
}
function click(id, extra = {}) {
  const link = links.find(item => item.hash === '#' + id);
  const event = { target: { closest() { return link; } }, button: 0, preventDefault() { this.prevented = true; }, ...extra };
  navigation.click(event);
  return event;
}
function anchor(hash) { history.pushState(null, '', hash); fire('popstate'); fire('hashchange'); }
function back() { cursor--; location.hash = entries[cursor].hash; fire('popstate'); fire('hashchange'); }
function forward() { cursor++; location.hash = entries[cursor].hash; fire('popstate'); fire('hashchange'); }

assert.equal(active(), 'first');
assert.equal(click('second', { ctrlKey: true }).prevented, undefined);
assert.equal(active(), 'first');
click('second');
anchor('#main');
assert.equal(active(), 'second');
click('third');
back();
assert.equal(location.hash, '#main');
assert.equal(active(), 'second', 'Back to the taskbar anchor must restore its selected panel');
assert.equal(document.activeElement, panels[1].heading, 'Focus must leave the now-hidden panel');
back();
assert.equal(active(), 'second');
back();
assert.equal(active(), 'first');
forward();
assert.equal(active(), 'second');
forward();
assert.equal(active(), 'second');
forward();
assert.equal(active(), 'third');

console.log('World pane history passed: taskbar fragments, Back/Forward, focus and modified clicks.');
