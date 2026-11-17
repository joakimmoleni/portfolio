import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
const engine=readFileSync(new URL('../assets/js/periapsis-engine.js',import.meta.url),'utf8');
const game=vm.runInNewContext(engine+'\nPeriapsis');

test('cells gradually unlock laser patterns, then replace lasers with missiles',()=>{
  const s=game.flight();
  for (let cells=0;cells<=16;cells++) {
    s.bolts=[]; s.tick=0; game.step(s);
    const tier=[3,6,10,15].filter(min=>cells>=min).length;
    assert.equal(s.weapon,tier);
    assert.equal(s.bolts.length,[1,2,4,1,2][tier]);
    assert.equal(s.bolts.some(b=>b.rocket),tier>=3);
    s.cells.push({x:s.x,y:s.y}); game.step(s);
  }
});
test('streak breaks on damage or an escaping ship, and simultaneous hits only cost one hull point',()=>{
  const s=game.flight();
  s.chain=12; assert.equal(game.multiplier(s),3);
  s.enemies[0].x=-36; game.step(s); assert.equal(s.chain,0);
  s.chain=15; assert.equal(game.multiplier(s),4);
  const hit=()=>s.hostile.push({x:s.x,y:s.y,vx:0,vy:0});
  hit();hit();game.step(s);
  assert.equal(s.hull,2); assert.equal(s.chain,0);
  for(let i=0;i<2;i++) { s.grace=0;hit();game.step(s); }
  assert.equal(s.result,'lost');
  const tick=s.tick;game.step(s);assert.equal(s.tick,tick);
});
function play(x,follow) {
  const s=game.flight();
  while(!s.result && s.tick<14000) {
    const target=s.cells.find(c=>c.x>s.x-8) || s.enemies.find(e=>e.carrier && e.x>s.x) || s.enemies.find(e=>e.x>s.x);
    game.step(s,Math.sign(x-s.x),follow && target?Math.sign(target.y-s.y):0);
  }
  return s;
}
test('two winning routes can earn different scores, while passive play falls behind',()=>{
  const rear=play(48,true), forward=play(130,true), idle=play(48,false);
  for (const s of [rear,forward]) {
    assert.equal(s.wave,25); assert.equal(s.weapon,4); assert.equal(s.result,'won');
    assert.ok(s.tick>=90*60);
  }
  assert.notEqual(rear.score,forward.score);
  assert.equal(idle.result,'lost'); assert.ok(idle.score<Math.min(rear.score, forward.score));
});
