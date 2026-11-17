// Both deployments use the same SQL, ranking and replay validation.
const blocked = new Set('ASS CUM FAG FIT FAN FCK FUK FUX HOR KKK KUK KYS NAZ NGR NIG PIK PIS PUS RÖV SEX TIT WTF XXX'.split(' '));
const limit = 10;
export function replay(game, steps, engines) {
  const driving = game === 'rally';
  const state = driving ? engines.rally.newLap() : engines.space.flight();
  const maxTicks = driving ? 6000 : 18000;
  let ticks = 0;
  if (!Array.isArray(steps) || !steps.length || steps.length>maxTicks) return null;
  for (const run of steps) {
    if (!Array.isArray(run) || run.length!==3 || !run.every(Number.isSafeInteger)) return null;
    const [count,x,y] = run;
    ticks += count;
    if (count<1 || ticks>maxTicks) return null;
    if (driving ? Math.abs(x)>1 || y<0 || y>7 : Math.abs(x)>127 || Math.abs(y)>127) return null;
    for (let i=0;i<count;i++) {
      if (driving) {
        if (state.distance>=engines.rally.length) return null;
        engines.rally.drive(state,x,y);
      } else {
        if (state.result) return null;
        engines.space.step(state,x/127,y/127);
      }
    }
  }
  if (driving) return state.distance===engines.rally.length ? state.ticks : null;
  return state.result ? state.score : null;
}

export async function leaderboard(request, db, engines) {
  const url = new URL(request.url);
  const game = url.pathname.match(/^\/api\/scores\/(space|rally)$/)?.[1];
  const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store'};
  const reply = (body,status=200) => Response.json(body,{status,headers});
  if (!game) return reply({error:'Okänd topplista.'},404);
  if (request.method==='OPTIONS') return new Response(null,{status:204,headers});
  const order = game==='rally' ? 'ASC' : 'DESC';
  const ranking = 'SELECT id, name, value FROM scores WHERE game=? ORDER BY value '+order+', created ASC, id ASC LIMIT '+limit;
  if (request.method==='GET') return reply({entries:await db.all(ranking,game)});
  if (request.method!=='POST') return reply({error:'Ogiltig metod.'},405);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({error:'JSON krävs.'},415);
  const maxBytes = 240000;
  if (Number(request.headers.get('content-length'))>maxBytes) return reply({error:'För lång inspelning.'},413);
  const reader = request.body?.getReader();
  if (!reader) return reply({error:'Inspelning saknas.'},400);
  const decoder = new TextDecoder();
  let bytes=0, body='';
  for (;;) {
    const chunk=await reader.read();
    if (chunk.done) break;
    bytes+=chunk.value.length;
    if (bytes>maxBytes) { await reader.cancel(); return reply({error:'För lång inspelning.'},413); }
    body+=decoder.decode(chunk.value,{stream:true});
  }
  let data;
  try { data=JSON.parse(body+decoder.decode()); } catch { return reply({error:'Ogiltig inspelning.'},400); }
  if (!data || typeof data.name!=='string' || !/^[A-Za-zÅÄÖåäö]{3}$/.test(data.name) || data.name.length!==3) return reply({error:'Använd tre bokstäver, A–Ö.'},400);
  const name=data.name.toLocaleUpperCase('sv-SE');
  if (!/^[A-ZÅÄÖ]{3}$/.test(name) || blocked.has(name)) return reply({error:'Välj andra initialer.'},400);
  if (typeof data.id!=='string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(data.id)) return reply({error:'Ogiltig omgång.'},400);
  const value=replay(game,data.steps,engines);
  if (value===null || value!==data.value) return reply({error:'Resultatet kunde inte verifieras.'},422);
  await db.save(
    ['INSERT INTO scores(id,game,name,value,created) VALUES(?,?,?,?,?) ON CONFLICT DO NOTHING',data.id,game,name,value,Date.now()],
    ['DELETE FROM scores WHERE game=? AND id NOT IN (SELECT id FROM scores WHERE game=? ORDER BY value '+order+', created ASC, id ASC LIMIT '+limit+')',game,game]);
  return reply({entries:await db.all(ranking,game)});
}
