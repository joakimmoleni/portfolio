'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/* Theme */

const themeBtn = $('#themeToggle');
const iconMoon = $('#iconMoon');
const iconSun = $('#iconSun');

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (error) { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (error) { /* Storage is optional. */ }
}

function isTyping() {
  const active = document.activeElement;
  return active?.matches('input, textarea, select, [contenteditable="true"]') || false;
}

const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = reducedMotionQuery.matches;

function applyTheme(theme) {
  const safeTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', safeTheme);
  themeBtn?.setAttribute('aria-pressed', String(safeTheme === 'dark'));
  themeBtn?.setAttribute('aria-label', safeTheme === 'dark' ? 'Use light theme' : 'Use dark theme');
  iconMoon?.classList.toggle('hidden', safeTheme === 'dark');
  iconSun?.classList.toggle('hidden', safeTheme === 'light');

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  metaTheme?.setAttribute('content', safeTheme === 'dark' ? '#07090c' : '#f6f3ed');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  storageSet('theme', next);
}

applyTheme(storageGet('theme') || (colorSchemeQuery.matches ? 'dark' : 'light'));
themeBtn?.addEventListener('click', toggleTheme);

const listenForMediaChange = (query, handler) => {
  if (typeof query.addEventListener === 'function') query.addEventListener('change', handler);
  else if (typeof query.addListener === 'function') query.addListener(handler);
};

listenForMediaChange(colorSchemeQuery, event => {
  if (!storageGet('theme')) applyTheme(event.matches ? 'dark' : 'light');
});

listenForMediaChange(reducedMotionQuery, event => { reducedMotion = event.matches; });

document.addEventListener('keydown', event => {
  if (event.metaKey || event.ctrlKey || event.altKey || isTyping()) return;
  if (event.key.toLowerCase() === 't') toggleTheme();
});

/* Portfolio navigation */

const stream = $('#stream');
const panels = $$('.panel');
const addrButtons = $$('.addr');
const addrPC = $('#addrPC');
const addressList = $('.address-bar__left');
const progressBar = $('#progressBar');

let ticking = false;
let currentPanelIdx = -1;

function isStacked() {
  return window.innerWidth <= 900;
}

function isHorizontal() {
  return Boolean(stream && !isStacked() && stream.scrollWidth > stream.clientWidth + 50);
}

function getScrollProgress() {
  if (!stream) return 0;
  if (isStacked()) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max : 0;
  }
  if (isHorizontal()) {
    const max = stream.scrollWidth - stream.clientWidth;
    return max > 0 ? stream.scrollLeft / max : 0;
  }
  const max = stream.scrollHeight - stream.clientHeight;
  return max > 0 ? stream.scrollTop / max : 0;
}

function getClosestPanelIndex(value, axis = 'left') {
  let bestIndex = 0;
  let bestDistance = Infinity;

  panels.forEach((panel, index) => {
    const offset = axis === 'top' ? panel.offsetTop : panel.offsetLeft;
    const distance = Math.abs(offset - value);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function getActivePanel() {
  if (!panels.length) return 0;
  if (isStacked()) {
    const marker = window.scrollY + window.innerHeight * 0.38;
    let best = 0;
    panels.forEach((panel, index) => {
      if (panel.offsetTop <= marker) best = index;
    });
    return best;
  }
  if (isHorizontal()) return getClosestPanelIndex(stream?.scrollLeft || 0);
  return getClosestPanelIndex(stream?.scrollTop || 0, 'top');
}

function setAddressHash(panel) {
  if (!panel?.id || !history.replaceState) return;
  history.replaceState(null, '', `${location.pathname}${location.search}#${panel.id}`);
}

function scrollPanelTo(index, behavior = 'smooth', updateHash = false) {
  if (!panels.length || !stream) return;
  const targetIndex = Math.min(Math.max(index, 0), panels.length - 1);
  const panel = panels[targetIndex];
  const scrollBehavior = reducedMotion ? 'auto' : behavior;

  if (isStacked()) {
    panel.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  } else if (isHorizontal()) {
    if (panel.scrollTop > 0) panel.scrollTo({ top: 0, behavior: scrollBehavior });
    stream.scrollTo({ left: panel.offsetLeft, behavior: scrollBehavior });
  } else {
    stream.scrollTo({ top: panel.offsetTop, behavior: scrollBehavior });
  }

  if (updateHash) setAddressHash(panel);
}

function ensureAddressVisible(button) {
  if (!addressList || !button || addressList.scrollWidth <= addressList.clientWidth) return;
  const listRect = addressList.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  if (buttonRect.left < listRect.left || buttonRect.right > listRect.right) {
    const left = button.offsetLeft - (addressList.clientWidth - button.offsetWidth) / 2;
    addressList.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
}

function updateUI() {
  const activeIndex = Math.min(getActivePanel(), panels.length - 1);
  if (progressBar) progressBar.style.width = `${getScrollProgress() * 100}%`;

  if (activeIndex !== currentPanelIdx) {
    currentPanelIdx = activeIndex;
    addrButtons.forEach((button, index) => {
      const active = index === activeIndex;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });

    ensureAddressVisible(addrButtons[activeIndex]);

    if (addrPC) {
      const hex = (activeIndex * 4).toString(16).toUpperCase().padStart(2, '0');
      addrPC.innerHTML = `PC: 0x${hex}<span class="pc-cursor" aria-hidden="true">_</span>`;
    }
  }

  ticking = false;
}

function requestUIUpdate() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(updateUI);
}

stream?.addEventListener('scroll', requestUIUpdate, { passive: true });
window.addEventListener('scroll', () => { if (isStacked()) requestUIUpdate(); }, { passive: true });
window.addEventListener('resize', requestUIUpdate, { passive: true });

addrButtons.forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    const index = Number.parseInt(button.dataset.idx || '', 10);
    if (Number.isInteger(index)) scrollPanelTo(index, 'smooth', true);
  });
});

function panelIndexFromHash() {
  if (!location.hash) return -1;
  let target = null;
  try { target = document.querySelector(location.hash); } catch (error) { return -1; }
  return panels.indexOf(target);
}

window.addEventListener('hashchange', () => {
  const index = panelIndexFromHash();
  if (index >= 0) scrollPanelTo(index, 'auto');
});

document.addEventListener('keydown', event => {
  if (!panels.length || isTyping()) return;

  const addressFocused = document.activeElement?.classList.contains('addr');
  const horizontalKeys = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
  const streamKeys = isHorizontal() && (horizontalKeys || event.key === 'ArrowUp' || event.key === 'ArrowDown');

  if (streamKeys || (addressFocused && horizontalKeys)) {
    event.preventDefault();
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    scrollPanelTo(currentPanelIdx + direction, 'smooth', true);
    addrButtons[Math.min(Math.max(currentPanelIdx + direction, 0), panels.length - 1)]?.focus();
  } else if (addressFocused && (event.key === 'Home' || event.key === 'End')) {
    event.preventDefault();
    const index = event.key === 'Home' ? 0 : panels.length - 1;
    scrollPanelTo(index, 'smooth', true);
    addrButtons[index]?.focus();
  }
});

/* One intentional desktop wheel gesture advances one panel. */

const WHEEL_STEP_INTENT = 30;
const WHEEL_COOLDOWN = 450;
const WHEEL_GESTURE_GAP = 200;

let wheelArmed = true;
let wheelAccum = 0;
let wheelPrevMagnitude = 0;
let wheelPrevDirection = 0;
let wheelLastTime = 0;
let wheelStepTime = 0;
let wheelTargetIndex = null;

function canScrollVertically(target, deltaY) {
  let element = target instanceof Element ? target : null;
  while (element && element !== stream) {
    const style = getComputedStyle(element);
    const scrollable = element.scrollHeight > element.clientHeight + 24 && /(auto|scroll)/.test(style.overflowY);
    if (scrollable) {
      if (deltaY < 0 && element.scrollTop > 0) return true;
      if (deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1) return true;
    }
    element = element.parentElement;
  }
  return false;
}

function normalizeWheelDelta(event) {
  const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return raw * 32;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return raw * (stream?.clientWidth || window.innerWidth);
  return raw;
}

stream?.addEventListener('wheel', event => {
  if (!isHorizontal()) return;
  if (Math.abs(event.deltaY) >= Math.abs(event.deltaX) && canScrollVertically(event.target, event.deltaY)) return;

  event.preventDefault();
  const delta = normalizeWheelDelta(event);
  if (!delta) return;

  const now = performance.now();
  const magnitude = Math.abs(delta);
  const direction = Math.sign(delta);
  const gap = now - wheelLastTime;
  const flipped = wheelPrevDirection !== 0 && direction !== wheelPrevDirection;

  if (gap > WHEEL_GESTURE_GAP || flipped || magnitude > wheelPrevMagnitude * 1.5 + 10) {
    wheelArmed = true;
    wheelAccum = 0;
    if (flipped) wheelStepTime = 0;
  }

  wheelLastTime = now;
  wheelPrevMagnitude = magnitude;
  wheelPrevDirection = direction;

  if (!wheelArmed || now - wheelStepTime < WHEEL_COOLDOWN) return;
  wheelAccum += delta;
  if (Math.abs(wheelAccum) < WHEEL_STEP_INTENT) return;

  const baseIndex = wheelTargetIndex !== null && now - wheelStepTime < 1000 ? wheelTargetIndex : getActivePanel();
  const targetIndex = Math.min(Math.max(baseIndex + direction, 0), panels.length - 1);
  wheelArmed = false;
  wheelAccum = 0;
  wheelStepTime = now;
  wheelTargetIndex = targetIndex;
  scrollPanelTo(targetIndex, 'smooth', true);
}, { passive: false });

/* Entry state */

if (panels.length) {
  panels.forEach((panel, index) => {
    window.setTimeout(() => panel.classList.add('dealt'), reducedMotion ? 0 : 40 + index * 70);
  });

  const initialIndex = panelIndexFromHash();
  if (initialIndex >= 0) requestAnimationFrame(() => scrollPanelTo(initialIndex, 'auto'));
  requestAnimationFrame(updateUI);
}

const yearElement = $('#copyrightYear');
if (yearElement) yearElement.textContent = new Date().getFullYear();
