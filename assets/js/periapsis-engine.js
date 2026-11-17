/* Coordinates are in screen pixels. The simulation advances one 60 Hz tick at a time. */
const Periapsis = (() => {
  'use strict';
  const width = 384, height = 192;
  const weapons = [
    {name:'Puls', cells:0, interval:11},
    {name:'Dubbellaser', cells:3, interval:11},
    {name:'Prisma', cells:6, interval:10},
    {name:'Sökrobot', cells:10, interval:15},
    {name:'Robotsalva', cells:15, interval:14}
  ];
  const sectors = ['Yttre ringen', 'Sundpassagen', 'Varvet'];
  const wavesPerSector = 8;
  const finalWave = sectors.length * wavesPerSector;
  const bossHull = 96;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function flight() {
    const s = {tick: 0, x: 48, y: 97, hull: 3, weapon: 0, collected: 0, sector: 0, grace: 0, score: 0, chain: 0,
      enemies: [], bolts: [], hostile: [], cells: [], sparks: [], wave: 0, result: null};
    spawn(s);
    return s;
  }
  function spawn(s) {
    const wave = s.wave++;
    if (wave === finalWave) {
      s.enemies.push({boss:true, x:424, y:96, hp:bossHull, age:0});
      return;
    }
    s.sector = Math.floor(wave / wavesPerSector);
    const position = wave % wavesPerSector;
    const centre = [94, 60, 128, 90, 51, 136, 74, 113][position];
    const startX = wave === 0 ? width - 105 : width + 10;
    const count = 5 + s.sector;
    for (let i=0; i<count; i++) {
      const phase = i * .59;
      const spread = s.sector === 2 ? (i % 2 ? -30 : 30) : 0;
      const mid = centre + spread;
      const direction = s.sector > 0 && i % 2 ? -1 : 1;
      s.enemies.push({x:startX+i*24, y:mid+Math.sin(phase)*19, mid, age:0, phase,
        direction, gunner:s.sector>0 && (i===0 || (s.sector===2 && i===5)), hp:i===2?3:1, carrier:i===2, wave});
    }
  }
  function fire(s) {
    if (s.weapon >= 3) {
      const offsets = s.weapon === 3 ? [0] : [-7,7];
      for (const offset of offsets) {
        s.bolts.push({x:s.x+21, y:s.y+offset, vy:offset*.1, rocket:true, damage:3});
      }
      return;
    }
    const offsets = s.weapon === 0 ? [0] : [-4,4];
    for (const offset of offsets) s.bolts.push({x:s.x+21, y:s.y+offset, vy:0, tier:s.weapon});
    if (s.weapon === 2) {
      for (const vy of [-.7,.7]) s.bolts.push({x:s.x+8, y:s.y, vy, tier:s.weapon});
    }
  }
  function moveBolt(s,b) {
    if (b.rocket) {
      let nearest = null;
      let distance = Infinity;
      for (const e of s.enemies) {
        const dx = e.x-b.x, dy = e.y-b.y;
        const range = dx*dx + dy*dy*3;
        if (dx>0 && range<distance) { nearest=e; distance=range; }
      }
      if (nearest) {
        const desired = clamp((nearest.y-b.y)*.13,-2.3,2.3);
        b.vy += clamp(desired-b.vy,-.16,.16);
      }
      b.x+=4.3;
    } else b.x+=5.4;
    b.y+=b.vy;
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
    s.chain=0;
    s.grace=88;
    burst(s,s.x,s.y,'#e87859');
    if (!s.hull) s.result='lost';
  }
  function updateEnemy(s,e) {
    e.age++;
    if (e.boss) {
      e.x=Math.max(317,e.x-.78);
      e.y=95+Math.sin(e.age/69)*49;
      if (e.age >= 7200) { s.result='escaped'; return; }
      if (e.age>108 && e.age%96===0) {
        const aim=Math.atan2(s.y-e.y,s.x-e.x);
        for (const angle of [aim-.19,aim,aim+.19])
          s.hostile.push({x:e.x-23,y:e.y,vx:1.6*Math.cos(angle),vy:1.6*Math.sin(angle)});
      }
    } else {
      e.x-=1.13+e.wave*.028;
      e.y=e.mid+Math.sin(e.direction*e.age*.036+e.phase)*19;
      if (e.gunner && e.age===115) {
        const aim=Math.atan2(s.y-e.y,s.x-e.x);
        s.hostile.push({x:e.x-6,y:e.y,vx:1.75*Math.cos(aim),vy:1.75*Math.sin(aim)});
      }
      if (e.carrier && e.age===157) s.hostile.push({x:e.x-6,y:e.y,vx:-2,vy:clamp((s.y-e.y)/100,-1,1)});
    }
    const rx=e.boss?25:8, ry=e.boss?17:6;
    for (const b of s.bolts) {
      if (b.used || Math.abs(b.x-e.x)>rx+4 || Math.abs(b.y-e.y)>ry) continue;
      b.used=true;
      e.hp -= b.damage || 1;
      if (b.rocket) burst(s,b.x,b.y,'#ffb36b');
      if (e.hp<=0) {
        if (e.boss) {
          s.score+=1000 + 200*s.hull + Math.max(0,1200-Math.floor(e.age/2));
        } else {
          // Intercepting a formation early is worth more, even after reaching the chain cap.
          const intercept=Math.round(30*clamp(e.x/width,0,1));
          s.score+=((e.carrier?150:75)+intercept)*multiplier(s);
          s.chain++;
        }
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
    if (s.tick===1+230*s.wave && s.wave<=finalWave) spawn(s);
    if ((s.tick-1)%weapons[s.weapon].interval===0) fire(s);
    for (const b of s.bolts) moveBolt(s,b);
    for (const e of s.enemies) {
      updateEnemy(s,e);
      if (s.result) break;
    }
    if (s.enemies.some(e=>e.x<=-36 && e.hp>0)) s.chain=0;
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
        s.collected++;
        if (weapons[s.weapon+1] && s.collected >= weapons[s.weapon+1].cells) s.weapon++;
        s.score+=100; cell.used=true;
        burst(s,s.x,s.y,'#78e3ce');
      }
    }
    s.cells=s.cells.filter(c=>!c.used && c.x>-10);
    for (const p of s.sparks) { p.x+=p.vx; p.y+=p.vy; p.life--; }
    s.sparks=s.sparks.filter(p=>p.life>0);
  }
  function multiplier(s) { return 1+Math.min(3,Math.floor(s.chain/5)); }
  return {width, height, weapons, sectors, bossHull, multiplier, flight, step};
})();
