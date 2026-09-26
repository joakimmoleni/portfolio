/* Ordinary fragment links work without JavaScript. Enhance them into program panes. */
(() => {
  'use strict';

  for (const program of document.querySelectorAll('[data-world-switcher]')) {
    const navigation = program.querySelector('[data-world-nav]');
    const panels = [...program.querySelectorAll('[data-world-panel]')];
    const links = [...navigation.querySelectorAll('a[href^="#"]')];
    if (!panels.length || !links.length) continue;

    const panelForHash = () => panels.find(panel => `#${panel.id}` === location.hash);
    const panelForHistory = () => panels.find(panel => panel.id === history.state?.worldPanel);

    function rememberPanel(panel) {
      history.replaceState({ ...history.state, worldPanel: panel.id }, '');
    }

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

    const initialPanel = panelForHash() || panelForHistory() || panels[0];
    showPanel(initialPanel);
    rememberPanel(initialPanel);

    navigation.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const panel = panels.find(candidate => link.hash === `#${candidate.id}`);
      if (!panel) return;
      event.preventDefault();
      showPanel(panel);
      if (location.hash !== link.hash) history.pushState({ ...history.state, worldPanel: panel.id }, '', link.hash);
      const heading = panel.querySelector('h2');
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      const headingBounds = heading.getBoundingClientRect();
      if (headingBounds.top < 0 || headingBounds.bottom > innerHeight - 100) panel.scrollIntoView({ block: 'start' });
    });

    function syncToLocation() {
      // Native links such as the taskbar's #main also need to retain their pane.
      const panel = panelForHash() || panelForHistory() || panels.find(candidate => !candidate.hidden) || panels[0];
      showPanel(panel);
      rememberPanel(panel);
    }

    window.addEventListener('hashchange', syncToLocation);
    window.addEventListener('popstate', syncToLocation);
  }
})();
