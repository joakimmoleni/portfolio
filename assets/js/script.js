'use strict';

/**
 * Helpers
 */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => root.querySelectorAll(sel);

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

  // visa rätt ikon
  if (lightIcon && darkIcon) {
    lightIcon.classList.toggle('hidden', theme !== 'light');
    darkIcon.classList.toggle('hidden', theme !== 'dark');
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
  }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

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
 * HERO TYPING ANIMATION
 */
(function heroAnimation() {
  const greetingText = 'hello, my name is';
  const nameText = 'Joakim Moléni';
  const phrases = [
    'stay up',
    'scale under pressure',
    'carry real data',
    'hold when it matters'
  ];

  const greetingEl  = $('.hero-greeting-text');
  const nameEl      = $('.hero-name');
  const nameTextEl  = $('.hero-name-text');
  const linesList   = $('.hero-lines');
  const subtitle    = $('.hero-subtitle');

  if (!greetingEl || !nameTextEl || !linesList) return;

  // If reduced motion, show everything immediately
  if (reducedMotion) {
    greetingEl.textContent = greetingText;
    nameTextEl.textContent = nameText;
    nameEl.classList.add('visible');
    phrases.forEach(phrase => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="line-prefix">I build systems that</span> <span class="line-tail">${phrase}</span>`;
      li.classList.add('visible');
      linesList.appendChild(li);
    });
    subtitle.classList.add('visible');
    $$('.hero-cursor').forEach(c => c.classList.add('done'));
    return;
  }

  const CHAR_SPEED = 38;

  function typeText(el, text, speed) {
    return new Promise(resolve => {
      let i = 0;
      const interval = setInterval(() => {
        el.textContent = text.slice(0, ++i);
        if (i >= text.length) { clearInterval(interval); resolve(); }
      }, speed);
    });
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function run() {
    // Phase 1: Type greeting in green
    await typeText(greetingEl, greetingText, CHAR_SPEED);
    await wait(300);

    // Hide greeting cursor
    const greetingCursor = greetingEl.parentElement.querySelector('.hero-cursor');
    if (greetingCursor) greetingCursor.classList.add('done');

    // Phase 2: Type name character by character
    nameEl.classList.add('visible');
    await typeText(nameTextEl, nameText, CHAR_SPEED);
    await wait(1200);

    // Hide name cursor
    const nameCursor = nameEl.querySelector('.hero-cursor');
    if (nameCursor) nameCursor.classList.add('done');
    await wait(300);

    // Phase 3: Type all lines uniformly
    for (let i = 0; i < phrases.length; i++) {
      const li = document.createElement('li');
      const prefixSpan = document.createElement('span');
      prefixSpan.className = 'line-prefix';
      const tailSpan = document.createElement('span');
      tailSpan.className = 'line-tail';
      const cursor = document.createElement('span');
      cursor.className = 'hero-cursor';
      cursor.textContent = '_';

      li.appendChild(prefixSpan);
      li.append(' ');
      li.appendChild(tailSpan);
      li.appendChild(cursor);
      linesList.appendChild(li);
      li.classList.add('visible');

      await typeText(prefixSpan, 'I build systems that ', CHAR_SPEED);
      await typeText(tailSpan, phrases[i], CHAR_SPEED);
      cursor.classList.add('done');
      await wait(60);
    }

    await wait(400);

    // Phase 4: Show subtitle
    subtitle.classList.add('visible');
  }

  run();
})();
