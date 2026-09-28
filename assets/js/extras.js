'use strict';

(() => {
  if (document.getElementById('extras-player')) return;

  const programIcon = name => `<img class="extras-program-icon" src="./assets/images/${name}-icon.svg" width="24" height="24" alt="">`;
  const markup = document.createElement('div');
  markup.innerHTML = `
    <section id="extras-player" class="window extras-window extras-player" lang="sv" aria-labelledby="extras-player-title" tabindex="-1" hidden>
      <header class="titlebar extras-titlebar">
        <h2 id="extras-player-title">${programIcon('winamp')}WINAMP</h2>
        <span class="extras-shade-time" data-player-shade-time>00:00</span>
        <div class="extras-title-actions">
          <button type="button" class="extras-shade-play" data-player-shade-play aria-label="Starta den ljudlösa spelaren" title="Spela">▶</button>
          <button type="button" class="title-button extras-title-button" data-player-compact aria-label="Kompakt läge" aria-pressed="false" title="Kompakt läge">▱</button>
          <button type="button" class="title-button extras-title-button" data-extra-close="winamp" aria-label="Stäng Winamp" title="Stäng">×</button>
        </div>
      </header>
      <div class="extras-player-body">
        <div class="extras-player-screen">
          <div class="extras-player-readout"><span class="extras-player-time" data-player-time>00:00</span><span class="extras-player-state" data-player-state>STOPP</span></div>
          <div class="extras-equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <p class="extras-track" data-player-track>Demospår 01</p>
        </div>
        <label class="extras-progress-label" for="extras-player-progress">Position i spåret</label>
        <input id="extras-player-progress" class="extras-player-progress" type="range" min="0" max="155" step="1" value="0" aria-valuetext="0 minuter, 0 sekunder">
        <div class="extras-player-controls">
          <button type="button" class="extras-control" data-player-previous aria-label="Föregående demospår" title="Föregående spår">|◀</button>
          <button type="button" class="extras-control" data-player-play aria-label="Starta den ljudlösa spelaren" title="Spela">▶</button>
          <button type="button" class="extras-control" data-player-stop aria-label="Stoppa den ljudlösa spelaren" title="Stopp">■</button>
          <button type="button" class="extras-control" data-player-next aria-label="Nästa demospår" title="Nästa spår">▶|</button>
        </div>
        <div class="extras-playlist-heading" aria-hidden="true"><span>WINAMP PLAYLIST</span><span>3 spår</span></div>
        <ol class="extras-playlist" aria-label="Spellista med ljudlösa demospår">
          <li><button type="button" data-player-select="0" aria-pressed="true"><span>01. Demospår 01</span><span>2:35</span></button></li>
          <li><button type="button" data-player-select="1" aria-pressed="false"><span>02. Demospår 02</span><span>3:00</span></button></li>
          <li><button type="button" data-player-select="2" aria-pressed="false"><span>03. Demospår 03</span><span>3:30</span></button></li>
        </ol>
        <p class="extras-player-note">Demo · utan ljud</p>
      </div>
    </section>
    <dialog id="extras-mirc" class="window extras-window extras-dialog extras-mirc" lang="sv" aria-labelledby="extras-mirc-title" aria-describedby="extras-mirc-description">
      <header class="titlebar extras-titlebar"><h2 id="extras-mirc-title">${programIcon('mirc')}mIRC — #lobby</h2><div class="extras-title-actions"><button type="button" class="title-button extras-title-button" data-mirc-minimize aria-label="Minimera mIRC" title="Minimera">_</button><button type="button" class="title-button extras-title-button" data-extra-close="mirc" aria-label="Stäng mIRC" title="Stäng">×</button></div></header>
      <p id="extras-mirc-description" class="extras-dialog-note">Lokal demokanal · ingen livechatt</p>
      <div class="extras-chat-layout">
        <div class="extras-chat-log" role="log" aria-label="Meddelanden i demokanalen" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
        <aside class="extras-chat-users" aria-label="Namn i kanalen"><strong>#lobby</strong><span>@bot</span><span>besokare</span></aside>
      </div>
      <form class="extras-chat-form">
        <label for="extras-chat-input">besokare &gt;</label>
        <div class="extras-chat-entry"><input id="extras-chat-input" type="text" maxlength="300" autocomplete="off" spellcheck="false" placeholder="Skriv /help" autofocus><button class="system-button extras-send" type="submit">Skicka</button></div>
      </form>
      <p class="extras-chat-hint">Prova /help, /me, /slap, /clear, /winamp eller /np.</p>
    </dialog>
    <dialog id="extras-notepad" class="window extras-window extras-dialog extras-notepad" lang="sv" aria-labelledby="extras-notepad-title" aria-describedby="extras-notepad-description">
      <header class="titlebar extras-titlebar"><h2 id="extras-notepad-title">${programIcon('notepad')}todo.txt — Anteckningar</h2><button type="button" class="title-button extras-title-button" data-extra-close="notepad" aria-label="Stäng Anteckningar">×</button></header>
      <p id="extras-notepad-description" class="extras-dialog-note">Tillfälliga anteckningar</p>
      <label class="extras-progress-label" for="extras-notepad-text">Din anteckning</label>
      <textarea id="extras-notepad-text" maxlength="12000" spellcheck="false" autofocus></textarea>
      <p class="extras-notepad-status" role="status">Sparas i den här fliken. Skickas ingenstans.</p>
    </dialog>`;
  document.body.append(...markup.children);

  const player = document.getElementById('extras-player');
  const mirc = document.getElementById('extras-mirc');
  const notepad = document.getElementById('extras-notepad');
  const panels = { winamp: player, mirc, notepad };
  const returnFocus = new Map();
  const names = { winamp: 'Winamp', mirc: 'mIRC', notepad: 'Anteckningar' };
  const mircTask = document.createElement('button');
  mircTask.type = 'button';
  mircTask.className = 'task-button extras-task-button';
  mircTask.dataset.mircTask = '';
  mircTask.hidden = true;
  mircTask.setAttribute('aria-controls', mirc.id);
  mircTask.setAttribute('aria-pressed', 'false');
  mircTask.setAttribute('aria-label', 'Visa eller minimera mIRC');
  mircTask.innerHTML = `${programIcon('mirc')}<span>mIRC</span>`;
  document.querySelector('.taskbar > .task-button')?.after(mircTask);

  for (const menu of document.querySelectorAll('[data-extras-menu]')) {
    menu.lang = 'sv';
    for (const [name, title] of Object.entries(names)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'system-button extras-launcher';
      button.dataset.openExtra = name;
      const symbol = document.createElement('span');
      symbol.className = 'extras-launcher-icon';
      symbol.setAttribute('aria-hidden', 'true');
      symbol.innerHTML = programIcon(name);
      button.append(symbol, title);
      menu.append(button);
    }
  }
  for (const button of document.querySelectorAll('[data-open-extra]')) {
    const panel = panels[button.dataset.openExtra];
    if (!panel) continue;
    button.hidden = false;
    button.setAttribute('aria-controls', panel.id);
    button.setAttribute('aria-expanded', 'false');
    if (panel instanceof HTMLDialogElement) button.setAttribute('aria-haspopup', 'dialog');
  }

  function isVisible(element) {
    if (!(element instanceof HTMLElement)) return false;
    const closedDetails = element.closest('details:not([open])');
    if (closedDetails && !closedDetails.querySelector('summary')?.contains(element)) return false;
    return element.isConnected && !element.closest('[hidden]') && !element.matches(':disabled') && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
  }
  function restoreFocus(name, forget = true) {
    const previous = returnFocus.get(name);
    if (!previous) return;
    const disclosure = previous.closest('details')?.querySelector('summary');
    const target = [previous, disclosure, document.getElementById('startButton'), document.querySelector('[data-open-extra]'), document.querySelector('main')].find(isVisible);
    if (target?.matches('main') && !target.hasAttribute('tabindex')) target.tabIndex = -1;
    target?.focus({ preventScroll: true });
    if (forget) returnFocus.delete(name);
  }
  function markOpen(name, open) {
    for (const button of document.querySelectorAll(`[data-open-extra="${name}"]`)) button.setAttribute('aria-expanded', String(open));
  }
  function openExtra(name, trigger) {
    const panel = panels[name];
    if (!panel) return;
    const start = document.getElementById('startPanel');
    const startButton = document.getElementById('startButton');
    if (trigger !== mircTask) returnFocus.set(name, start?.contains(trigger) ? startButton : trigger);
    const disclosure = trigger?.closest('details');
    if (disclosure) disclosure.open = false;
    const previousDialog = trigger?.closest('dialog');
    if (previousDialog?.open && previousDialog !== panel) previousDialog.close();
    if (start) start.hidden = true;
    startButton?.setAttribute('aria-expanded', 'false');
    if (name === 'notepad') loadNote();
    markOpen(name, true);
    panel.hidden = false;
    if (name === 'mirc') {
      mircTask.hidden = false;
      mircTask.setAttribute('aria-pressed', 'true');
    }
    if (panel instanceof HTMLDialogElement) {
      if (!panel.open) panel.show();
      panel.querySelector('[autofocus]')?.focus({ preventScroll: true });
    } else {
      panel.hidden = false;
      const playControl = panel.classList.contains('is-compact') ? '[data-player-shade-play]' : '[data-player-play]';
      panel.querySelector(playControl).focus({ preventScroll: true });
    }
  }
  function closePlayer() {
    stopPlayer();
    player.hidden = true;
    markOpen('winamp', false);
    restoreFocus('winamp');
  }
  function minimizeMirc() {
    mirc.hidden = true;
    mirc.dataset.inactive = 'true';
    markOpen('mirc', false);
    mircTask.setAttribute('aria-pressed', 'false');
    restoreFocus('mirc', false);
  }
  mirc.querySelector('[data-mirc-minimize]').addEventListener('click', minimizeMirc);
  mircTask.addEventListener('click', () => {
    if (!mirc.hidden && mirc.dataset.inactive !== 'true') minimizeMirc();
    else openExtra('mirc', mircTask);
  });
  document.addEventListener('click', event => {
    const opener = event.target.closest('[data-open-extra]');
    if (opener && panels[opener.dataset.openExtra]) {
      event.preventDefault();
      openExtra(opener.dataset.openExtra, opener);
      return;
    }
    const closer = event.target.closest('[data-extra-close]');
    if (!closer) return;
    const name = closer.dataset.extraClose;
    if (name === 'winamp') closePlayer();
    else panels[name]?.close();
  });
  player.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePlayer();
    }
  });
  for (const [name, dialog] of [['mirc', mirc], ['notepad', notepad]]) {
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !event.isComposing) {
        event.preventDefault();
        dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      markOpen(name, false);
      if (name === 'mirc') {
        mircTask.hidden = true;
        mircTask.setAttribute('aria-pressed', 'false');
      }
      restoreFocus(name);
    });
  }

  // A silent visual clock: no audio objects, media requests or autoplay.
  const tracks = [155, 180, 210];
  const time = player.querySelector('[data-player-time]');
  const shadeTime = player.querySelector('[data-player-shade-time]');
  const trackLabel = player.querySelector('[data-player-track]');
  const playButton = player.querySelector('[data-player-play]');
  const shadePlayButton = player.querySelector('[data-player-shade-play]');
  const stateLabel = player.querySelector('[data-player-state]');
  const progress = document.getElementById('extras-player-progress');
  const playlistButtons = player.querySelectorAll('[data-player-select]');
  let track = 0;
  let position = 0;
  let playing = false;
  let startedAt = 0;
  let timer;

  function trackName() { return `Demospår ${String(track + 1).padStart(2, '0')}`; }
  function drawPlayer() {
    const seconds = Math.floor(position);
    time.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    shadeTime.textContent = time.textContent;
    progress.max = tracks[track];
    progress.value = seconds;
    progress.setAttribute('aria-valuetext', `${Math.floor(seconds / 60)} minuter, ${seconds % 60} sekunder`);
    trackLabel.textContent = trackName();
    for (const button of [playButton, shadePlayButton]) {
      button.textContent = playing ? 'Ⅱ' : '▶';
      button.setAttribute('aria-label', playing ? 'Pausa den ljudlösa spelaren' : 'Starta den ljudlösa spelaren');
      button.title = playing ? 'Pausa' : 'Spela';
    }
    stateLabel.textContent = playing ? 'SPELAR' : position >= tracks[track] ? 'SLUT' : position > 0 ? 'PAUS' : 'STOPP';
    player.classList.toggle('is-playing', playing);
    for (const button of playlistButtons) button.setAttribute('aria-pressed', String(Number(button.dataset.playerSelect) === track));
  }
  function stopTimer() {
    clearInterval(timer);
    timer = undefined;
  }
  function tick() {
    position = Math.min(tracks[track], (performance.now() - startedAt) / 1000);
    if (position >= tracks[track]) {
      playing = false;
      stopTimer();
    }
    drawPlayer();
  }
  function stopPlayer() {
    playing = false;
    position = 0;
    stopTimer();
    drawPlayer();
  }
  function togglePlayback() {
    if (playing) {
      tick();
      playing = false;
      stopTimer();
    } else {
      if (position >= tracks[track]) position = 0;
      playing = true;
      startedAt = performance.now() - position * 1000;
      timer = setInterval(tick, 250);
    }
    drawPlayer();
  }
  playButton.addEventListener('click', togglePlayback);
  shadePlayButton.addEventListener('click', togglePlayback);
  player.querySelector('[data-player-stop]').addEventListener('click', stopPlayer);
  function selectTrack(index) {
    track = index;
    position = 0;
    startedAt = performance.now();
    drawPlayer();
  }
  player.querySelector('[data-player-next]').addEventListener('click', () => selectTrack((track + 1) % tracks.length));
  player.querySelector('[data-player-previous]').addEventListener('click', () => selectTrack((track + tracks.length - 1) % tracks.length));
  for (const button of playlistButtons) button.addEventListener('click', () => selectTrack(Number(button.dataset.playerSelect)));
  progress.addEventListener('input', () => {
    position = Number(progress.value);
    startedAt = performance.now() - position * 1000;
    drawPlayer();
  });
  player.querySelector('[data-player-compact]').addEventListener('click', event => {
    const compact = player.classList.toggle('is-compact');
    event.currentTarget.setAttribute('aria-pressed', String(compact));
    event.currentTarget.setAttribute('aria-label', compact ? 'Visa hela spelaren' : 'Kompakt läge');
    event.currentTarget.title = compact ? 'Visa hela spelaren' : 'Kompakt läge';
  });
  window.addEventListener('pagehide', stopPlayer);

  const log = mirc.querySelector('.extras-chat-log');
  const chatInput = document.getElementById('extras-chat-input');
  const chatHistory = [];
  let historyIndex = 0;
  let chatDraft = '';
  chatInput.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing || !chatHistory.length) return;
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    if (event.key === 'ArrowUp') {
      if (historyIndex === chatHistory.length) chatDraft = chatInput.value;
      historyIndex = Math.max(0, historyIndex - 1);
    } else {
      if (historyIndex === chatHistory.length) return;
      historyIndex += 1;
    }
    event.preventDefault();
    chatInput.value = historyIndex === chatHistory.length ? chatDraft : chatHistory[historyIndex];
    chatInput.setSelectionRange(chatInput.value.length, chatInput.value.length);
  });
  function addLine(text, kind = 'system') {
    const line = document.createElement('p');
    line.className = `extras-chat-${kind}`;
    line.textContent = text;
    log.append(line);
    while (log.children.length > 80) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function bot(text) { addLine(`<bot> ${text}`, 'bot'); }
  addLine('*** Du har anslutit till #lobby.');
  addLine('*** Skriv /help för kommandon.');
  mirc.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    if (chatHistory[chatHistory.length - 1] !== message) chatHistory.push(message);
    if (chatHistory.length > 20) chatHistory.shift();
    historyIndex = chatHistory.length;
    chatDraft = '';
    chatInput.value = '';
    const command = message.split(/\s+/)[0].toLowerCase();
    const argument = message.slice(command.length).trim();
    if (command === '/clear') {
      log.replaceChildren();
      addLine('*** Rensat.');
    } else if (command === '/help') {
      bot('/me [text] · /slap [namn] · /clear · /winamp · /np');
    } else if (command === '/me') {
      addLine(`* besokare ${argument || 'ser sig omkring.'}`, 'action');
    } else if (command === '/slap') {
      addLine(`* besokare daskar ${argument || 'bot'} med en öring.`, 'action');
    } else if (command === '/np') {
      bot(`${trackName()} · ${playing ? 'spelar' : 'stoppad eller pausad'} · demo utan ljud.`);
    } else if (command === '/winamp') {
      const trigger = returnFocus.get('mirc');
      returnFocus.delete('mirc');
      mirc.close();
      openExtra('winamp', trigger);
      return;
    } else if (command.startsWith('/')) {
      bot(`Okänt kommando: ${command}. Skriv /help för kommandolistan.`);
    } else {
      addLine(`<besokare> ${message}`, 'visitor');
      if (/^(hej|hello|hallå|tjena)(\s|[!.?]|$)/i.test(message)) bot('Hej! Ingen kö till den här servern. Prova /me eller /slap.');
    }
    chatInput.focus();
  });

  const note = document.getElementById('extras-notepad-text');
  const noteStatus = notepad.querySelector('.extras-notepad-status');
  const noteKey = 'portfolio-extra-note-v1';
  note.value = '';
  function loadNote() {
    try {
      const saved = sessionStorage.getItem(noteKey);
      if (saved !== null) note.value = saved.slice(0, 12000);
    } catch {
      noteStatus.textContent = 'Finns i minnet tills du lämnar sidan. Skickas ingenstans.';
    }
  }
  loadNote();
  window.addEventListener('pageshow', event => {
    if (event.persisted) loadNote();
  });
  note.addEventListener('input', () => {
    try { sessionStorage.setItem(noteKey, note.value); }
    catch { noteStatus.textContent = 'Finns i minnet tills du lämnar sidan. Skickas ingenstans.'; }
  });
})();
