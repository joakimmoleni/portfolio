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
  const controlPaths = {
    play: 'M5 3 13 8 5 13Z',
    pause: 'M4 3h3v10H4zM9 3h3v10H9z',
    stop: 'M4 4h8v8H4z',
    previous: 'M3 3h2v10H3zM13 3v10L6 8Z',
    next: 'M11 3h2v10h-2zM3 3l7 5-7 5Z',
    compact: 'M2 4h12v8H2zM4 6v4h8V6Z',
    minimize: 'M3 11h10v2H3z',
    close: 'm4 3 4 4 4-4 1 1-4 4 4 4-1 1-4-4-4 4-1-1 4-4-4-4Z'
  };
  const controlIcon = name => `<svg class="control-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="${controlPaths[name]}"/></svg>`;
  const programIcon = name => `<img class="extras-program-icon" src="./assets/images/${name}-icon.svg" width="24" height="24" alt="">`;
  const markup = document.createElement('div');
  markup.innerHTML = `
    <section id="extras-player" class="window extras-window extras-player" aria-labelledby="extras-player-title" tabindex="-1" hidden>
      <header class="titlebar extras-titlebar">
        <h2 id="extras-player-title">${programIcon('winamp')}WINAMP</h2>
        <span class="extras-shade-time" data-player-shade-time>00:00</span>
        <div class="extras-title-actions">
          <button type="button" class="extras-shade-play" data-player-shade-play aria-label="Starta den ljudlösa spelaren" data-en-aria-label="Start the silent player" title="Spela" data-en-title="Play">${controlIcon('play')}</button>
          <button type="button" class="title-button extras-title-button" data-player-compact aria-label="Kompakt läge" data-en-aria-label="Compact mode" aria-pressed="false" title="Kompakt läge" data-en-title="Compact mode">${controlIcon('compact')}</button>
          <button type="button" class="title-button extras-title-button" data-window-minimize aria-label="Minimera Winamp" data-en-aria-label="Minimise Winamp" title="Minimera" data-en-title="Minimise">${controlIcon('minimize')}</button><button type="button" class="title-button extras-title-button" data-extra-close="winamp" aria-label="Stäng Winamp" data-en-aria-label="Close Winamp" title="Stäng" data-en-title="Close">${controlIcon('close')}</button>
        </div>
      </header>
      <div class="extras-player-body">
        <div class="extras-player-screen">
          <div class="extras-player-readout"><span class="extras-player-time" data-player-time>00:00</span><span class="extras-player-state" data-player-state data-en="STOP">STOPP</span></div>
          <div class="extras-equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <p class="extras-track" data-player-track>${tracks[0].name}</p>
        </div>
        <label class="extras-progress-label" for="extras-player-progress" data-en="Track position">Position i spåret</label>
        <input id="extras-player-progress" class="extras-player-progress" type="range" min="0" max="${tracks[0].duration}" step="1" value="0" aria-valuetext="0 minuter, 0 sekunder" data-en-aria-valuetext="0 minutes, 0 seconds">
        <div class="extras-player-controls">
          <button type="button" class="extras-control" data-player-previous aria-label="Föregående spår" data-en-aria-label="Previous track" title="Föregående spår" data-en-title="Previous track">${controlIcon('previous')}</button>
          <button type="button" class="extras-control" data-player-play aria-label="Starta den ljudlösa spelaren" data-en-aria-label="Start the silent player" title="Spela" data-en-title="Play">${controlIcon('play')}</button>
          <button type="button" class="extras-control" data-player-stop aria-label="Stoppa den ljudlösa spelaren" data-en-aria-label="Stop the silent player" title="Stopp" data-en-title="Stop">${controlIcon('stop')}</button>
          <button type="button" class="extras-control" data-player-next aria-label="Nästa spår" data-en-aria-label="Next track" title="Nästa spår" data-en-title="Next track">${controlIcon('next')}</button>
        </div>
        <div class="extras-playlist-heading" aria-hidden="true"><span>WINAMP PLAYLIST</span><span data-en="${tracks.length} tracks">${tracks.length} spår</span></div>
        <ol class="extras-playlist" aria-label="Spellista · demo utan ljud" data-en-aria-label="Playlist · silent demo">
          ${tracks.map((song, index) => `<li><button type="button" data-player-select="${index}" aria-pressed="${index === 0}"><span>${String(index + 1).padStart(2, '0')}. ${song.file || song.name}</span><span>${formatTime(song.duration)}</span></button></li>`).join('')}
        </ol>
        <details class="extras-track-info" hidden>
          <summary data-en="Track info">Spårinformation</summary>
          <dl>
            <dt data-en="File">Fil</dt><dd>Track07.mp3</dd>
            <dt>Artist</dt><dd>Unknown</dd>
            <dt>Album</dt><dd>Unknown</dd>
            <dt>Genre</dt><dd>Other</dd>
            <dt data-en="Comment">Kommentar</dt><dd>/join #exposure_</dd>
          </dl>
        </details>
        <p class="extras-player-note" data-en="Silent demo">Demo · utan ljud</p>
      </div>
    </section>
    <dialog id="extras-mirc" class="window extras-window extras-dialog extras-mirc" aria-labelledby="extras-mirc-title" aria-describedby="extras-mirc-description">
      <header class="titlebar extras-titlebar"><h2 id="extras-mirc-title">${programIcon('mirc')}<span data-chat-title>mIRC — #lobby</span></h2><div class="extras-title-actions"><button type="button" class="title-button extras-title-button" data-mirc-minimize aria-label="Minimera mIRC" data-en-aria-label="Minimise mIRC" title="Minimera" data-en-title="Minimise">${controlIcon('minimize')}</button><button type="button" class="title-button extras-title-button" data-extra-close="mirc" aria-label="Stäng mIRC" data-en-aria-label="Close mIRC" title="Stäng" data-en-title="Close">${controlIcon('close')}</button></div></header>
      <p id="extras-mirc-description" class="extras-dialog-note" data-en="Local demo channel · no live chat">Lokal demokanal · ingen livechatt</p>
      <div class="extras-chat-layout">
        <div class="extras-chat-log" role="log" aria-label="Meddelanden i demokanalen" data-en-aria-label="Demo channel messages" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
        <aside class="extras-chat-users" aria-label="Namn i kanalen" data-en-aria-label="Channel members"><strong data-chat-channel>#lobby</strong><span>@bot</span><span data-chat-host hidden>@exposure_</span><span>besokare</span></aside>
      </div>
      <form class="extras-chat-form">
        <label for="extras-chat-input">besokare &gt;</label>
        <div class="extras-chat-entry"><input id="extras-chat-input" type="text" maxlength="300" autocomplete="off" spellcheck="false" placeholder="Skriv /help" data-en-placeholder="Type /help" autofocus><button class="system-button extras-send" type="submit" data-en="Send">Skicka</button></div>
      </form>
      <p class="extras-chat-hint" data-en="Try /help, /me, /slap, /clear, /winamp or /np.">Prova /help, /me, /slap, /clear, /winamp eller /np.</p>
    </dialog>
    <dialog id="extras-notepad" class="window extras-window extras-dialog extras-notepad" aria-labelledby="extras-notepad-title" aria-describedby="extras-notepad-description">
      <header class="titlebar extras-titlebar"><h2 id="extras-notepad-title">${programIcon('notepad')}<span data-en="todo.txt — Notepad">todo.txt — Anteckningar</span></h2><button type="button" class="title-button extras-title-button" data-window-minimize aria-label="Minimera Anteckningar" data-en-aria-label="Minimise Notepad" title="Minimera" data-en-title="Minimise">${controlIcon('minimize')}</button><button type="button" class="title-button extras-title-button" data-extra-close="notepad" aria-label="Stäng Anteckningar" data-en-aria-label="Close Notepad">${controlIcon('close')}</button></header>
      <p id="extras-notepad-description" class="extras-dialog-note" data-en="Scratchpad">Tillfälliga anteckningar</p>
      <label class="extras-progress-label" for="extras-notepad-text" data-en="Your note">Din anteckning</label>
      <textarea id="extras-notepad-text" maxlength="12000" spellcheck="false" autofocus></textarea>
      <p class="extras-notepad-status" role="status" data-en="Saved in this tab. Only you can see it.">Sparas i den här fliken. Skickas ingenstans.</p>
    </dialog>`;
  PortfolioLanguage.render(markup);
  document.body.append(...markup.children);

  const player = document.getElementById('extras-player');
  const mirc = document.getElementById('extras-mirc');
  const notepad = document.getElementById('extras-notepad');
  const panels = { winamp: player, mirc, notepad };
  const returnFocus = new Map();
  const names = { winamp: 'Winamp', mirc: 'mIRC', notepad: 'Anteckningar' };
  for (const [name, panel] of Object.entries(panels)) {
    window.DesktopWindows.register(panel, {
      title: names[name], englishTitle: name === 'notepad' ? 'Notepad' : names[name], icon: './assets/images/' + name + '-icon.svg',
      restore: () => openExtra(name),
      minimize: () => {
        if (name === 'mirc') clearTimeout(channelGreeting);
        markOpen(name, false);
      }
    });
  }

  for (const menu of document.querySelectorAll('[data-extras-menu]')) {
    for (const [name, title] of Object.entries(names)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'system-button extras-launcher';
      button.dataset.openExtra = name;
      const symbol = document.createElement('span');
      symbol.className = 'extras-launcher-icon';
      symbol.setAttribute('aria-hidden', 'true');
      symbol.innerHTML = programIcon(name);
      const label = document.createElement('span');
      PortfolioLanguage.text(label, title, name === 'notepad' ? 'Notepad' : title);
      button.append(symbol, label);
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
    if (trigger) returnFocus.set(name, start?.contains(trigger) ? startButton : trigger);
    const disclosure = trigger?.closest('details');
    if (disclosure) disclosure.open = false;
    const previousDialog = trigger?.closest('dialog');
    if (previousDialog?.open && previousDialog !== panel) previousDialog.close();
    if (start) start.hidden = true;
    startButton?.setAttribute('aria-expanded', 'false');
    if (name === 'notepad') loadNote();
    markOpen(name, true);
    panel.hidden = false;
    window.DesktopWindows.opened(panel);
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
    window.DesktopWindows.closed(player);
    player.hidden = true;
    markOpen('winamp', false);
    restoreFocus('winamp');
  }
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
  const choose = PortfolioLanguage.choose;
  function drawPlayer() {
    const seconds = Math.floor(position);
    time.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    shadeTime.textContent = time.textContent;
    progress.max = tracks[track].duration;
    progress.value = seconds;
    progress.setAttribute('aria-valuetext', choose(`${Math.floor(seconds / 60)} minuter, ${seconds % 60} sekunder`, `${Math.floor(seconds / 60)} min, ${seconds % 60} sec`));
    trackLabel.textContent = trackName();
    for (const button of [playButton, shadePlayButton]) {
      const icon = playing ? 'pause' : 'play';
      if (button.dataset.playbackIcon !== icon) {
        button.innerHTML = controlIcon(icon);
        button.dataset.playbackIcon = icon;
      }
      button.setAttribute('aria-label', playing ? choose('Pausa den ljudlösa spelaren', 'Pause the silent player') : choose('Starta den ljudlösa spelaren', 'Start the silent player'));
      button.title = playing ? choose('Pausa', 'Pause') : choose('Spela', 'Play');
    }
    stateLabel.textContent = playing ? choose('SPELAR', 'PLAYING') : position >= tracks[track].duration ? choose('SLUT', 'END') : position > 0 ? choose('PAUS', 'PAUSED') : choose('STOPP', 'STOP');
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
  for (const button of playlistButtons) button.addEventListener('click', () => {
    selectTrack(Number(button.dataset.playerSelect));
    if (!playing) togglePlayback();
  });
  progress.addEventListener('input', () => {
    position = Number(progress.value);
    startedAt = performance.now() - position * 1000;
    drawPlayer();
  });
  player.querySelector('[data-player-compact]').addEventListener('click', event => {
    const compact = player.classList.toggle('is-compact');
    event.currentTarget.setAttribute('aria-pressed', String(compact));
    drawCompactLabel(compact);
  });
  function drawCompactLabel(compact) {
    const control = player.querySelector('[data-player-compact]');
    const label = compact ? choose('Visa hela spelaren', 'Show full player') : choose('Kompakt läge', 'Compact mode');
    control.setAttribute('aria-label', label);
    control.title = label;
  }
  window.addEventListener('portfolio-language', () => {
    drawPlayer();
    drawCompactLabel(player.classList.contains('is-compact'));
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
  function addLine(text, kind = 'system', english = text) {
    const line = document.createElement('p');
    line.className = `extras-chat-${kind}`;
    PortfolioLanguage.text(line, text, english);
    log.append(line);
    while (log.children.length > 80) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function bot(text, english) { addLine(`<bot> ${text}`, 'bot', `<bot> ${english}`); }
  function joinChannel(nextChannel) {
    if (nextChannel === channel) {
      bot(`Du är redan i ${channel}.`, `You’re already in ${channel}.`);
      return;
    }
    clearTimeout(channelGreeting);
    channel = nextChannel;
    mirc.querySelector('[data-chat-title]').textContent = `mIRC — ${channel}`;
    mirc.querySelector('[data-chat-channel]').textContent = channel;
    mirc.querySelector('[data-chat-host]').hidden = channel !== '#exposure_';
    log.replaceChildren();
    addLine(`*** Du har anslutit till ${channel}.`, 'system', `*** You’ve joined ${channel}.`);
    if (channel === '#exposure_') {
      addLine('*** Topic: afk, strax tillbaka', 'system', '*** Topic: afk, back in a bit');
      addLine('*** /join #lobby tar dig tillbaka.', 'system', '*** /join #lobby takes you back.');
      channelGreeting = setTimeout(() => {
        if (mirc.open && !mirc.hidden && channel === '#exposure_') addLine('<exposure_> fortfarande här?', 'bot', '<exposure_> still here?');
      }, 12000);
    } else {
      addLine('*** Skriv /help för kommandon.', 'system', '*** Type /help for commands.');
    }
  }
  addLine('*** Du har anslutit till #lobby.', 'system', '*** You’ve joined #lobby.');
  addLine('*** Skriv /help för kommandon.', 'system', '*** Type /help for commands.');
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
      addLine('*** Rensat.', 'system', '*** Cleared.');
    } else if (command === '/help') {
      bot('/me [text] · /slap [namn] · /whois [nick] · /clear · /winamp · /np · /join #lobby', '/me [text] · /slap [name] · /whois [nick] · /clear · /winamp · /np · /join #lobby');
    } else if (command === '/whois') {
      switch (argument.toLowerCase()) {
        case 'exposure_': addLine('*** exposure_ (Joakim Moléni) · Stockholm · #exposure_'); break;
        case 'bot': bot('Det är jag. Skriv /help om du vill se vad jag kan.', 'That’s me. Type /help to see what I can do.'); break;
        default: bot(argument ? 'Inget sådant nick här.' : 'Använd /whois [nick].', argument ? 'No such nick here.' : 'Use /whois [nick].');
      }
    } else if (command === '/join') {
      const nextChannel = argument.toLowerCase();
      if (nextChannel === '#exposure_' || nextChannel === '#lobby') joinChannel(nextChannel);
      else bot('Ingen sådan kanal. Prova /join #lobby.', 'No such channel. Try /join #lobby.');
    } else if (command === '/me') {
      addLine(`* besokare ${argument || 'ser sig omkring.'}`, 'action', `* besokare ${argument || 'looks around.'}`);
    } else if (command === '/slap') {
      if (botSlaps >= 3) {
        addLine('*** Du har ingen öring.', 'system', '*** You have no trout.');
      } else {
        const target = argument || 'bot';
        addLine(`* besokare daskar ${target} med en öring.`, 'action', `* besokare slaps ${target} with a trout.`);
        if (target.toLowerCase() === 'bot' && ++botSlaps === 3) addLine('* bot tar ifrån besokare öringen.', 'action', '* bot takes the trout away from besokare.');
      }
    } else if (command === '/np') {
      bot(`${trackName()} · ${playing ? 'spelar' : 'stoppad eller pausad'} · demo utan ljud.`, `${trackName()} · ${playing ? 'playing' : 'stopped or paused'} · silent demo.`);
    } else if (command === '/winamp') {
      const trigger = returnFocus.get('mirc');
      returnFocus.delete('mirc');
      mirc.close();
      openExtra('winamp', trigger);
      return;
    } else if (command.startsWith('/')) {
      bot(`Okänt kommando: ${command}. Skriv /help för kommandolistan.`, `Unknown command: ${command}. Type /help for the list.`);
    } else {
      addLine(`<besokare> ${message}`, 'visitor');
      if (/^how much is the fish\s*[?!]*$/i.test(message)) {
        selectTrack(tracks.findIndex(song => song.name === 'Scooter — How Much Is the Fish?'));
        bot('den här är lånad', 'this one’s borrowed');
        addLine(`*** Winamp: ${trackName()}`);
      } else if (/^(hej|hello|hallå|tjena)(\s|[!.?]|$)/i.test(message)) bot('Hej! Ingen kö till den här servern. Prova /me eller /slap.', 'Hey! No queue on this server. Try /me or /slap.');
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
      PortfolioLanguage.text(noteStatus, 'Finns i minnet tills du lämnar sidan. Skickas ingenstans.', 'Kept in memory until you leave this page. Only you can see it.');
    }
  }
  loadNote();
  window.addEventListener('pageshow', event => {
    if (event.persisted) loadNote();
  });
  note.addEventListener('input', () => {
    try { sessionStorage.setItem(noteKey, note.value); }
    catch { PortfolioLanguage.text(noteStatus, 'Finns i minnet tills du lämnar sidan. Skickas ingenstans.', 'Kept in memory until you leave this page. Only you can see it.'); }
  });
})();
