import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { leaderboard } from './leaderboard.mjs';

export function localLeaderboard(databasePath) {
  if (databasePath!==':memory:') mkdirSync(dirname(databasePath),{recursive:true});
  const store=new DatabaseSync(databasePath);
  store.exec(readFileSync(new URL('./drizzle/0000_high_scores.sql',import.meta.url),'utf8'));
  const engine = (file,name) => runInContext(readFileSync(new URL('../assets/js/'+file,import.meta.url),'utf8')+'\n'+name,createContext({}));
  const engines={rally:engine('rally-engine.js','GhostLap'),space:engine('periapsis-engine.js','Periapsis')};
  const db={
    all(sql,...args) { return store.prepare(sql).all(...args); },
    save(...statements) {
      store.exec('BEGIN IMMEDIATE');
      try {
        for(const [sql,...args] of statements) store.prepare(sql).run(...args);
        store.exec('COMMIT');
      } catch(error) { store.exec('ROLLBACK'); throw error; }
    }
  };
  return request=>leaderboard(request,db,engines);
}
