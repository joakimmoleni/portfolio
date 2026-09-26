'use strict';

(() => {
  const startButton = document.getElementById('startButton');
  const startPanel = document.getElementById('startPanel');
  const aboutDialog = document.getElementById('aboutDialog');
  const themeToggle = document.getElementById('themeToggle');
  let aboutTrigger;

  function closeStart(restoreFocus = false) {
    if (!startPanel || !startButton) return;
    startPanel.hidden = true;
    startButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) startButton.focus();
  }
  startButton?.addEventListener('click', () => {
    const opening = startPanel.hidden;
    startPanel.hidden = !opening;
    startButton.setAttribute('aria-expanded', String(opening));
    if (opening) startPanel.querySelector('a')?.focus();
  });
  startPanel?.addEventListener('click', event => {
    if (event.target.closest('a')) closeStart();
  });
  document.addEventListener('click', event => {
    if (!startPanel?.contains(event.target) && !startButton?.contains(event.target)) closeStart();
  });
  document.addEventListener('focusin', event => {
    if (startPanel && !startPanel.hidden && !startPanel.contains(event.target) && event.target !== startButton) closeStart();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && startPanel && !startPanel.hidden) {
      event.preventDefault();
      closeStart(true);
    }
  });
  if (aboutDialog) {
    for (const button of document.querySelectorAll('[data-about]')) {
      button.hidden = false;
      button.addEventListener('click', () => {
        aboutTrigger = startPanel?.contains(button) ? startButton : button;
        closeStart();
        aboutDialog.showModal();
      });
    }
    aboutDialog.querySelector('[data-close]')?.addEventListener('click', () => aboutDialog.close());
    aboutDialog.addEventListener('close', () => {
      if (!document.activeElement?.closest('.extras-window')) aboutTrigger?.focus();
    });
  }

  function applyTheme(theme) {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    themeToggle?.setAttribute('aria-pressed', String(dark));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#182b41' : '#3a6ea5';
  }
  applyTheme(document.documentElement.dataset.theme);
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    try { applyTheme(localStorage.getItem('theme')); } catch (error) { /* Keep the current theme when storage is unavailable. */ }
  });
  themeToggle?.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('theme', theme); } catch (error) { /* The preference is optional. */ }
  });

  const clock = document.getElementById('clock');
  if (clock) {
    function updateClock() {
      const now = new Date();
      clock.textContent = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' }).format(now);
      clock.dateTime = now.toISOString();
    }
    updateClock();
    setInterval(updateClock, 60000);
  }
  const copyright = document.getElementById('copyrightYear');
  if (copyright) copyright.textContent = new Date().getFullYear();
  document.querySelector('.taskbar')?.removeAttribute('hidden');
})();
