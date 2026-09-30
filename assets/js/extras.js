'use strict';

(() => {
  if (document.getElementById('extras-player')) return;

  const tracks = [
    { name: 'Bomfunk MC’s — Freestyler', duration: 306 },
    { name: 'Slipknot — Wait and Bleed', duration: 147 },
    { name: 'KISS — Detroit Rock City', duration: 315 },
    { name: 'ATB — 9 PM (Till I Come)', duration: 193 },
    { name: 'Led Zeppelin — Black Dog', duration: 295 },
    { name: 'Darude — Sandstorm', duration: 225 },
    { name: 'Alice Deejay — Better Off Alone', file: 'Track07.mp3', duration: 214 },
    { name: 'The Prodigy — Breathe', duration: 335 },
    { name: 'Slipknot — Spit It Out', duration: 159 },
    { name: 'Eiffel 65 — Blue (Da Ba Dee)', duration: 219 },
    { name: 'KISS — I Was Made for Lovin’ You', duration: 271 },
    { name: 'Rammstein — Du hast', duration: 234 },
    { name: 'Scooter — How Much Is the Fish?', duration: 225 },
    { name: 'Limp Bizkit — Rollin’ (Air Raid Vehicle)', duration: 213 },
    { name: 'Led Zeppelin — Whole Lotta Love', duration: 333 },
    { name: 'Linkin Park — One Step Closer', duration: 156 }
  ];
  const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
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
          <p class="extras-track" data-player-track>${tracks[0].name}</p>
        </div>
        <label class="extras-progress-label" for="extras-player-progress">Position i spåret</label>
        <input id="extras-player-progress" class="extras-player-progress" type="range" min="0" max="${tracks[0].duration}" step="1" value="0" aria-valuetext="0 minuter, 0 sekunder">
        <div class="extras-player-controls">
          <button type="button" class="extras-control" data-player-previous aria-label="Föregående spår" title="Föregående spår">|◀</button>
          <button type="button" class="extras-control" data-player-play aria-label="Starta den ljudlösa spelaren" title="Spela">▶</button>
          <button type="button" class="extras-control" data-player-stop aria-label="Stoppa den ljudlösa spelaren" title="Stopp">■</button>
          <button type="button" class="extras-control" data-player-next aria-label="Nästa spår" title="Nästa spår">▶|</button>
        </div>
        <div class="extras-playlist-heading" aria-hidden="true"><span>WINAMP PLAYLIST</span><span>${tracks.length} spår</span></div>
        <ol class="extras-playlist" aria-label="Spellista · demo utan ljud">
          ${tracks.map((song, index) => `<li><button type="button" data-player-select="${index}" aria-pressed="${index === 0}"><span>${String(index + 1).padStart(2, '0')}. ${song.file || song.name}</span><span>${formatTime(song.duration)}</span></button></li>`).join('')}
        </ol>
        <details class="extras-track-info" hidden>
          <summary>Spårinformation</summary>
          <dl>
            <dt>Fil</dt><dd>Track07.mp3</dd>
            <dt>Artist</dt><dd>Unknown</dd>
            <dt>Album</dt><dd>Unknown</dd>
            <dt>Genre</dt><dd>Other</dd>
            <dt>Kommentar</dt><dd>/join #exposure_</dd>
          </dl>
        </details>
        <p class="extras-player-note">Demo · utan ljud</p>
      </div>
    </section>
    <dialog id="extras-mirc" class="window extras-window extras-dialog extras-mirc" lang="sv" aria-labelledby="extras-mirc-title" aria-describedby="extras-mirc-description">
      <header class="titlebar extras-titlebar"><h2 id="extras-mirc-title">${programIcon('mirc')}<span data-chat-title>mIRC — #lobby</span></h2><div class="extras-title-actions"><button type="button" class="title-button extras-title-button" data-mirc-minimize aria-label="Minimera mIRC" title="Minimera">_</button><button type="button" class="title-button extras-title-button" data-extra-close="mirc" aria-label="Stäng mIRC" title="Stäng">×</button></div></header>
      <p id="extras-mirc-description" class="extras-dialog-note">Lokal demokanal · ingen livechatt</p>
      <div class="extras-chat-layout">
        <div class="extras-chat-log" role="log" aria-label="Meddelanden i demokanalen" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
        <aside class="extras-chat-users" aria-label="Namn i kanalen"><strong data-chat-channel>#lobby</strong><span>@bot</span><span data-chat-host hidden>@exposure_</span><span>besokare</span></aside>
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
    clearTimeout(channelGreeting);
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
        clearTimeout(channelGreeting);
        mircTask.hidden = true;
        mircTask.setAttribute('aria-pressed', 'false');
      }
      restoreFocus(name);
    });
  }

  // A silent visual clock: no audio objects, media requests or autoplay.
  const time = player.querySelector('[data-player-time]');
  const shadeTime = player.querySelector('[data-player-shade-time]');
  const trackLabel = player.querySelector('[data-player-track]');
  const playButton = player.querySelector('[data-player-play]');
  const shadePlayButton = player.querySelector('[data-player-shade-play]');
  const stateLabel = player.querySelector('[data-player-state]');
  const progress = document.getElementById('extras-player-progress');
  const playlistButtons = player.querySelectorAll('[data-player-select]');
  const trackInfo = player.querySelector('.extras-track-info');
  let track = 0;
  let position = 0;
  let playing = false;
  let startedAt = 0;
  let timer;

  function trackName() { return tracks[track].file || tracks[track].name; }
  function drawPlayer() {
    const seconds = Math.floor(position);
    time.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    shadeTime.textContent = time.textContent;
    progress.max = tracks[track].duration;
    progress.value = seconds;
    progress.setAttribute('aria-valuetext', `${Math.floor(seconds / 60)} minuter, ${seconds % 60} sekunder`);
    trackLabel.textContent = trackName();
    for (const button of [playButton, shadePlayButton]) {
      button.textContent = playing ? 'Ⅱ' : '▶';
      button.setAttribute('aria-label', playing ? 'Pausa den ljudlösa spelaren' : 'Starta den ljudlösa spelaren');
      button.title = playing ? 'Pausa' : 'Spela';
    }
    stateLabel.textContent = playing ? 'SPELAR' : position >= tracks[track].duration ? 'SLUT' : position > 0 ? 'PAUS' : 'STOPP';
    player.classList.toggle('is-playing', playing);
    for (const button of playlistButtons) button.setAttribute('aria-pressed', String(Number(button.dataset.playerSelect) === track));
  }
  function stopTimer() {
    clearInterval(timer);
    timer = undefined;
  }
  function tick() {
    position = Math.min(tracks[track].duration, (performance.now() - startedAt) / 1000);
    if (position >= tracks[track].duration) {
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
      if (position >= tracks[track].duration) position = 0;
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
    trackInfo.hidden = !tracks[track].file;
    trackInfo.open = false;
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
  let channel = '#lobby';
  let channelGreeting;
  let botSlaps = 0;
  window.addEventListener('pagehide', () => clearTimeout(channelGreeting));
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
  function joinChannel(nextChannel) {
    if (nextChannel === channel) {
      bot(`Du är redan i ${channel}.`);
      return;
    }
    clearTimeout(channelGreeting);
    channel = nextChannel;
    mirc.querySelector('[data-chat-title]').textContent = `mIRC — ${channel}`;
    mirc.querySelector('[data-chat-channel]').textContent = channel;
    mirc.querySelector('[data-chat-host]').hidden = channel !== '#exposure_';
    log.replaceChildren();
    addLine(`*** Du har anslutit till ${channel}.`);
    if (channel === '#exposure_') {
      addLine('*** Topic: afk, strax tillbaka');
      addLine('*** /join #lobby tar dig tillbaka.');
      channelGreeting = setTimeout(() => {
        if (mirc.open && !mirc.hidden && channel === '#exposure_') addLine('<exposure_> fortfarande här?', 'bot');
      }, 12000);
    } else {
      addLine('*** Skriv /help för kommandon.');
    }
  }
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
      bot('/me [text] · /slap [namn] · /clear · /winamp · /np · /join #lobby');
    } else if (command === '/join') {
      const nextChannel = argument.toLowerCase();
      if (nextChannel === '#exposure_' || nextChannel === '#lobby') joinChannel(nextChannel);
      else bot('Ingen sådan kanal. Prova /join #lobby.');
    } else if (command === '/me') {
      addLine(`* besokare ${argument || 'ser sig omkring.'}`, 'action');
    } else if (command === '/slap') {
      if (botSlaps >= 3) {
        addLine('*** Du har ingen öring.');
      } else {
        const target = argument || 'bot';
        addLine(`* besokare daskar ${target} med en öring.`, 'action');
        if (target.toLowerCase() === 'bot' && ++botSlaps === 3) addLine('* bot tar ifrån besokare öringen.', 'action');
      }
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
      if (/^how much is the fish\s*[?!]*$/i.test(message)) {
        selectTrack(tracks.findIndex(song => song.name === 'Scooter — How Much Is the Fish?'));
        bot('den här är lånad');
        addLine(`*** Winamp: ${trackName()}`);
      } else if (/^(hej|hello|hallå|tjena)(\s|[!.?]|$)/i.test(message)) bot('Hej! Ingen kö till den här servern. Prova /me eller /slap.');
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
