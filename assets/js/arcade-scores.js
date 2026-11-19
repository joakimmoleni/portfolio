// The server replays compact runs of identical controls before it accepts a result.
const ArcadeScores = (() => {
  'use strict';
  const hosted = location.protocol==='file:' || location.hostname==='portfolio.moleni.se' || location.hostname.endsWith('.github.io');
  const api = hosted ? 'https://moleni-arkad.jcrooge.workers.dev/api/scores/' : '/api/scores/';
  function runId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes=crypto.getRandomValues(new Uint8Array(16));
    bytes[6]=bytes[6]&15|64; bytes[8]=bytes[8]&63|128;
    const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
  }
  function append(steps,x,y) {
    const last = steps[steps.length-1];
    if(last && last[1]===x && last[2]===y) last[0]++;
    else steps.push([1,x,y]);
  }
  const errors = new Map([
    ['Välj andra initialer.', 'Choose different initials.'],
    ['Använd tre bokstäver, A–Ö.', 'Enter three letters (A–Z, Å, Ä or Ö).'],
    ['Resultatet kunde inte verifieras.', 'Your score could not be verified.'],
    ['För lång inspelning.', 'This replay is too long.'],
    ['Inspelning saknas.', 'Missing replay.'],
    ['Ogiltig inspelning.', 'Invalid replay.'],
    ['Ogiltig omgång.', 'Invalid run.'],
    ['JSON krävs.', 'The score service requires JSON.'],
    ['Ogiltig metod.', 'Unsupported request.'],
    ['Okänd topplista.', 'Unknown leaderboard.']
  ]);
  function mount(panel,game,format) {
    const form=panel.querySelector('form'), input=form.querySelector('input');
    const list=panel.querySelector('ol'), status=panel.querySelector('[role="status"]');
    const refresh=panel.querySelector('[data-refresh]'), submit=form.querySelector('button');
    let pending=null, loading=0, saving=false;
    let currentEntries = [];
    const message = (sv, en) => PortfolioLanguage.text(status, sv, en);
    function render(entries) {
      currentEntries = entries;
      list.replaceChildren();
      for(const entry of entries) {
        const row=document.createElement('li');
        const label=document.createElement('strong'), score=document.createElement('span');
        label.textContent=entry.name; score.textContent=format(entry.value);
        row.append(label,score); list.append(row);
      }
    }
    window.addEventListener('portfolio-language', () => render(currentEntries));
    async function load() {
      if(saving) return;
      const seq=++loading;
      message('Hämtar topplistan…', 'Loading scores…');
      try {
        const response=await fetch(api+game,{signal:AbortSignal.timeout(7000)});
        if(!response.ok) throw Error();
        const {entries}=await response.json();
        if(seq!==loading) return;
        render(entries);
        message(entries.length ? '' : 'Inga resultat ännu.', entries.length ? '' : 'No scores yet.');
      } catch {
        if(seq===loading) message('Topplistan går inte att nå just nu.', 'The leaderboard is unavailable right now.');
      }
    }
    panel.addEventListener('toggle',()=>{ if(panel.open && !panel.hidden) load(); });
    refresh.addEventListener('click',load);
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(!pending || saving || !form.reportValidity()) return;
      const run=pending;
      loading++; saving=true; submit.disabled=true;
      message('Sparar resultatet…', 'Saving your score…');
      try {
        const response=await fetch(api+game,{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({...run,name:input.value.trim().toUpperCase()}),signal:AbortSignal.timeout(12000)});
        const data=await response.json();
        if(run!==pending) return;
        if (!response.ok) {
          message(data.error || 'Resultatet gick inte att spara.', errors.get(data.error) || 'Couldn’t save your score.');
          return;
        }
        pending=null; form.hidden=true;
        render(data.entries);
        const rank=data.entries.findIndex(entry=>entry.id===run.id || (entry.name===input.value.trim().toUpperCase() && entry.value===run.value));
        if (rank < 0) message('Resultatet nådde inte topp tio.', 'Your score missed the top ten.');
        else message('Plats ' + (rank + 1) + ' på topplistan.', 'Ranked ' + (rank + 1) + ' on the leaderboard.');
      } catch {
        if(run===pending) message('Kunde inte spara. Försök igen.', 'Couldn’t save your score. Try again.');
      } finally { saving=false; submit.disabled=false; }
    });
    return {
      visible(show) { panel.hidden=!show; },
      start() { pending=null; form.hidden=true; panel.open=false; panel.hidden=true; loading++; },
      finish(value,steps) {
        pending={id:runId(),value,steps};
        form.hidden=false; panel.hidden=false;
        if(panel.open) load(); else panel.open=true;
      }
    };
  }
  return {append,mount};
})();
