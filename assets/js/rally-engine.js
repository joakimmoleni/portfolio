// A fixed simulation tick makes a recorded lap replay identically at any display refresh rate.
const GhostLap = (() => {
  'use strict';
  const length = 1536;
  const tick = 1 / 60;
  const sampleTicks = 6;
  const coastDelayTicks = 36;
  const coastRampTicks = 54;
  const maxPaceGain = 0.15;
  const frequency = 2 * Math.PI / length;
  const bends = [[37, 3, 0.3], [11, 5, 1.5], [4, 8, -0.7]];
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  // Precompute the periodic centreline and its derivatives once, outside the draw loop.
  const positions = new Float64Array(length + 1);
  const slopes = new Float64Array(length + 1);
  const turns = new Float64Array(length + 1);
  for (let i = 0; i <= length; i++) {
    for (const [amplitude, cycles, phase] of bends) {
      const w = frequency * cycles;
      const angle = w * i + phase;
      positions[i] += amplitude * Math.sin(angle);
      slopes[i] += amplitude * w * Math.cos(angle);
      turns[i] -= amplitude * w * w * Math.sin(angle);
    }
  }
  function at(table, distance) {
    const p = (distance % length + length) % length;
    const i = Math.floor(p);
    return table[i] + (table[i + 1] - table[i]) * (p - i);
  }
  function newLap() {
    return { distance: 0, lane: 0, lateral: 0, baseSpeed: 20, coastTicks: 0, ticks: 0, samples: [[0, 0]] };
  }
  function pace(lap) {
    return 1 + maxPaceGain * clamp((lap.coastTicks - coastDelayTicks) / coastRampTicks, 0, 1);
  }
  function step(lap, steering, steeringHeld = steering !== 0) {
    if (lap.distance >= length) return;
    const onRoad = Math.abs(lap.lane) <= 0.9;
    lap.coastTicks = onRoad && !steeringHeld ? Math.min(lap.coastTicks + 1, coastDelayTicks + coastRampTicks) : 0;
    const targetSpeed = onRoad ? 58 : 23;
    lap.baseSpeed += (targetSpeed - lap.baseSpeed) * tick * 1.8;
    const speed = lap.baseSpeed * pace(lap);
    lap.lateral += (clamp(steering, -1, 1) * 2.35 - lap.lateral) * tick * 8;
    const drift = at(turns, lap.distance) * speed * speed * 0.052;
    lap.lane = clamp(lap.lane + (lap.lateral - drift) * tick, -1.4, 1.4);
    lap.distance = Math.min(length, lap.distance + speed * tick);
    lap.ticks++;
    if (lap.ticks % sampleTicks === 0 || lap.distance === length) {
      lap.samples.push([Math.round(lap.distance * 100) / 100, Math.round(lap.lane * 1000) / 1000]);
    }
  }
  function validReplay(replay) {
    if (!replay || !Number.isInteger(replay.ticks) || replay.ticks < 1 || replay.ticks > 6000 || !Array.isArray(replay.samples)) return false;
    const points = replay.samples;
    if (points.length !== Math.ceil(replay.ticks / sampleTicks) + 1) return false;
    if (!points.every((point, i) => Array.isArray(point) && point.length === 2 &&
      Number.isFinite(point[0]) && point[0] >= 0 && point[0] <= length &&
      (i === 0 || point[0] >= points[i - 1][0]) && Number.isFinite(point[1]) && Math.abs(point[1]) <= 1.4)) return false;
    return points[0][0] === 0 && points[points.length - 1][0] === length;
  }
  function ghostAt(replay, ticks) {
    if (!replay || ticks > replay.ticks) return null;
    const index = Math.min(Math.floor(ticks / sampleTicks), replay.samples.length - 2);
    const a = replay.samples[index], b = replay.samples[index + 1];
    const blend = (ticks - index * sampleTicks) / Math.min(sampleTicks, replay.ticks - index * sampleTicks);
    return { distance: a[0] + (b[0] - a[0]) * blend, lane: a[1] + (b[1] - a[1]) * blend };
  }
  return { length, tick, newLap, step, pace, validReplay, ghostAt,
    position: distance => at(positions, distance), slope: distance => at(slopes, distance) };
})();
