'use strict';

/*===================================================
  INSTRUCTION STREAM — Portfolio Script
  Joakim Moléni | Zero dependencies
===================================================*/

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

/*-----------------------------------*\
  #THEME
\*-----------------------------------*/

const themeBtn = $('#themeToggle');
const iconMoon = $('#iconMoon');
const iconSun = $('#iconSun');

// localStorage can throw (private browsing, blocked storage) — never let it kill the script
function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
}

const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const savedTheme = storageGet('theme');

applyTheme(savedTheme || (colorSchemeQuery.matches ? 'dark' : 'light'));

// Follow OS theme changes until the user picks a theme explicitly
colorSchemeQuery.addEventListener('change', (e) => {
  if (!storageGet('theme')) applyTheme(e.matches ? 'dark' : 'light');
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  if (iconMoon && iconSun) {
    iconMoon.classList.toggle('hidden', theme === 'dark');
    iconSun.classList.toggle('hidden', theme === 'light');
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#050608' : '#f9f7f3');
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  storageSet('theme', next);
}

themeBtn?.addEventListener('click', toggleTheme);

// Keyboard shortcut: T to toggle (ignore Cmd/Ctrl/Alt combos like new-tab)
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if ((e.key === 't' || e.key === 'T') && !isTyping()) toggleTheme();
});

function isTyping() {
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
}

/*-----------------------------------*\
  #SCROLL TRACKING & ADDRESS BAR
\*-----------------------------------*/

const stream = $('#stream');
const panels = $$('.panel');
const addrButtons = $$('.addr');
const addrPC = $('#addrPC');
const progressBar = $('#progressBar');

let ticking = false;
let currentPanelIdx = -1; // force first updateUI to apply .active
let wheelIdleTimer = null;
let wheelSessionActive = false;
let wheelSessionStartLeft = 0;
let wheelSessionDirection = 0;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function isHorizontal() {
  return stream && stream.scrollWidth > stream.clientWidth + 50;
}

function isMobile() {
  return window.innerWidth <= 768;
}

function getScrollProgress() {
  if (isMobile()) {
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

function getPanelOffset(idx) {
  return panels[idx]?.offsetLeft || 0;
}

function getClosestPanelIndex(left = stream?.scrollLeft || 0) {
  let bestIdx = 0;
  let bestDistance = Infinity;

  panels.forEach((panel, idx) => {
    const distance = Math.abs(panel.offsetLeft - left);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIdx = idx;
    }
  });

  return bestIdx;
}

function getClosestPanelIndexByTop(top = stream?.scrollTop || 0) {
  let bestIdx = 0;
  let bestDistance = Infinity;

  panels.forEach((panel, idx) => {
    const distance = Math.abs(panel.offsetTop - top);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIdx = idx;
    }
  });

  return bestIdx;
}

function getActivePanel() {
  if (isMobile()) {
    // Find which panel is most in view
    const scrollY = window.scrollY;
    let best = 0;
    for (let i = 0; i < panels.length; i++) {
      if (panels[i].offsetTop <= scrollY + window.innerHeight * 0.4) {
        best = i;
      }
    }
    return best;
  }
  if (isHorizontal()) {
    return getClosestPanelIndex();
  }
  return getClosestPanelIndexByTop();
}

function scrollPanelTo(idx, behavior = 'smooth') {
  const target = Math.min(Math.max(idx, 0), panels.length - 1);
  const scrollBehavior = reducedMotion ? 'auto' : behavior;

  if (isMobile()) {
    panels[target].scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    return;
  }

  if (isHorizontal()) {
    stream.scrollTo({ left: getPanelOffset(target), behavior: scrollBehavior });
    return;
  }

  stream.scrollTo({ top: panels[target].offsetTop, behavior: scrollBehavior });
}

function updateUI() {
  const progress = getScrollProgress();
  const activeIdx = Math.min(getActivePanel(), panels.length - 1);

  // Progress bar
  if (progressBar) {
    progressBar.style.width = (progress * 100) + '%';
  }

  // Address buttons + PC display — only update when the active panel changes
  if (activeIdx !== currentPanelIdx) {
    currentPanelIdx = activeIdx;
    addrButtons.forEach((btn, i) => {
      btn.classList.toggle('active', i === activeIdx);
    });

    // PC display with blinking cursor
    if (addrPC) {
      const hex = (activeIdx * 4).toString(16).toUpperCase().padStart(2, '0');
      addrPC.innerHTML = 'PC: 0x' + hex + '<span class="pc-cursor">_</span>';
    }
  }

  ticking = false;
}

stream?.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(updateUI);
    ticking = true;
  }
});

// Mobile: window scrolls instead of stream
window.addEventListener('scroll', () => {
  if (!isMobile()) return;
  if (!ticking) {
    requestAnimationFrame(updateUI);
    ticking = true;
  }
});

// Initial state
requestAnimationFrame(updateUI);

// Deal-in animation: stagger panels on load
// If arriving via hash (e.g. from resume), skip animations and jump directly
const hashTarget = location.hash && document.querySelector(location.hash);
if (hashTarget && hashTarget.classList.contains('panel')) {
  // Instantly reveal all panels, no animation
  panels.forEach(panel => {
    panel.classList.add('dealt');
    panel.style.animation = 'none';
  });
  // Skip boot animations
  document.querySelectorAll('.boot-line, .boot-hero').forEach(el => {
    el.style.animation = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  // Scroll to target without smooth (instant jump)
  scrollPanelTo([...panels].indexOf(hashTarget), 'auto');
  // Clean hash from URL without triggering navigation
  history.replaceState(null, '', location.pathname);
} else {
  panels.forEach((panel, i) => {
    setTimeout(() => panel.classList.add('dealt'), 100 + i * 200);
  });
}

/*-----------------------------------*\
  #NAVIGATION
\*-----------------------------------*/

// Click address buttons to navigate
addrButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = parseInt(btn.dataset.idx);
    if (idx >= 0 && idx < panels.length) {
      scrollPanelTo(idx);
    }
  });
});

// Keyboard: arrow keys to navigate panels
// (no-op on pages without panels, e.g. resume.html — let the browser scroll natively)
document.addEventListener('keydown', (e) => {
  if (!panels.length || isTyping()) return;

  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    const next = Math.min(currentPanelIdx + 1, panels.length - 1);
    scrollPanelTo(next);
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    const prev = Math.max(currentPanelIdx - 1, 0);
    scrollPanelTo(prev);
  }
});

/*-----------------------------------*\
  #WHEEL → HORIZONTAL (desktop only)
  Pixel-based wheel translation keeps trackpads,
  mouse wheels, and inertial wheels on one path.
\*-----------------------------------*/

if (stream) {
  stream.addEventListener('wheel', (e) => {
    if (!isHorizontal()) return;

    // A dominantly-vertical gesture over content that can still scroll
    // vertically (e.g. a panel taller than a short window) stays native —
    // otherwise that content would be unreachable by wheel.
    if (Math.abs(e.deltaY) >= Math.abs(e.deltaX) && canScrollVertically(e.target, e.deltaY)) {
      return;
    }

    const delta = normalizeWheelDelta(e);
    if (delta === 0) return;

    e.preventDefault();

    if (!wheelSessionActive) {
      wheelSessionActive = true;
      wheelSessionStartLeft = stream.scrollLeft;
      wheelSessionDirection = 0;
    }

    wheelSessionDirection = Math.sign(delta) || wheelSessionDirection;
    stream.classList.add('is-wheel-scrolling');
    stream.scrollLeft += delta;

    window.clearTimeout(wheelIdleTimer);
    wheelIdleTimer = window.setTimeout(settleWheelScroll, 140);
  }, { passive: false });
}

function canScrollVertically(target, deltaY) {
  let el = target instanceof Element ? target : null;
  while (el && el !== stream) {
    if (el.scrollHeight > el.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
      if (deltaY < 0 && el.scrollTop > 0) return true;
      if (deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
    }
    el = el.parentElement;
  }
  return false;
}

function normalizeWheelDelta(e) {
  const rawDelta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) return rawDelta * 32;
  if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) return rawDelta * stream.clientWidth;
  return rawDelta;
}

function settleWheelScroll() {
  if (!stream || !wheelSessionActive) return;

  const movement = stream.scrollLeft - wheelSessionStartLeft;
  const threshold = Math.min(stream.clientWidth * 0.12, 120);
  let targetIdx = getClosestPanelIndex();

  if (Math.abs(movement) > threshold && wheelSessionDirection !== 0) {
    targetIdx = getDirectionalPanelIndex(stream.scrollLeft, wheelSessionDirection);
  }

  stream.classList.remove('is-wheel-scrolling');
  wheelSessionActive = false;
  wheelSessionDirection = 0;
  scrollPanelTo(targetIdx);
}

function getDirectionalPanelIndex(left, direction) {
  if (direction > 0) {
    for (let i = 0; i < panels.length; i++) {
      if (panels[i].offsetLeft > left + 1) return i;
    }
    return panels.length - 1;
  }

  for (let i = panels.length - 1; i >= 0; i--) {
    if (panels[i].offsetLeft < left - 1) return i;
  }
  return 0;
}

/*-----------------------------------*\
  #REGISTER ANIMATION
\*-----------------------------------*/

const regValues = $$('.reg__val');

if (regValues.length && !reducedMotion) {
  // Flash a random register every 2s
  setInterval(() => {
    const el = regValues[Math.floor(Math.random() * regValues.length)];
    el.style.color = 'var(--accent)';
    el.style.textShadow = '0 0 6px var(--accent-glow)';
    setTimeout(() => {
      el.style.color = '';
      el.style.textShadow = '';
    }, 400);
  }, 2000);
}

/*-----------------------------------*\
  #COPYRIGHT YEAR
\*-----------------------------------*/

const yearEl = $('#copyrightYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();
