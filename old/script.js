'use strict';

/**
 * Helpers
 */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

// Keep canonical-looking root URL when index is opened directly.
if (window.location.protocol.startsWith('http') && window.location.pathname.endsWith('/index.html')) {
  const cleanPath = window.location.pathname.replace(/index\.html$/, '');
  const cleanUrl = `${cleanPath}${window.location.search}${window.location.hash}`;
  window.history.replaceState(null, '', cleanUrl);
}

/**
 * Add event listener on multiple elements
 */
const addEventOnElements = (elements, eventType, callback) => {
  elements.forEach(el => el && el.addEventListener(eventType, callback));
};

/**
 * NAVBAR TOGGLE FOR MOBILE
 */
const mobileCenter = $('#mobileNavCenter');
const mobileOverlay = $('#mobileMenuOverlay');
const mobileMenuLinks = $$('[data-mobile-nav]');
const body = document.body;

function toggleMobileMenu() {
  if (!mobileCenter || !mobileOverlay) return;
  const isActive = mobileOverlay.classList.toggle('active');
  mobileCenter.classList.toggle('active');
  body.classList.toggle('nav-active');
  mobileCenter.setAttribute('aria-expanded', String(isActive));
}

mobileCenter?.addEventListener('click', toggleMobileMenu);
mobileMenuLinks.forEach(link => link.addEventListener('click', () => {
  if (mobileOverlay?.classList.contains('active')) toggleMobileMenu();
}));


/**
 * THEME SELECTOR / DARK MODE
 */
const themeToggleBtn = document.querySelector('.theme-switch');
const prefersDark  = window.matchMedia('(prefers-color-scheme: dark)').matches;

const lightIcon = document.getElementById('lightmode');
const darkIcon  = document.getElementById('darkmode');

// Initiera theme från localStorage eller system default
const savedTheme = localStorage.getItem('theme');
const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

applyTheme(currentTheme);

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);

  // visa rätt ikon (visa sol i mörkt läge, måne i ljust)
  if (lightIcon && darkIcon) {
    lightIcon.classList.toggle('hidden', theme !== 'dark');
    darkIcon.classList.toggle('hidden', theme !== 'light');
  }
}

function switchTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

themeToggleBtn?.addEventListener('click', switchTheme);

// Keyboard shortcut: press 'T' to toggle theme
document.addEventListener('keydown', (e) => {
  if (e.key === 't' || e.key === 'T') {
    // Don't trigger if user is typing in an input/textarea
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    switchTheme();
  }
});

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


/**
 * HEADER
 * Show full header on load + scroll up. Collapse into pill on scroll down.
 * Click pill to expand header again.
 */
const header = $("[data-header]");
const headerPill = $('#headerPill');

if (header && headerPill) {
  let lastScroll = 0;
  let ticking = false;
  let collapsed = false;
  const SCROLL_THRESHOLD = 80;

  function collapseHeader() {
    if (collapsed) return;
    collapsed = true;
    header.classList.add('collapsed');
    headerPill.classList.add('visible');
  }

  function expandHeader() {
    if (!collapsed) return;
    collapsed = false;
    header.classList.remove('collapsed');
    headerPill.classList.remove('visible');
  }

  function updateHeader() {
    const scrollY = window.scrollY;

    if (scrollY <= SCROLL_THRESHOLD) {
      // Near top — always show full header
      expandHeader();
    } else if (scrollY > lastScroll + 5) {
      // Scrolling down — collapse
      collapseHeader();
    } else if (scrollY < lastScroll - 5) {
      // Scrolling up — expand
      expandHeader();
    }

    lastScroll = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  });

  // Click pill to re-expand header
  headerPill.addEventListener('click', () => {
    expandHeader();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * SCROLL REVEAL
 */
const revealElements = $$("[data-reveal]");
const revealDelayElements = $$("[data-reveal-delay]");

// disable animation if user prefers reduced motion
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed");
        entry.target.style.animationPlayState = "running";
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  revealElements.forEach(el => revealObserver.observe(el));

  revealDelayElements.forEach(el => {
    const delay = el.dataset.revealDelay || '0.75';
    el.style.animationDelay = delay + 's';
    el.style.webkitAnimationDelay = delay + 's';
  });
} else {
  // om användaren inte vill ha animationer – visa direkt
  revealElements.forEach(el => el.classList.add("revealed"));
}

// Dynamic copyright year
const yearEl = document.getElementById('copyrightYear');
if (yearEl) yearEl.textContent = new Date().getFullYear();


/**
 * HERO TYPING ANIMATION (single-line loop)
 */
(function heroTypingLoop() {
  const typingWrap = $('.hero-typing');
  const typingEl = $('.hero-typing-text');
  const cursorEl = $('.hero-cursor');
  if (!typingEl) return;

  const lines = [
    'transaction infrastructure at register level',
    'the layer beneath everything else',
    'systems that process billions daily',
    'code where every byte is intentional'
  ];

  if (reducedMotion) {
    typingEl.textContent = lines[0];
    return;
  }

  const START_DELAY = 500;
  const TYPE_SPEED = 48;
  const ERASE_SPEED = 24;
  const HOLD_AFTER_TYPE = 1600;
  const HOLD_BETWEEN_LINES = 300;
  const LAST_LINE_LOOP_PAUSE = 2000;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function typeLine(text) {
    cursorEl?.classList.add('is-typing');
    for (let i = 1; i <= text.length; i += 1) {
      typingEl.textContent = text.slice(0, i);
      await sleep(TYPE_SPEED);
    }
    cursorEl?.classList.remove('is-typing');
  }

  async function eraseLine(text) {
    for (let i = text.length; i >= 0; i -= 1) {
      typingEl.textContent = text.slice(0, i);
      await sleep(ERASE_SPEED);
    }
  }

  async function runLoop() {
    let index = 0;
    await sleep(START_DELAY);
    typingWrap?.classList.add('is-active');

    const hasStaticFirstLine = typingEl.textContent.trim() === lines[0];
    if (hasStaticFirstLine) {
      await sleep(HOLD_AFTER_TYPE);
      await eraseLine(lines[0]);
      await sleep(HOLD_BETWEEN_LINES);
      index = 1;
    }

    while (true) {
      const line = lines[index];
      await typeLine(line);
      await sleep(HOLD_AFTER_TYPE);
      await eraseLine(line);

      const isLastLine = index === lines.length - 1;
      await sleep(isLastLine ? LAST_LINE_LOOP_PAUSE : HOLD_BETWEEN_LINES);

      index = (index + 1) % lines.length;
    }
  }

  runLoop();
})();


