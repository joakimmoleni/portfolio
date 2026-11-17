import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
const engine=readFileSync(new URL('../assets/js/periapsis-engine.js',import.meta.url),'utf8');
const game=vm.runInNewContext(engine+'\nPeriapsis');

test('cells give distinct single, double and spread patterns and cap at prism',()=>{
  const s=game.flight();
  for (const count of [1,2,4,4]) {
    s.bolts=[]; s.tick=11; game.step(s);
    assert.equal(s.bolts.length,count);
    s.cells.push({x:s.x,y:s.y}); game.step(s);
  }
  assert.equal(s.laser,2);
});
test('simultaneous hits spend one hull point and a lost flight freezes',()=>{
  const s=game.flight();
  const hit=()=>s.hostile.push({x:s.x,y:s.y,vx:0,vy:0});
  hit();hit();game.step(s);
  assert.equal(s.hull,2);
  for(let i=0;i<2;i++) { s.grace=0;hit();game.step(s); }
  assert.equal(s.result,'lost');
  const tick=s.tick;game.step(s);assert.equal(s.tick,tick);
});
test('a full flight can collect both upgrades and beat the final ship',()=>{
  const s=game.flight();
  while(!s.result && s.tick<8000) {
    const cell=s.cells.find(cell=>cell.x>s.x-8);
    const target=cell || s.enemies.find(e=>e.carrier && e.x>s.x) || s.enemies.find(e=>e.x>s.x);
    const dy=target?Math.sign(target.y-s.y):0;
    game.step(s,0,dy);
  }
  assert.equal(s.wave,9); assert.equal(s.laser,2);
  assert.equal(s.result,'won'); assert.ok(s.score>=1200);
});
