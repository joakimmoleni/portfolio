import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const src = readFileSync(new URL('../assets/js/rally-engine.js', import.meta.url), 'utf8');
const game = vm.runInNewContext(src + '\nGhostLap');
function drive(controller) {
  const lap = game.newLap();
  while (lap.distance < game.length && lap.ticks < 6000) game.step(lap, controller(lap));
  assert.equal(lap.distance, game.length);
  return lap;
}
test('keeping the car on the road beats running on the shoulder', () => {
  const road = drive(lap => Math.max(-1, Math.min(1, -lap.lane * 4)));
  const shoulder = drive(() => 1);
  assert.ok(road.ticks < shoulder.ticks);
  assert.ok(game.validReplay(road));
  assert.ok(game.validReplay(shoulder));
});
test('a finished lap can be serialized, interpolated and replayed through its last tick', () => {
  const lap = drive(() => 0);
  const replay = JSON.parse(JSON.stringify({ticks: lap.ticks, samples: lap.samples}));
  assert.ok(game.validReplay(replay));
  const start = game.ghostAt(replay, 0), mid = game.ghostAt(replay, 3);
  assert.equal(start.distance, 0);
  assert.ok(mid.distance > 0 && mid.distance < replay.samples[1][0]);
  assert.equal(game.ghostAt(replay, lap.ticks).distance, game.length);
  assert.equal(game.ghostAt(replay, lap.ticks + 1), null);
  const ticks = lap.ticks;
  game.step(lap, 1);
  assert.equal(lap.ticks, ticks);
});
test('invalid and partial stored laps cannot become ghosts', () => {
  for (const lap of [null, {}, game.newLap(), {ticks: 6, samples: [[0,0],[1536,NaN]]},
    {ticks: 6, samples: [[0,0],[12,.1]]}, {ticks: 6, samples: [[0,0],[1536,8]]}]) {
    assert.equal(game.validReplay(lap), false);
  }
});

test('coasting on asphalt ramps to 115% and steering immediately restores the normal distance per tick', () => {
  const lap = game.newLap();
  lap.baseSpeed = 58;
  function onAsphalt(steering) {
    lap.lane = 0;
    const before = lap.distance;
    game.step(lap, steering);
    assert.ok(Math.abs(lap.distance - before - 58 * game.tick * game.pace(lap)) < 1e-10);
  }
  for (let i = 0; i < 36; i++) onAsphalt(0);
  assert.equal(game.pace(lap), 1);
  for (let i = 0; i < 54; i++) {
    const previous = game.pace(lap);
    onAsphalt(0);
    assert.ok(game.pace(lap) > previous);
  }
  onAsphalt(0);
  assert.equal(game.pace(lap), 1.15);
  onAsphalt(-1);
  assert.equal(game.pace(lap), 1);
  for (let i = 0; i < 36; i++) onAsphalt(0);
  assert.equal(game.pace(lap), 1);
});
test('gravel and opposing steering inputs cannot build a bonus', () => {
  const lap = game.newLap();
  for (let i = 0; i < 100; i++) {
    lap.lane = 0;
    game.step(lap, 0, true);
  }
  assert.equal(lap.coastTicks, 0);
  for (let i = 0; i < 95; i++) { lap.lane = 0; game.step(lap, 0); }
  assert.equal(game.pace(lap), 1.15);
  for (let i = 0; i < 95; i++) {
    lap.lane = 1.2;
    game.step(lap, 0);
    assert.equal(game.pace(lap), 1);
  }
});

test('a brief shoulder touch costs a fraction of a second and a deeper excursion costs more', () => {
  function timeAt(lane, duration) {
    const lap=game.newLap();
    while (lap.distance<game.length) {
      lap.lane=lap.ticks>=600 && lap.ticks<600+duration?lane:0;
      game.step(lap,0);
    }
    return lap.ticks;
  }
  const clear=timeAt(0,0), edge=timeAt(0.88,60), brush=timeAt(1,24), wide=timeAt(1.35,60);
  assert.ok(edge>clear && edge-clear<15);
  assert.ok(brush>clear && brush-clear<30);
  assert.ok(wide>brush && wide-clear<95);
});
