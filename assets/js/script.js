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
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('theme');
const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

applyTheme(initialTheme);

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (iconMoon && iconSun) {
    iconMoon.classList.toggle('hidden', theme === 'dark');
    iconSun.classList.toggle('hidden', theme === 'light');
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#050608' : '#f9f7f3');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

themeBtn?.addEventListener('click', toggleTheme);

// Keyboard shortcut: T to toggle
document.addEventListener('keydown', (e) => {
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
    return Math.round(stream.scrollLeft / stream.clientWidth);
  }
  return Math.round(stream.scrollTop / stream.clientHeight);
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
    const inner = panel.querySelector('.boot-sequence, .boot-hero');
  });
  // Skip boot animations
  document.querySelectorAll('.boot-line, .boot-hero').forEach(el => {
    el.style.animation = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  // Scroll to target without smooth (instant jump)
  hashTarget.scrollIntoView({ behavior: 'instant', inline: 'start', block: 'start' });
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
      panels[idx].scrollIntoView({
        behavior: 'smooth',
        inline: 'start',
        block: 'start'
      });
    }
  });
});

// Keyboard: arrow keys to navigate panels
document.addEventListener('keydown', (e) => {
  if (isTyping()) return;

  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    const next = Math.min(currentPanelIdx + 1, panels.length - 1);
    panels[next].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'start' });
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    const prev = Math.max(currentPanelIdx - 1, 0);
    panels[prev].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'start' });
  }
});

/*-----------------------------------*\
  #WHEEL → HORIZONTAL (desktop only)
  Scroll down = scroll right. Smooth and direct.
  Temporarily disables snap while wheeling so
  small deltas accumulate without fighting snap.
\*-----------------------------------*/

if (stream) {
  let snapTimer = null;
  let locked = false;

  stream.addEventListener('wheel', (e) => {
    if (!isHorizontal()) return;

    // Only translate vertical wheel into horizontal
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();

      // If already locked from a recent scroll, ignore
      if (locked) return;
      locked = true;

      // One tick = one panel, then lock for 600ms
      const direction = Math.sign(e.deltaY);
      const target = Math.min(Math.max(currentPanelIdx + direction, 0), panels.length - 1);
      panels[target].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'start' });

      snapTimer = setTimeout(() => { locked = false; }, 600);
    }
  }, { passive: false });
}

/*-----------------------------------*\
  #REGISTER ANIMATION
\*-----------------------------------*/

const regValues = $$('.reg__val');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (regValues.length && !reducedMotion) {
  let frame = 0;
  function cycleRegisters() {
    frame++;
    // Flash a random register every ~2s
    if (frame % 120 === 0) {
      const idx = Math.floor(Math.random() * regValues.length);
      const el = regValues[idx];
      el.style.color = 'var(--accent)';
      el.style.textShadow = '0 0 6px var(--accent-glow)';
      setTimeout(() => {
        el.style.color = '';
        el.style.textShadow = '';
      }, 400);
    }
    requestAnimationFrame(cycleRegisters);
  }
  cycleRegisters();
}

/*-----------------------------------*\
  #COPYRIGHT YEAR
\*-----------------------------------*/

const yearEl = $('#copyrightYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/*-----------------------------------*\
  #MAILTO FORM (if needed later)
\*-----------------------------------*/

window.mailtoSubmit = function mailtoSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form?.querySelector('#name')?.value?.trim() || '';
  const email = form?.querySelector('#email_address')?.value?.trim() || '';
  const message = form?.querySelector('#message')?.value?.trim() || '';

  const subject = encodeURIComponent(`Portfolio contact from ${name || 'website visitor'}`);
  const body = encodeURIComponent([
    `Name: ${name}`,
    `Email: ${email}`,
    '',
    message
  ].join('\n'));

  window.location.href = `mailto:jcrooge@gmail.com?subject=${subject}&body=${body}`;
  return false;
};
