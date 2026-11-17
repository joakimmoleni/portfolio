/* Coordinates are in screen pixels. The simulation advances one 60 Hz tick at a time. */
const Periapsis = (() => {
  'use strict';
  const width = 384, height = 192;
  const lasers = ['Puls', 'Dubbellaser', 'Prisma'];
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function flight() {
    const s = {tick: 0, x: 48, y: 97, hull: 3, laser: 0, grace: 0, score: 0,
      enemies: [], bolts: [], hostile: [], cells: [], sparks: [], wave: 0, result: null};
    spawn(s);
    return s;
  }
  function spawn(s) {
    const wave = s.wave++;
    if (wave === 8) {
      s.enemies.push({boss:true, x:424, y:96, hp:44, age:0});
      return;
    }
    const mid = [94, 60, 128, 90, 51, 136, 74, 113][wave];
    const startX = wave === 0 ? width - 105 : width + 10;
    for (let i=0; i<5; i++) {
      const phase = i * .59;
      s.enemies.push({x:startX+i*24, y:mid+Math.sin(phase)*19, mid, age:0, phase,
        hp:i===2?3:1, carrier:i===2, wave});
    }
  }
  function fire(s) {
    const offsets = s.laser === 0 ? [0] : [-4, 4];
    for (const offset of offsets) s.bolts.push({x:s.x+13, y:s.y+offset, vy:0});
    if (s.laser===2) {
      for (const vy of [-.7,.7]) s.bolts.push({x:s.x+8, y:s.y, vy});
    }
  }
  function burst(s, x, y, color) {
    for (let i=0; i<10; i++) {
      const angle=i*Math.PI*.2;
      const speed=.6+(i%3)*.45;
      s.sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:18+i%5,color});
    }
  }
  function damage(s) {
    if (s.grace || !s.hull) return;
    s.hull--;
    s.grace=88;
    burst(s,s.x,s.y,'#e87859');
    if (!s.hull) s.result='lost';
  }
  function updateEnemy(s,e) {
    e.age++;
    if (e.boss) {
      e.x=Math.max(317,e.x-.78);
      e.y=95+Math.sin(e.age/69)*49;
      if (e.age>108 && e.age%96===0) {
        const aim=Math.atan2(s.y-e.y,s.x-e.x);
        for (const angle of [aim-.19,aim,aim+.19])
          s.hostile.push({x:e.x-23,y:e.y,vx:1.6*Math.cos(angle),vy:1.6*Math.sin(angle)});
      }
    } else {
      e.x-=1.13+e.wave*.055;
      e.y=e.mid+Math.sin(e.age*.036+e.phase)*19;
      if (e.carrier && e.age===157) s.hostile.push({x:e.x-6,y:e.y,vx:-2,vy:clamp((s.y-e.y)/100,-1,1)});
    }
    const rx=e.boss?25:8, ry=e.boss?17:6;
    for (const b of s.bolts) {
      if (b.used || Math.abs(b.x-e.x)>rx+4 || Math.abs(b.y-e.y)>ry) continue;
      b.used=true;
      if (--e.hp<=0) {
        s.score+=e.boss?1000:e.carrier?150:75;
        burst(s,e.x,e.y,e.boss?'#ffe598':'#ff945f');
        if(e.carrier) s.cells.push({x:e.x,y:e.y});
        if(e.boss) s.result='won';
        return;
      }
    }
    if (Math.abs(s.x-e.x)<rx+5 && Math.abs(s.y-e.y)<ry+3) damage(s);
  }
  function step(s, dx=0, dy=0) {
    if (s.result) return;
    s.tick++;
    if (s.grace) s.grace--;
    const scale=2.15/Math.max(1,Math.hypot(dx,dy));
    s.x=clamp(s.x+dx*scale,12,width-18);
    s.y=clamp(s.y+dy*scale,9,height-10);
    if (s.tick===1+230*s.wave && s.wave<=8) spawn(s);
    if (s.tick%11===1) fire(s);
    for (const b of s.bolts) { b.x+=5.4; b.y+=b.vy; }
    for (const e of s.enemies) {
      updateEnemy(s,e);
      if (s.result) break;
    }
    s.enemies=s.enemies.filter(e=>e.x>-36 && e.hp>0);
    s.bolts=s.bolts.filter(b=>!b.used && b.x<width+10 && b.y>=0 && b.y<height);
    for (const b of s.hostile) {
      b.x+=b.vx; b.y+=b.vy;
      if (!s.result && Math.abs(s.x-b.x)<6 && Math.abs(s.y-b.y)<5) { damage(s); b.used=true; }
    }
    s.hostile=s.hostile.filter(b=>!b.used && b.x>-3 && b.x<width+5 && b.y>-3 && b.y<height+3);
    for (const cell of s.cells) {
      cell.x-=1.45;
      if (Math.hypot(s.x-cell.x,s.y-cell.y)<42) cell.y+=clamp(s.y-cell.y,-1.8,1.8);
      if (!s.result && Math.abs(cell.x-s.x)<13 && Math.abs(cell.y-s.y)<10) {
        s.laser=Math.min(2,s.laser+1); s.score+=100; cell.used=true;
        burst(s,s.x,s.y,'#78e3ce');
      }
    }
    s.cells=s.cells.filter(c=>!c.used && c.x>-10);
    for (const p of s.sparks) { p.x+=p.vx; p.y+=p.vy; p.life--; }
    s.sparks=s.sparks.filter(p=>p.life>0);
  }
  return {width, height, lasers, flight, step};
})();
