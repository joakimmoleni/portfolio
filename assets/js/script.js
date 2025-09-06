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
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
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

  // toggla checkboxen rätt
  if (toggleSwitch) {
    toggleSwitch.checked = theme === 'light';
  }

  // visa rätt ikon
  if (lightIcon && darkIcon) {
    lightIcon.classList.toggle('hidden', theme !== 'light');
    darkIcon.classList.toggle('hidden', theme !== 'dark');
  }
}

function switchTheme(e) {
  const theme = e.target.checked ? 'light' : 'dark';
  applyTheme(theme);
}

toggleSwitch?.addEventListener('change', switchTheme);


/**
 * HEADER
 * Active header when window scrolls down to 100px
 */
const header = $("[data-header]");

window.addEventListener("scroll", () => {
  if (!header) return;
  header.classList.toggle("active", window.scrollY > 100);
});

/**
 * HEADER
 * Show header on scroll up - hide on scroll down
 */
const topnavi = $("#header");
if (topnavi) {
  topnavi.style.top = "0px";
  let lastScroll = 0;
  let ticking = false;

  function updateHeader() {
    if (window.scrollY > lastScroll) {
      topnavi.style.top = "-100px";
    } else {
      topnavi.style.top = "0px";
    }
    lastScroll = window.scrollY;
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
  }, { threshold: 0.1 });

  revealElements.forEach(el => revealObserver.observe(el));

  revealDelayElements.forEach(el => {
    const delay = el.dataset.revealDelay || '0.75';
    el.style.animationDuration = delay + 's';
    el.style.animationDelay = delay + 's';
    el.style.webkitAnimationDuration = delay + 's';
    el.style.webkitAnimationDelay = delay + 's';
  });
} else {
  // om användaren inte vill ha animationer – visa direkt
  revealElements.forEach(el => el.classList.add("revealed"));
}
