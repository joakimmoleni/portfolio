'use strict';
/**
 * add event listener on multiple elements
 */
const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
}

/**
 * NAVBAR TOGGLE FOR MOBILE
 */
const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.classList.toggle("nav-active");
}

addEventOnElements(navTogglers, "click", toggleNavbar);

/**
 * THEME SELECTOR / DARK MODE
 */
const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');

function switchTheme(e) {
  if (e.target.checked) {
      document.documentElement.setAttribute('data-theme', 'light');
      document.getElementById('lightmode').classList.remove('hidden');
      document.getElementById('darkmode').classList.add('hidden');
  }
  else {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('lightmode').classList.add('hidden');
      document.getElementById('darkmode').classList.remove('hidden');
  }    
}

toggleSwitch.addEventListener('change', switchTheme, false);

/**
 * HEADER
 * active header when window scroll down to 100px
 */
const header = document.querySelector("[data-header]");

window.addEventListener("scroll", function () {
  if (window.scrollY > 100) {
    header.classList.add("active");
  } else {
    header.classList.remove("active");
  }
});

/**
 * HEADER
 * show header on scroll up - hide on scroll down
 */
const topnavi = document.getElementById("header");
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

window.addEventListener("scroll", function() {
  if (!ticking) {
    window.requestAnimationFrame(updateHeader);
    ticking = true;
  }
});

/**
 * SCROLL REVEAL
 */
const revealElements = document.querySelectorAll("[data-reveal]");
const revealDelayElements = document.querySelectorAll("[data-reveal-delay]");

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("revealed");
      entry.target.style.animationPlayState = "running";
    }
  });
});

for (let i = 0, len = revealElements.length; i < len; i++) {
  revealObserver.observe(revealElements[i]);
}

for (let i = 0, len = revealDelayElements.length; i < len; i++) {
    revealDelayElements[i].style.animationDuration = revealDelayElements[i].dataset.revealDelay + 's';
    revealDelayElements[i].style.animationDelay = revealDelayElements[i].dataset.revealDelay + 's';
    revealDelayElements[i].style.webkitAnimationDuration = revealDelayElements[i].dataset.revealDelay + 's';
    revealDelayElements[i].style.webkitAnimationDelay = revealDelayElements[i].dataset.revealDelay + 's';
}