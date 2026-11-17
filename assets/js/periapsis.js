(() => {
  'use strict';
  const byId = name => document.getElementById('space-' + name);
  const panel=byId('window'), screen=byId('screen'), ctx=screen.getContext('2d');
  const cover=byId('art'), opener=byId('open'), go=byId('go'), pause=byId('pause');
  if (!ctx || !cover.getContext('2d') || typeof panel.show !== 'function') return;
  const keys=new Set();
  const arrows={arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0],
    arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1]};
  const stars=Array.from({length:88},(_,i)=>({
    x:(i*137+i*i*3)%389, y:(i*79+i*i*13)%193, layer:i%3
  }));
  let s=Periapsis.flight(), mode='ready', frame, last=null, carry=0, pointer=null, best=0;
  try { best=Math.max(0,Number(localStorage.getItem('moleni-periapsis-best')) || 0); } catch {}
  const box=(c,color,x,y,w,h)=>{ c.fillStyle=color; c.fillRect(Math.round(x),Math.round(y),w,h); };
  function field(c,w,h,tick) {
    box(c,'#020306',0,0,w,h);
    for (const star of stars) {
      const x=((star.x-tick*(star.layer+1)*.23)%w+w)%w, y=star.y*h/193;
      box(c,['#344253','#6e7481','#bdb9a9'][star.layer],x,y,1,1);
    }
  }
  function drone(c,x,y,carrier,t) {
    c.save(); c.translate(Math.round(x),Math.round(y));
    const plate=carrier?'#e0a14a':'#97788e', light=carrier?'#ffe594':'#dfb6b9';
    for (const side of [-1,1]) {
      c.save(); c.scale(1,side);
      box(c,'#34415a',-6,2,13,3);
      box(c,plate,-8,4,10,3); box(c,light,-8,4,5,1);
      box(c,'#51475e',1,5,7,2); box(c,plate,5,6,4,2);
      c.restore();
    }
    box(c,'#445366',-7,-3,11,6); box(c,'#e46f57',-8,-2,4,4);
    box(c,'#ffe0a3',-8,-1,3,2); box(c,'#8499a0',1,-2,5,4);
    box(c,t%12<6?'#c96746':'#ef9865',7,-1,3,2);
    c.restore();
  }
  function boss(c,x,y,t) {
    c.save(); c.translate(Math.round(x),Math.round(y));
    for (const side of [-1,1]) {
      c.save(); c.scale(1,side);
      box(c,'#323348',-13,2,39,10); box(c,'#62536b',-17,8,39,5);
      box(c,'#98829a',-16,8,27,2); box(c,'#c3a2a1',-12,11,17,2);
      box(c,'#4d455a',-7,13,29,5); box(c,'#837487',-5,14,19,2);
      box(c,'#b56a50',-22,12,16,3); box(c,'#f3af6d',-23,12,11,1);
      box(c,'#564857',-25,15,12,3); box(c,'#d38b67',-29,17,9,2);
      box(c,'#7a6075',15,15,10,5); box(c,'#be908d',19,19,7,2);
      for (let i=0;i<4;i++) box(c,'#2d3044',-4+i*5,8,2,5);
      c.restore();
    }
    box(c,'#555670',-21,-5,45,10); box(c,'#988998',-21,-5,33,2);
    box(c,'#30283a',-25,-4,22,8);
    box(c,t%96>72?'#ffd77b':'#dd6950',-25,-3,18,6);
    box(c,'#fff1b0',-24,-1,10,2); box(c,'#e4bda0',11,-2,13,4);
    c.restore();
  }
  function fighter(c,x,y,w=40) {
    c.save();
    c.translate(Math.round(x-w/2),Math.round(y-w*.35));
    c.scale(w/40,w/40);
    // Paint the hull directly so the first frame never depends on image loading.
    box(c,'#f57d48',0,12,11,5);
    box(c,'#fff1a8',4,13,8,3);
    for (const side of [-1,1]) {
      c.save(); c.translate(0,14); c.scale(1,side);
      box(c,'#677c94',10,3,15,4); box(c,'#bacbd0',10,7,10,3);
      box(c,'#ed825d',8,10,7,2); box(c,'#ffe1b8',8,11,4,1);
      c.restore();
    }
    box(c,'#40596e',7,9,16,11); box(c,'#849eac',11,8,16,11);
    box(c,'#cfdbd9',14,11,19,6); box(c,'#eef4dc',25,12,12,4);
    box(c,'#fff4d9',33,13,7,2); box(c,'#395c77',15,9,11,3);
    box(c,'#73e1ec',17,8,7,3); box(c,'#d1ffff',19,8,4,1);
    box(c,'#e98162',11,14,10,2); box(c,'#ffbd7e',7,12,2,5);
    c.restore();
  }
  function sleeve() {
    const c=cover.getContext('2d');
    c.imageSmoothingEnabled=false;
    field(c,384,132,0);
    c.save(); c.translate(305,66); c.scale(2.5,2.5); boss(c,0,0,80); c.restore();
    fighter(c,91,101,50);
    for (const x of [123,157,191]) {
      box(c,'#3babae',x,99,20,3); box(c,'#cdfcf1',x,100,15,1);
    }
  }
  function paint() {
    ctx.imageSmoothingEnabled=false;
    field(ctx,384,192,s.tick);
    for (const e of s.enemies) {
      if(e.boss) {
        boss(ctx,e.x,e.y,e.age);
        box(ctx,'#4d3c42',e.x-23,e.y-25,46,2);
        box(ctx,'#eeb691',e.x-23,e.y-25,Math.ceil(e.hp/44*46),2);
      } else drone(ctx,e.x,e.y,e.carrier,s.tick);
    }
    for (const b of s.bolts) {
      const len=[6,10,16][s.laser];
      box(ctx,s.laser===2?'#6dcdb3':'#57aebc',b.x-len,b.y-1,len,3);
      box(ctx,'#e4fff3',b.x-len+2,b.y,len-2,1);
    }
    for (const b of s.hostile) { box(ctx,'#ef7754',b.x-2,b.y-2,5,5); box(ctx,'#ffecae',b.x-1,b.y-1,3,3); }
    for (const cell of s.cells) {
      box(ctx,'#92ead2',cell.x-4,cell.y-4,9,9); box(ctx,'#173f44',cell.x-3,cell.y-3,7,7);
      box(ctx,'#d0ffdb',cell.x,cell.y-2,1,5); box(ctx,'#d0ffdb',cell.x-2,cell.y,5,1);
    }
    if (s.grace && Math.floor(s.tick/9)%2===0) {
      ctx.strokeStyle='#78b7c9';
      ctx.strokeRect(Math.round(s.x)-17,Math.round(s.y)-12,35,24);
    }
    fighter(ctx,s.x,s.y);
    for (const p of s.sparks) box(ctx,p.color,p.x,p.y,p.life>10?2:1,1);
    const values={score:s.score,hull:s.hull+' / 3',laser:Periapsis.lasers[s.laser]};
    for(const [name,value] of Object.entries(values)) {
      const node=byId(name); if(node.textContent!==String(value)) node.textContent=value;
    }
  }
  function prompt(title,message,action) {
    cancelAnimationFrame(frame); keys.clear(); pointer=null;
    byId('heading').textContent=title; byId('message').textContent=message;
    go.textContent=action; byId('prompt').hidden=false; pause.disabled=true;
    if(panel.open && !panel.hidden && panel.contains(document.activeElement)) go.focus({preventScroll:true});
  }
  function hold() {
    if(mode!=='running') return;
    mode='paused'; prompt('Paus','Din flygning väntar här.','Fortsätt');
  }
  function loop(now) {
    if(mode!=='running') return;
    if(last!==null && now-last>500) { hold(); return; }
    carry+=last===null?0:now-last; last=now;
    let dx=0, dy=0;
    for (const key of keys) { dx+=arrows[key][0]; dy+=arrows[key][1]; }
    while(carry>=1000/60 && !s.result) {
      if(pointer) { dx=(pointer.x-s.x)/2.15; dy=(pointer.y-s.y)/2.15; }
      Periapsis.step(s,dx,dy); carry-=1000/60;
    }
    paint();
    if(s.result) {
      mode='finished';
      best=Math.max(best,s.score);
      try { localStorage.setItem('moleni-periapsis-best',String(best)); } catch {}
      prompt(s.result==='won'?'Sektorn är fri':'Skrovet gav upp',s.score+' poäng · Personbästa '+best,'Flyg igen');
    } else frame=requestAnimationFrame(loop);
  }
  function open() {
    panel.hidden=false;
    if(!panel.open) panel.show();
    paint();
    window.DesktopWindows.opened(panel);
    (mode==='running'?pause:go).focus({preventScroll:true});
  }
  window.DesktopWindows.register(panel,{title:'Periapsis',icon:'./assets/images/periapsis-icon.svg',restore:open,minimize:hold});
  opener.addEventListener('click',open);
  go.addEventListener('click',()=>{
    if(mode!=='paused') {
      s=Periapsis.flight();
      Periapsis.step(s);
      carry=0;
    }
    paint();
    mode='running'; last=null; byId('prompt').hidden=true; pause.disabled=false;
    screen.focus({preventScroll:true}); frame=requestAnimationFrame(loop);
  });
  pause.addEventListener('click',hold);
  byId('close').addEventListener('click',()=>panel.close());
  panel.addEventListener('close',()=>{
    hold(); mode='ready'; s=Periapsis.flight();
    prompt('Redo för start','Skjut de guldfärgade fienderna och plocka deras laserceller.','Flyg');
    paint(); opener.focus({preventScroll:true});
  });
  panel.addEventListener('keydown',e=>{
    if(e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.key==='Escape') { e.preventDefault(); if(mode==='running') hold(); else panel.close(); return; }
    const key=e.key.toLowerCase();
    if(mode==='running' && Object.hasOwn(arrows,key)) { e.preventDefault(); keys.add(key); }
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  screen.addEventListener('pointerdown',e=>{
    if(mode!=='running' || pointer || e.button!==0) return;
    screen.setPointerCapture(e.pointerId);
    pointer={id:e.pointerId,x:s.x,y:s.y,lastX:e.clientX,lastY:e.clientY};
  });
  screen.addEventListener('pointermove',e=>{
    if(!pointer || pointer.id!==e.pointerId) return;
    const rect=screen.getBoundingClientRect();
    pointer.x=Math.max(12,Math.min(366,pointer.x+(e.clientX-pointer.lastX)*384/rect.width));
    pointer.y=Math.max(9,Math.min(182,pointer.y+(e.clientY-pointer.lastY)*192/rect.height));
    pointer.lastX=e.clientX; pointer.lastY=e.clientY;
  });
  screen.addEventListener('lostpointercapture',()=>{ pointer=null; });
  panel.addEventListener('desktop-deactivate',hold);
  window.addEventListener('blur',hold); window.addEventListener('pagehide',hold);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) hold(); });
  screen.addEventListener('contextrestored',paint);
  cover.addEventListener('contextrestored',sleeve);
  sleeve(); opener.hidden=false;
})();
