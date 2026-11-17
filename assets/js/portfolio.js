'use strict';

(() => {
  const startButton = document.getElementById('startButton');
  const startPanel = document.getElementById('startPanel');
  const aboutDialog = document.getElementById('aboutDialog');
  const themeToggle = document.getElementById('themeToggle');
  const programs = startPanel?.querySelector('.start-extras');
  const programsSummary = programs?.querySelector('summary');
  let aboutTrigger;

  function closeStart(restoreFocus = false) {
    if (!startPanel || !startButton) return;
    startPanel.hidden = true;
    if (programs) programs.open = false;
    startButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) startButton.focus();
  }
  startButton?.addEventListener('click', () => {
    const opening = startPanel.hidden;
    startPanel.hidden = !opening;
    startButton.setAttribute('aria-expanded', String(opening));
    if (opening) startPanel.querySelector('a')?.focus();
    else if (programs) programs.open = false;
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
    if (!event.defaultPrevented && event.key === 'Escape' && startPanel && !startPanel.hidden) {
      event.preventDefault();
      closeStart(true);
    }
  });
  programs?.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' && event.target === programsSummary) {
      event.preventDefault();
      programs.open = true;
      programs.querySelector('button')?.focus();
    } else if (programs.open && (event.key === 'ArrowLeft' || event.key === 'Escape')) {
      event.preventDefault();
      programs.open = false;
      programsSummary.focus();
    }
  });
  if (aboutDialog) {
    const showAbout = () => {
      aboutDialog.hidden = false;
      if (!aboutDialog.open) aboutDialog.show();
      aboutDialog.querySelector('[data-close]')?.focus();
      window.DesktopWindows.opened(aboutDialog);
    };
    window.DesktopWindows.register(aboutDialog, {
      title: 'Om den här datorn', icon: './favicon.svg', restore: showAbout
    });
    aboutDialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); aboutDialog.close(); }
    });
    for (const button of document.querySelectorAll('[data-about]')) {
      button.hidden = false;
      button.addEventListener('click', () => {
        aboutTrigger = startPanel?.contains(button) ? startButton : button;
        closeStart();
        showAbout();
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
  const wallpaperKey = 'moleni-desktop-wallpaper-v1';
  if (startPanel && themeToggle) {
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = 'Återställ skrivbordsbakgrund';
    reset.lang = 'sv';
    themeToggle.after(reset);
    function applyWallpaper(image) {
      const root = document.documentElement;
      const valid = typeof image === 'string' && image.length < 250000 && /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(image);
      reset.hidden = !valid;
      root.toggleAttribute('data-rally-wallpaper', valid);
      if (valid) root.style.setProperty('--rally-wallpaper', 'url("' + image + '")');
      else root.style.removeProperty('--rally-wallpaper');
    }
    function restoreWallpaper() {
      try { applyWallpaper(localStorage.getItem(wallpaperKey)); }
      catch { applyWallpaper(null); }
    }
    restoreWallpaper();
    window.addEventListener('pageshow', event => { if (event.persisted) restoreWallpaper(); });
    window.addEventListener('storage', event => {
      if (event.storageArea === localStorage && (event.key === wallpaperKey || event.key === null)) restoreWallpaper();
    });
    reset.addEventListener('click', () => {
      applyWallpaper(null);
      try { localStorage.removeItem(wallpaperKey); } catch { /* The current page still resets. */ }
      closeStart(true);
    });
    document.getElementById('rally-wallpaper')?.addEventListener('click', () => {
      const image = document.getElementById('rally-screen').toDataURL('image/png');
      applyWallpaper(image);
      try { localStorage.setItem(wallpaperKey, image); } catch { /* Use it on this page. */ }
      document.getElementById('rally-window').close();
    });
  }
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    try { applyTheme(localStorage.getItem('theme')); } catch (error) { /* Keep the current theme when storage is unavailable. */ }
  });
  window.addEventListener('storage', event => {
    if (event.storageArea !== localStorage || (event.key !== 'theme' && event.key !== null)) return;
    applyTheme(event.newValue);
  });
  themeToggle?.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('theme', theme); } catch (error) { /* The preference is optional. */ }
  });

  const clock = document.getElementById('clock');
  if (clock) {
    const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' });
    let clockTimer;
    function updateClock() {
      clearTimeout(clockTimer);
      const now = new Date();
      clock.textContent = formatter.format(now);
      clock.dateTime = now.toISOString();
      clockTimer = setTimeout(updateClock, 60000 - (Date.now() % 60000));
    }
    updateClock();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateClock(); });
    window.addEventListener('pageshow', updateClock);
    window.addEventListener('pagehide', () => clearTimeout(clockTimer));
  }
  const copyright = document.getElementById('copyrightYear');
  if (copyright) copyright.textContent = new Date().getFullYear();
  document.querySelector('.taskbar')?.removeAttribute('hidden');
})();
