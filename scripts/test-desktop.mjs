import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';

const source = readFileSync(new URL('../assets/js/portfolio.js', import.meta.url), 'utf8');

function desktop(initialTime = '2026-10-28T12:34:59.500Z') {
  let now = Date.parse(initialTime);
  let nextId = 0;
  const timers = new Map();
  const clock = {};
  const documentEvents = new Map();
  const windowEvents = new Map();
  const listen = events => (name, handler) => {
    if (!events.has(name)) events.set(name, []);
    events.get(name).push(handler);
  };
  const fire = (events, name, event = {}) => events.get(name)?.forEach(handler => handler(event));
  const schedule = (handler, delay, repeat = false) => {
    timers.set(++nextId, { handler, due: now + delay, delay, repeat });
    return nextId;
  };
  const document = {
    hidden: false,
    documentElement: { dataset: {} },
    getElementById: id => id === 'clock' ? clock : null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: listen(documentEvents)
  };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  vm.runInNewContext(source, {
    document, Date: ClockDate, Intl,
    localStorage: { getItem: () => null },
    window: { addEventListener: listen(windowEvents) },
    setTimeout: (handler, delay) => schedule(handler, delay),
    setInterval: (handler, delay) => schedule(handler, delay, true),
    clearTimeout: id => timers.delete(id),
    clearInterval: id => timers.delete(id)
  });
  return {
    clock,
    advance(milliseconds) {
      const until = now + milliseconds;
      while (true) {
        const next = [...timers.entries()].filter(([, timer]) => timer.due <= until)
          .sort((a, b) => a[1].due - b[1].due)[0];
        if (!next) break;
        const [id, timer] = next;
        now = timer.due;
        if (timer.repeat) timer.due += timer.delay; else timers.delete(id);
        timer.handler();
      }
      now = until;
    },
    jump(milliseconds) { now += milliseconds; },
    restore() { fire(windowEvents, 'pageshow', { persisted: true }); },
    leave() { fire(windowEvents, 'pagehide'); },
    visible() { fire(documentEvents, 'visibilitychange'); },
    activeTimers: () => timers.size
  };
}

test('Stockholm clock changes at the minute boundary, not a minute after page load', () => {
  const page = desktop();
  assert.equal(page.clock.textContent, '13:34');
  page.advance(500);
  assert.equal(page.clock.textContent, '13:35');
  assert.equal(page.clock.dateTime, '2026-10-28T12:35:00.000Z');
  page.advance(60000);
  assert.equal(page.clock.textContent, '13:36');
  assert.equal(page.activeTimers(), 1);
});

test('returning to a suspended or restored page immediately resynchronizes the clock', () => {
  const page = desktop();
  page.jump(5 * 60000);
  page.visible();
  assert.equal(page.clock.textContent, '13:39');
  assert.equal(page.activeTimers(), 1);
  page.leave();
  assert.equal(page.activeTimers(), 0);
  page.jump(5 * 60000);
  page.restore();
  assert.equal(page.clock.textContent, '13:44');
  assert.equal(page.activeTimers(), 1);
});

test('Stockholm clock uses daylight saving time and rolls over midnight', () => {
  const page = desktop('2026-06-01T21:59:59.500Z');
  assert.equal(page.clock.textContent, '23:59');
  page.advance(500);
  assert.equal(page.clock.textContent, '00:00');
});
