import { leaderboard } from './leaderboard.mjs';

export default {
  async fetch(request,env) {
    const db = {
      async all(sql,...args) { return (await env.DB.prepare(sql).bind(...args).all()).results; },
      save(...statements) { return env.DB.batch(statements.map(([sql,...args])=>env.DB.prepare(sql).bind(...args))); }
    };
    return leaderboard(request,db,{rally:GhostLap,space:Periapsis});
  }
};
