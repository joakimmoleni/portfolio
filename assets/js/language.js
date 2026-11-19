'use strict';

// The authored Swedish HTML is also the no-script version. Only labelled
// interface text is translated. Notes, chat input and initials belong to visitors.
const PortfolioLanguage = (() => {
  const attributes = ['aria-label', 'aria-valuetext', 'title', 'alt', 'placeholder', 'content'];
  const storageKey = 'resumeLang'; // Keep the preference set by earlier CV versions.
  const valid = value => value === 'en' || value === 'sv';
  function initialLanguage() {
    const linked = new URLSearchParams(location.search).get('lang');
    if (valid(linked)) return linked;
    try { return localStorage.getItem(storageKey) === 'en' ? 'en' : 'sv'; }
    catch { return 'sv'; }
  }
  function choose(sv, en) { return document.documentElement.lang === 'en' ? en : sv; }
  function text(node, sv, en) {
    node.dataset.sv = sv;
    node.dataset.en = en;
    const value = choose(sv, en);
    if (node.textContent !== value) node.textContent = value;
  }
  function render(root = document) {
    for (const node of root.querySelectorAll('[data-en]')) {
      node.dataset.sv ??= node.textContent;
      node.textContent = choose(node.dataset.sv, node.dataset.en);
    }
    for (const name of attributes) {
      for (const node of root.querySelectorAll('[data-en-' + name + ']')) {
        if (!node.hasAttribute('data-sv-' + name)) node.setAttribute('data-sv-' + name, node.getAttribute(name));
        node.setAttribute(name, choose(node.getAttribute('data-sv-' + name), node.getAttribute('data-en-' + name)));
      }
    }
  }
  function localLinks(root = document) {
    for (const link of root.querySelectorAll('a[href]')) {
      const raw = link.getAttribute('href');
      if (raw.startsWith('#') || link.hasAttribute('hreflang')) continue;
      if (!/^(?:\.\/)?(?:index|about|projects|contact|resume)\.html(?:[?#]|$)|^\/$/.test(raw) && !link.dataset.languageLink) continue;
      const url = new URL(link.href);
      if (url.origin !== location.origin) continue;
      link.dataset.languageLink = 'true';
      url.searchParams.set('lang', document.documentElement.lang);
      link.href = url.href;
    }
  }
  function apply(lang) {
    document.documentElement.lang = lang;
    try { localStorage.setItem(storageKey, lang); } catch { /* Optional preference. */ }
    render();
    localLinks();
    for (const button of document.querySelectorAll('.taskbar-language [data-lang]')) {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    }
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', choose('sv_SE', 'en_GB'));
    window.dispatchEvent(new Event('portfolio-language'));
  }
  function start() {
    const controls = document.querySelector('.taskbar-language');
    if (!controls) return;
    apply(initialLanguage());
    controls.hidden = false;
    // The CV already owns the language command, focus parameter and panel history.
    if (!document.body.classList.contains('page-resume')) {
      controls.addEventListener('click', event => {
        const button = event.target.closest('button[data-lang]');
        if (!button || button.dataset.lang === document.documentElement.lang) return;
        const url = new URL(location.href);
        url.searchParams.set('lang', button.dataset.lang);
        history.pushState({ ...history.state, portfolioLang: button.dataset.lang }, '', url);
        apply(button.dataset.lang);
      });
      history.replaceState({ ...history.state, portfolioLang: document.documentElement.lang }, '');
      window.addEventListener('popstate', () => {
        const explicit = new URLSearchParams(location.search).get('lang');
        apply(valid(explicit) ? explicit : history.state?.portfolioLang || initialLanguage());
      });
    }
    window.addEventListener('DOMContentLoaded', () => localLinks());
  }
  return { apply, choose, text, render, localLinks, start };
})();
PortfolioLanguage.start();
