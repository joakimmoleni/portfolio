(() => {
  'use strict';
  const byId = id => document.getElementById('rally-' + id);
  const dialog = byId('window'), opener = byId('open'), go = byId('go'), pause = byId('pause');
  const screen = byId('screen'), steering = [...dialog.querySelectorAll('[data-steer]')];
  if (!screen.getContext('2d') || typeof dialog.show !== 'function') return;
  const key = 'moleni-rally-last-v1';
  const keys = new Set(), pointers = new Map();
  let previous = null, lap, mode = 'ready', frame = 0, lastFrame, carry = 0;
  const wallpaper = byId('wallpaper');
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (GhostLap.validReplay(saved)) previous = saved;
  } catch { /* Local storage is optional. */ }

  function format(ticks, lang = document.documentElement.lang) {
    const hundredths = Math.round(ticks * GhostLap.tick * 100);
    return Math.floor(hundredths / 6000) + ':' + String(Math.floor(hundredths / 100) % 60).padStart(2,'0') + (lang === 'en' ? '.' : ',') + String(hundredths % 100).padStart(2,'0');
  }
  const board = ArcadeScores.mount(byId('scores'), 'rally', format);
  let steps = [], pressed = false, tap = 0;
  function clearControls() {
    pressed = false; tap = 0;
    keys.clear(); pointers.clear();
    steering.forEach(button => button.removeAttribute('data-held'));
  }
  function driveDirection() {
    const left = keys.has('arrowleft') || keys.has('a') || [...pointers.values()].includes(-1);
    const right = keys.has('arrowright') || keys.has('d') || [...pointers.values()].includes(1);
    return Number(right) - Number(left);
  }
  function paint() {
    const ghost = GhostLap.ghostAt(previous,lap.ticks);
    RallyScene.draw(screen,lap,ghost);
    if (previous && mode === 'running') {
      const gap = Math.round(lap.distance - (ghost?.distance ?? GhostLap.length));
      const distance = Math.abs(gap) + ' m';
      byId('reference').textContent = Math.abs(gap) < 2 ? PortfolioLanguage.choose('Sida vid sida', 'Side by side') :
        (gap > 0 ? PortfolioLanguage.choose('Du leder med ', 'You lead by ') : PortfolioLanguage.choose('Spöket leder med ', 'Your ghost leads by ')) + distance;
    }
    byId('time').textContent = format(lap.ticks);
    byId('pace').textContent = Math.round(GhostLap.pace(lap) * 100) + ' %';
    byId('progress').textContent = Math.floor(lap.distance / GhostLap.length * 100) + (lap.distance<GhostLap.length && Math.abs(lap.lane)>0.9? PortfolioLanguage.choose(' % · Grus', '% · Gravel') : ' %');
  }
  function prompt(next, title, message, action) {
    cancelAnimationFrame(frame);
    clearControls();
    mode = next;
    board.visible(true);
    byId('prompt').hidden = false;
    wallpaper.hidden = next !== 'finished';
    PortfolioLanguage.text(byId('heading'), ...title);
    PortfolioLanguage.text(byId('message'), ...message);
    PortfolioLanguage.text(go, ...action);
    pause.disabled = true;
    steering.forEach(button => { button.disabled = true; });
    if (dialog.open && !dialog.hidden && dialog.contains(document.activeElement)) go.focus({preventScroll:true});
  }
  function finish() {
    const delta = previous ? lap.ticks - previous.ticks : null;
    const message = ['Nästa varv kör du mot din egen inspelning.', 'Next lap, you race your own ghost.'];
    if (delta === 0) {
      message[0] = 'Samma tid som förra varvet.';
      message[1] = 'Exactly the same time as your last lap.';
    } else if (delta !== null) {
      const seconds = (Math.abs(delta) * GhostLap.tick).toFixed(2);
      message[0] = seconds.replace('.', ',') + ' s ' + (delta < 0 ? 'snabbare' : 'långsammare') + ' än förra varvet.';
      message[1] = seconds + ' s ' + (delta < 0 ? 'faster' : 'slower') + ' than your last lap.';
    }
    previous = {ticks:lap.ticks, samples:lap.samples};
    try { localStorage.setItem(key,JSON.stringify(previous)); }
    catch {
      message[0] += ' Inspelningen finns kvar tills du lämnar sidan.';
      message[1] += ' Your ghost is available until you leave this page.';
    }
    const title = ['I mål på ' + format(lap.ticks, 'sv'), 'Finished in ' + format(lap.ticks, 'en')];
    PortfolioLanguage.text(byId('status'), title[0] + '. ' + message[0], title[1] + '. ' + message[1]);
    prompt('finished', title, message, ['Kör igen', 'Race again']);
    board.finish(lap.ticks,steps);
  }
  function hold() {
    if (mode !== 'running') return;
    prompt('paused',['Paus', 'Paused'], ['Varvet väntar här.', 'Your lap is paused.'], ['Fortsätt', 'Resume']);
  }
  function loop(now) {
    if (mode !== 'running') return;
    if (lastFrame !== null) {
      const elapsed = (now - lastFrame) / 1000;
      if (elapsed > 0.5) { hold(); return; }
      carry += elapsed;
    }
    lastFrame = now;
    const direction = driveDirection();
    while (carry >= GhostLap.tick && lap.distance < GhostLap.length) {
      const flags=Number(pressed || keys.size>0 || pointers.size>0) | tap;
      ArcadeScores.append(steps,direction,flags);
      GhostLap.drive(lap,direction,flags);
      pressed=false; tap=0;
      carry -= GhostLap.tick;
    }
    paint();
    if (lap.distance >= GhostLap.length) { finish(); return; }
    frame = requestAnimationFrame(loop);
  }
  function showReference() {
    PortfolioLanguage.text(byId('reference'),
      previous ? 'Spökvarv ' + format(previous.ticks, 'sv') : 'Första varvet',
      previous ? 'Ghost lap ' + format(previous.ticks, 'en') : 'First lap');
  }
  window.addEventListener('portfolio-language', () => {
    RallyScene.draw(byId('art'), cover, null, true);
    if (lap) paint();
  });
  function start() {
    if (mode !== 'paused') { lap = GhostLap.newLap(); carry = 0; steps=[]; board.start(); }
    board.visible(false);
    mode = 'running'; lastFrame = null;
    paint();
    showReference();
    PortfolioLanguage.text(byId('status'),
      previous ? 'Varvet har startat. Den ljusa bilen är ditt förra varv.' : 'Varvet har startat.',
      previous ? 'Lap started. The pale car is your ghost.' : 'Lap started.');
    byId('prompt').hidden = true;
    wallpaper.hidden = true;
    steering.forEach(button => { button.disabled = false; });
    pause.disabled = false;
    pause.focus({preventScroll:true});
    frame = requestAnimationFrame(loop);
  }
  const cover = {...GhostLap.newLap(),distance:193,lane:-.22};
  RallyScene.draw(byId('art'),cover,null,true);
  opener.hidden = false;
  function open() {
    dialog.hidden = false;
    if (mode === 'ready') {
      lap = GhostLap.newLap();
      showReference();
      prompt('ready', previous ? ['Spökvarvet', 'Spökvarvet'] : ['Första varvet', 'First lap'],
        previous ? ['Den ljusa bilen kör exakt som du gjorde förra varvet.', 'The pale car follows your last lap, turn for turn.'] :
          ['Kör ett varv. Nästa gång möter du din egen bil.', 'Drive a lap. Next time, you’ll race your own ghost.'],
        ['Kör', 'Drive']);
      paint();
    }
    if (!dialog.open) dialog.show();
    window.DesktopWindows.opened(dialog);
    (mode === 'running' ? pause : go).focus();
  }
  window.DesktopWindows.register(dialog, {title:'Spökvarvet', icon:'./assets/images/rally-icon.svg', restore:open, minimize:hold});
  opener.addEventListener('click',open);
  dialog.addEventListener('desktop-deactivate',hold);
  go.addEventListener('click',start);
  pause.addEventListener('click',hold);
  byId('close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{ hold(); mode = 'ready'; opener.focus({preventScroll:true}); });
  dialog.addEventListener('cancel',event=>{ if (mode === 'running') { event.preventDefault(); hold(); } });
  const driveKeys = new Set(['arrowleft','arrowright','a','d']);
  dialog.addEventListener('keydown',event=>{
    if (event.key === 'Escape') {
      event.preventDefault();
      if (mode === 'running') hold(); else dialog.close();
      return;
    }
    const code=event.key.toLowerCase();
    if (mode !== 'running' || event.metaKey || event.ctrlKey || event.altKey || !driveKeys.has(code)) return;
    event.preventDefault(); keys.add(code);
    pressed = true;
  });
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
  for (const button of steering) {
    button.addEventListener('pointerdown',event=>{
      if (mode !== 'running' || event.button !== 0) return;
      button.setPointerCapture(event.pointerId);
      pressed = true;
      pointers.set(event.pointerId,Number(button.dataset.steer)); button.setAttribute('data-held','');
    });
    button.addEventListener('lostpointercapture',event=>{
      pointers.delete(event.pointerId);
      if (![...pointers.values()].includes(Number(button.dataset.steer))) button.removeAttribute('data-held');
    });
    // Keyboard and assistive-technology activation also give a short steering input.
    button.addEventListener('click',event=>{
      if (mode === 'running' && event.detail === 0) {
        pressed = true;
        tap = Number(button.dataset.steer)<0 ? 2 : 4;
      }
    });
  }
  document.addEventListener('visibilitychange',()=>{ if (document.hidden) hold(); });
  window.addEventListener('blur',hold);
  window.addEventListener('pagehide',hold);
})();
