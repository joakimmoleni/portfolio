/* The same running window has one entry on the taskbar and one in Start. */
(() => {
  'use strict';
  const bar = document.querySelector('.taskbar');
  const start = document.getElementById('startPanel');
  if (!bar || !start) return;
  const tasks = document.createElement('div');
  tasks.className = 'running-tasks';
  tasks.hidden = true;
  bar.querySelector('.task-button').after(tasks);
  const group = document.createElement('section');
  group.className = 'running-menu';
  group.hidden = true;
  const heading = document.createElement('h2');
  PortfolioLanguage.text(heading, 'Öppna fönster', 'Open windows');
  group.append(heading);
  start.querySelector('.start-links').prepend(group);
  const entries = new Map();
  const main = document.querySelector('.main-window') || document.querySelector('main');
  const mainTask = bar.querySelector('a.task-button');
  let active = main;

  function sync() {
    let any = false;
    for (const [panel, entry] of entries) {
      any ||= entry.open;
      entry.task.hidden = entry.menu.hidden = !entry.open;
      entry.task.setAttribute('aria-pressed', String(entry.open && active === panel && !panel.hidden));
      const title = PortfolioLanguage.choose(entry.title, entry.englishTitle);
      entry.task.title = title;
      entry.task.setAttribute('aria-label', title);
      const verb = panel.hidden ? PortfolioLanguage.choose('Återställ', 'Restore') : PortfolioLanguage.choose('Visa', 'Show');
      entry.menu.title = verb + ' ' + title;
    }
    tasks.hidden = group.hidden = !any;
    bar.toggleAttribute('data-running', any);
    mainTask.dataset.inactive = String(active !== main);
  }
  window.addEventListener('portfolio-language', sync);
  function select(panel) {
    if (!panel || (panel !== main && !entries.has(panel))) return;
    if (active !== panel) active?.dispatchEvent(new Event('desktop-deactivate'));
    active = panel;
    for (const other of [main, ...entries.keys()]) other.dataset.inactive = String(other !== panel);
    sync();
  }
  function opened(panel) {
    const entry = entries.get(panel);
    if (!entry) return;
    entry.open = true;
    panel.hidden = false;
    select(panel);
  }
  function closed(panel) {
    const entry = entries.get(panel);
    if (!entry) return;
    entry.open = false;
    if (active === panel) select(main);
    else sync();
  }
  function register(panel, { title, englishTitle = title, icon, restore, minimize }) {
    function button() {
      const control = document.createElement('button');
      control.type = 'button';
      control.setAttribute('aria-controls', panel.id);
      control.title = title;
      const image = document.createElement('img');
      image.src = icon;
      image.alt = '';
      const label = document.createElement('span');
      PortfolioLanguage.text(label, title, englishTitle);
      control.append(image, label);
      return control;
    }
    const task = button(), menu = button();
    task.className = 'task-button';
    task.setAttribute('aria-label', title);
    tasks.append(task);
    group.append(menu);
    function hide() {
      panel.hidden = true;
      if (minimize) minimize();
      select(main);
      task.focus({preventScroll: true});
    }
    function show() {
      const disclosure = start.querySelector('.start-extras');
      if (disclosure) disclosure.open = false;
      start.hidden = true;
      document.getElementById('startButton').setAttribute('aria-expanded','false');
      panel.hidden = false;
      restore();
      opened(panel);
    }
    task.addEventListener('click', () => active === panel && !panel.hidden ? hide() : show());
    menu.addEventListener('click', show);
    panel.querySelector('[data-window-minimize], [data-mirc-minimize]')?.addEventListener('click', hide);
    if (panel instanceof HTMLDialogElement) panel.addEventListener('close', () => { if (!panel.open) closed(panel); });
    entries.set(panel, { task, menu, title, englishTitle, open: false, hide });
    sync();
  }
  function selectTarget(event) {
    const panel = event.target.closest?.('.main-window, .extras-window, .about-dialog, .rally-window, main');
    if (panel && !panel.hidden) select(panel.closest('.main-window') || panel);
  }
  document.addEventListener('focusin', selectTarget);
  document.addEventListener('pointerdown', selectTarget);
  document.addEventListener('focusin', event => {
    if (bar.contains(event.target) || start.contains(event.target)) active?.dispatchEvent(new Event('desktop-deactivate'));
  });
  mainTask.addEventListener('click', () => {
    for (const [panel, entry] of entries) if (entry.open && !panel.hidden) entry.hide();
    select(main);
    document.querySelector('main')?.focus({preventScroll:true});
  });
  const menu = start.querySelector('[data-extras-menu]');
  const desktop = document.querySelector('.desktop-shortcuts');
  for (const [key, title, icon, width] of [['rally','Spökvarvet','rally',36], ['space','Periapsis','periapsis',40]]) {
    const opener = document.getElementById(key + '-open');
    const panel = document.getElementById(key + '-window');
    const startButton = document.getElementById('startButton');
    let returnTo = opener;
    function launcher(onDesktop) {
      const control = document.createElement(opener ? 'button' : 'a');
      const image = document.createElement('img');
      image.src = './assets/images/' + icon + '-icon.svg';
      image.alt = '';
      image.width = onDesktop ? width : 24;
      image.height = onDesktop ? 32 : 24;
      const label = document.createElement('span');
      label.textContent = title;
      control.append(image, label);
      if (onDesktop) control.dataset.shortcut = key;
      if (!opener) {
        control.href = './index.html?spel=' + key;
        return control;
      }
      control.type = 'button';
      control.hidden = true;
      control.setAttribute('aria-haspopup', 'dialog');
      control.setAttribute('aria-controls', panel.id);
      control.addEventListener('click', () => {
        if (!onDesktop) {
          start.hidden = true;
          start.querySelector('.start-extras').open = false;
          startButton.setAttribute('aria-expanded', 'false');
        }
        opener.click();
        returnTo = onDesktop ? control : startButton;
      });
      return control;
    }
    const shortcut = launcher(true);
    const menuItem = launcher(false);
    desktop?.append(shortcut);
    menu?.append(menuItem);
    if (!opener) continue;
    opener.addEventListener('click', () => { returnTo = opener; });
    panel.addEventListener('close', () => {
      if (panel.open) return;
      const url = new URL(location.href);
      if (url.searchParams.get('spel') === key) {
        url.searchParams.delete('spel');
        history.replaceState(history.state, '', url);
      }
      const target = returnTo.getClientRects().length ? returnTo : opener;
      target.focus({preventScroll:true});
    });
    window.addEventListener('DOMContentLoaded', () => {
      shortcut.hidden = menuItem.hidden = opener.hidden;
      if (!opener.hidden && new URLSearchParams(location.search).get('spel') === key) opener.click();
    });
  }
  window.DesktopWindows = {register, opened, closed};
})();
