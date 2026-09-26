/* Ordinary fragment links work without JavaScript. Enhance them into program panes. */
(() => {
  'use strict';

  for (const program of document.querySelectorAll('[data-world-switcher]')) {
    const navigation = program.querySelector('[data-world-nav]');
    const panels = [...program.querySelectorAll('[data-world-panel]')];
    const links = [...navigation.querySelectorAll('a[href^="#"]')];
    if (!panels.length || !links.length) continue;

    const panelForHash = () => panels.find(panel => `#${panel.id}` === location.hash);

    function showPanel(panel) {
      const moveFocus = panels.some(candidate => candidate !== panel && candidate.contains(document.activeElement));
      for (const candidate of panels) candidate.hidden = candidate !== panel;
      for (const link of links) {
        if (link.hash === `#${panel.id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
      if (moveFocus) {
        const heading = panel.querySelector('h2');
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }

    showPanel(panelForHash() || panels[0]);

    navigation.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const panel = panels.find(candidate => link.hash === `#${candidate.id}`);
      if (!panel) return;
      event.preventDefault();
      showPanel(panel);
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      const heading = panel.querySelector('h2');
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      const headingBounds = heading.getBoundingClientRect();
      if (headingBounds.top < 0 || headingBounds.bottom > innerHeight - 100) panel.scrollIntoView({ block: 'start' });
    });

    function syncToLocation() {
      const panel = panelForHash();
      if (panel || !location.hash) showPanel(panel || panels[0]);
    }

    window.addEventListener('hashchange', syncToLocation);
    window.addEventListener('popstate', syncToLocation);
  }
})();
