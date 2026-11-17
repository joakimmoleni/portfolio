// Browser-level regression coverage for native dialogs, focus, and mobile sizing.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { once } from 'node:events';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';

async function check() {
  const report = document.getElementById('result');
  const frame = document.querySelector('iframe');
  try {
    for (const width of [320, 1024]) {
      frame.width = width;
      const loaded = new Promise(resolve => frame.onload = resolve);
      frame.src = '/index.html?size=' + width;
      await loaded;
      const doc = frame.contentDocument;
      const id = name => doc.getElementById(name);
      const assert = (value, label) => { if (!value) throw Error(width + 'px: ' + label); };
      const visible = node => node.getBoundingClientRect().width > 0 && !node.hidden;
      const task = name => doc.querySelector('.running-tasks [aria-controls="' + name + '"]');
      const item = name => doc.querySelector('.running-menu [aria-controls="' + name + '"]');
      const fits = node => {
        const r = node.getBoundingClientRect();
        return r.width > 0 && r.left >= -1 && r.right <= width + 1;
      };
      assert(visible(id('space-open')) && visible(id('rally-open')), 'both sleeves');
      assert(fits(id('space-open')) && fits(id('rally-open')), 'sleeve layout');
      assert(doc.documentElement.scrollWidth <= width + 1, 'document overflow');
      const win = frame.contentWindow;
      const queue = new Map();
      let serial = 0, now = 0;
      win.requestAnimationFrame = callback => { queue.set(++serial,callback); return serial; };
      win.cancelAnimationFrame = key => queue.delete(key);
      const advance = () => {
        const callbacks = [...queue.values()]; queue.clear(); now += 200;
        for (const callback of callbacks) callback(now);
      };
      if (width > 650) {
        const shortcut = doc.querySelector('[data-shortcut="space"]');
        assert(visible(shortcut), 'desktop ship icon');
        shortcut.click();
      } else id('space-open').click();
      assert(id('space-window').open && fits(id('space-window')), 'game window');
      const screen = id('space-screen');
      const pixels = screen.getContext('2d');
      // Match the cockpit, carrier plating and laser core separately from the stars.
      function hasColour(area, rgb) {
        const data = pixels.getImageData(...area).data;
        for (let i=0; i<data.length; i+=4) {
          if (data[i]===rgb[0] && data[i+1]===rgb[1] && data[i+2]===rgb[2]) return true;
        }
        const palette = new Map();
        for (let i=0; i<data.length; i+=4) {
          const colour = Array.from(data.subarray(i,i+4)).join(',');
          palette.set(colour,(palette.get(colour)||0)+1);
        }
        hasColour.palette = [...palette].sort((a,b)=>b[1]-a[1]).slice(0,8).map(([rgba,n])=>rgba+' x '+n).join(' / ');
        return false;
      }
      const cockpit = [115,225,236], gold = [224,161,74], beam = [228,255,243];
      const rect = screen.getBoundingClientRect();
      const elementAtShip = doc.elementFromPoint(rect.left+48/384*rect.width,rect.top+97/192*rect.height);
      assert(elementAtShip === screen && id('space-prompt').getBoundingClientRect().top >= rect.bottom, 'briefing leaves playfield visible');
      assert(hasColour([30,83,36,28],cockpit), 'player visible before launch: '+hasColour.palette);
      assert(hasColour([260,65,124,80],gold), 'first carrier visible before launch');
      id('space-go').click();
      assert(id('space-prompt').hidden && hasColour([58,88,20,17],beam), 'flight starts with a visible shot');
      screen.dispatchEvent(new win.KeyboardEvent('keydown', {key:'ArrowDown', bubbles:true}));
      advance(); advance();
      win.dispatchEvent(new win.KeyboardEvent('keyup', {key:'ArrowDown'}));
      assert(!hasColour([30,83,36,28],cockpit) && hasColour([30,111,36,24],cockpit), 'steering moves the visible ship');
      assert(hasColour([105,86,43,22],beam), 'shots travel across the playfield');
      assert(hasColour([250,65,125,80],gold), 'carrier stays visible during flight');
      id('space-window').querySelector('[data-window-minimize]').click();
      assert(!id('space-prompt').hidden && id('space-window').hidden, 'flight paused on minimize');
      assert(visible(task('space-window')), 'minimized game in taskbar');
      id('startButton').click();
      assert(visible(item('space-window')), 'minimized game in Start');
      item('space-window').click();
      assert(visible(id('space-window')) && id('space-go').textContent === 'Fortsätt', 'resume same flight');
      id('rally-open').click();
      id('rally-go').click();
      // On the opening bend the car stays on asphalt long enough to start accelerating.
      for (let i=0;i<5;i++) advance();
      assert(parseInt(id('rally-pace').textContent,10)>100, 'pace builds on asphalt');
      id('rally-window').dispatchEvent(new win.KeyboardEvent('keydown', {key:'ArrowLeft', bubbles:true}));
      advance();
      assert(id('rally-pace').textContent === '100 %', 'steering cancels pace bonus');
      win.dispatchEvent(new win.KeyboardEvent('keyup', {key:'ArrowLeft'}));
      id('rally-window').querySelector('[data-window-minimize]').click();
      task('rally-window').click();
      assert(id('rally-go').textContent === 'Fortsätt', 'restore rally');
      for (const name of ['winamp','mirc','notepad']) doc.querySelector('[data-open-extra="'+name+'"]').click();
      id('startButton').click();
      assert([...doc.querySelectorAll('.running-menu button')].filter(visible).length === 5, 'all five programs listed');
      assert(fits(id('startPanel')), 'Start fits viewport');
      item('space-window').click();
      id('space-close').click();
      await new Promise(resolve => setTimeout(resolve, 40));
      assert(!visible(task('space-window')) && item('space-window').hidden, 'closed game removed');
      task('rally-window').click();
      id('rally-go').click();
      for (let i=0;i<400 && id('rally-wallpaper').hidden;i++) advance();
      assert(!id('rally-wallpaper').hidden && id('rally-progress').textContent === '100 %', 'finish a complete lap');
      id('rally-wallpaper').click();
      assert(doc.documentElement.hasAttribute('data-rally-wallpaper'), 'apply finish frame');
      const reset = id('themeToggle').nextElementSibling;
      reset.click();
      assert(!doc.documentElement.hasAttribute('data-rally-wallpaper'), 'restore desktop background');
    }
    report.textContent = 'BROWSER PASS';
  } catch (err) { report.textContent = 'BROWSER FAIL ' + err.message; }
}
const root = new URL('../', import.meta.url);
const dir = await mkdtemp(join(root.pathname, 'arcade-check-'));
const profile = await mkdtemp(join(tmpdir(),'portfolio-browser-'));
const server = spawn(process.execPath, ['scripts/serve.mjs','--port','4179'], {cwd:root});
try {
  await Promise.race([once(server.stdout,'data'), once(server,'exit').then(()=>{throw Error('Preview server stopped');})]);
  const html = '<meta charset="utf-8"><p id="result">Pending</p><iframe style="border:0" height="720"></iframe><script>(' + check.toString() + ')()</script>';
  await writeFile(join(dir,'index.html'),html);
  const browser = spawn(process.env.CHROME_BIN || 'google-chrome', [
    '--headless','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--disable-extensions',
    '--user-data-dir='+profile,'--virtual-time-budget=15000','--dump-dom','http://127.0.0.1:4179/'+basename(dir)+'/'
  ], {stdio:['ignore','pipe','inherit']});
  let output='';
  browser.stdout.on('data',chunk=>output+=chunk);
  const [code]=await once(browser,'close');
  const result=output.match(/<p id="result">([^<]+)<\/p>/)?.[1];
  if(code || result!=='BROWSER PASS') throw Error(result || 'Chrome did not report a browser result');
  console.log('Chrome passed game launch, pause, restore, close and layout checks at 320 and 1024 px.');
} finally {
  server.kill();
  await Promise.all([rm(dir,{force:true,recursive:true}),rm(profile,{force:true,recursive:true})]);
}
