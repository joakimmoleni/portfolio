import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import vm from 'node:vm';
import { localLeaderboard } from '../arcade/local.mjs';
const engine = (file,name) => vm.runInNewContext(readFileSync(new URL('../assets/js/'+file+'-engine.js',import.meta.url),'utf8')+'\n'+name);
const rally=engine('rally','GhostLap'), space=engine('periapsis','Periapsis');
function run(game,x,name) {
  const state=game==='rally'?rally.newLap():space.flight();
  while(game==='rally'?state.distance<rally.length:!state.result) {
    if (game==='rally') rally.drive(state,x,0);
    else space.step(state,x/127,0);
  }
  const ticks=state.ticks || state.tick;
  return {id:randomUUID(),name,value:game==='rally'?ticks:state.score,steps:[[ticks,x,0]]};
}
const request = (game,data) => new Request('http://localhost/api/scores/'+game,data && {
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)
});
test('independent clients share persistent rankings with validated initials, retries and replay checks',async()=>{
  const folder=mkdtempSync(join(tmpdir(),'portfolio-scores-'));
  try {
    const database=join(folder,'scores.sqlite');
    const send=localLeaderboard(database);
    const fast=run('rally',0,'åke'), slow=run('rally',1,'ABC');
    for (const data of [slow,fast,fast,{...fast,id:randomUUID()}]) assert.equal((await send(request('rally',data))).status,200);
    const read=localLeaderboard(database);
    const entries=async game=>(await (await read(request(game))).json()).entries;
    assert.deepEqual((await entries('rally')).map(r=>[r.name,r.value]),[['ÅKE',fast.value],['ABC',slow.value]]);
    for (const name of ['KUK','fAn','A2Z','ABCD','AB','RÖV']) assert.equal((await send(request('rally',{...fast,name}))).status,400);
    for (const changes of [{value:1},{steps:[[1,0,0]]},{steps:[[6001,0,0]]}]) {
      assert.equal((await send(request('rally',{...fast,...changes}))).status,422);
    }
    for (let i=0;i<12;i++) await send(request('rally',{...slow,id:randomUUID(),name:'AZ'+String.fromCharCode(65+i)}));
    assert.equal((await entries('rally')).length,10);
    const flights=[run('space',0,'JET'),run('space',127,'ORB')];
    for (const f of flights) assert.equal((await send(request('space',f))).status,200);
    assert.deepEqual((await entries('space')).map(r=>r.value),flights.map(f=>f.value).sort((a,b)=>b-a));
  } finally { rmSync(folder,{recursive:true,force:true}); }
});
