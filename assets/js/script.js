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
const navbar   = $("[data-navbar]");
const navTogglers = $$("[data-nav-toggler]");
const overlay  = $("[data-overlay]");
const body     = document.body;

const toggleNavbar = () => {
  if (!navbar || !overlay) return;

  const isActive = navbar.classList.toggle("active");
  overlay.classList.toggle("active");
  body.classList.toggle("nav-active");

  // a11y: uppdatera aria-expanded på open-btn
  const openBtn = $(".nav-open-btn");
  if (openBtn) {
    openBtn.setAttribute("aria-expanded", String(isActive));
  }
};

addEventOnElements(navTogglers, "click", toggleNavbar);


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
 * Fixed header after 100px, hide on scroll-down, show on scroll-up
 */
const header = $("[data-header]");

if (header) {
  let lastScroll = 0;
  let ticking = false;

  function updateHeader() {
    const scrollY = window.scrollY;
    header.classList.toggle("active", scrollY > 100);

    if (scrollY > 100) {
      header.style.top = scrollY > lastScroll ? "-100px" : "0px";
    } else {
      header.style.top = "";
    }

    lastScroll = scrollY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
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
    'IBM z/OS assembler at the core',
    'full-stack tools for mainframe teams',
    'systems that absolutely cannot fail',
    'whatever needs building, I build it'
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


