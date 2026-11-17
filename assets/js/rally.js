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

  function format(ticks) {
    const hundredths = Math.round(ticks * GhostLap.tick * 100);
    return Math.floor(hundredths / 6000) + ':' + String(Math.floor(hundredths / 100) % 60).padStart(2,'0') + ',' + String(hundredths % 100).padStart(2,'0');
  }
  function clearControls() {
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
      byId('reference').textContent = Math.abs(gap) < 2 ? 'Sida vid sida' :
        (gap > 0 ? 'Du leder med ' : 'Spöket leder med ') + Math.abs(gap) + ' m';
    }
    byId('time').textContent = format(lap.ticks);
    byId('pace').textContent = Math.round(GhostLap.pace(lap) * 100) + ' %';
    byId('progress').textContent = Math.floor(lap.distance / GhostLap.length * 100) + ' %';
  }
  function prompt(next, title, message, action) {
    cancelAnimationFrame(frame);
    clearControls();
    mode = next;
    byId('prompt').hidden = false;
    wallpaper.hidden = next !== 'finished';
    byId('heading').textContent = title;
    byId('message').textContent = message;
    go.textContent = action;
    pause.disabled = true;
    steering.forEach(button => { button.disabled = true; });
    if (dialog.open && !dialog.hidden && dialog.contains(document.activeElement)) go.focus({preventScroll:true});
  }
  function finish() {
    const delta = previous ? lap.ticks - previous.ticks : null;
    let message = 'Nästa varv kör du mot din egen inspelning.';
    if (delta !== null) message = delta === 0 ? 'Samma tid som förra varvet.' : (Math.abs(delta) * GhostLap.tick).toFixed(2).replace('.', ',') + ' s' + (delta < 0 ? ' snabbare' : ' långsammare') + ' än förra varvet.';
    previous = {ticks:lap.ticks, samples:lap.samples};
    try { localStorage.setItem(key,JSON.stringify(previous)); }
    catch { message += ' Inspelningen finns kvar tills du lämnar sidan.'; }
    const title = 'I mål på ' + format(lap.ticks);
    byId('status').textContent = title + '. ' + message;
    prompt('finished',title,message,'Kör igen');
  }
  function hold() {
    if (mode !== 'running') return;
    prompt('paused','Paus', 'Varvet väntar här.', 'Fortsätt');
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
      GhostLap.step(lap,direction,keys.size > 0 || pointers.size > 0);
      carry -= GhostLap.tick;
    }
    paint();
    if (lap.distance >= GhostLap.length) { finish(); return; }
    frame = requestAnimationFrame(loop);
  }
  function start() {
    if (mode !== 'paused') { lap = GhostLap.newLap(); carry = 0; }
    mode = 'running'; lastFrame = null;
    paint();
    byId('reference').textContent = previous ? 'Spökvarv ' + format(previous.ticks) : 'Första varvet';
    byId('status').textContent = previous ? 'Varvet har startat. Den ljusa bilen är ditt förra varv.' : 'Varvet har startat.';
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
      byId('reference').textContent = previous ? 'Spökvarv ' + format(previous.ticks) : 'Första varvet';
      prompt('ready',previous?'Spökvarvet':'Första varvet',previous?'Den ljusa bilen kör exakt som du gjorde förra varvet.':'Kör ett varv. Nästa gång möter du din egen bil.','Kör');
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
    lap.coastTicks = 0;
  });
  window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
  for (const button of steering) {
    button.addEventListener('pointerdown',event=>{
      if (mode !== 'running' || event.button !== 0) return;
      button.setPointerCapture(event.pointerId);
      lap.coastTicks = 0;
      pointers.set(event.pointerId,Number(button.dataset.steer)); button.setAttribute('data-held','');
    });
    button.addEventListener('lostpointercapture',event=>{
      pointers.delete(event.pointerId);
      if (![...pointers.values()].includes(Number(button.dataset.steer))) button.removeAttribute('data-held');
    });
    // Keyboard and assistive-technology activation also give a short steering input.
    button.addEventListener('click',event=>{
      if (mode === 'running' && event.detail === 0) {
        lap.coastTicks = 0;
        lap.lateral = Number(button.dataset.steer) * 2.35;
      }
    });
  }
  document.addEventListener('visibilitychange',()=>{ if (document.hidden) hold(); });
  window.addEventListener('blur',hold);
  window.addEventListener('pagehide',hold);
})();
