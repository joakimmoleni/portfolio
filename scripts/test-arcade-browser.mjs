// Browser-level regression coverage for native dialogs, focus, and mobile sizing.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';

async function check() {
  const report = document.getElementById('result');
  const frame = document.querySelector('iframe');
  try {
    for (const width of [320, 1024]) {
      frame.width = width;
      const loaded = new Promise(resolve => frame.onload = resolve);
      frame.src = '/index.html?lang=sv&size=' + width;
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
        return false;
      }
      const cockpit = [115,225,236], gold = [224,161,74], beam = [228,255,243];
      const rect = screen.getBoundingClientRect();
      const elementAtShip = doc.elementFromPoint(rect.left+48/384*rect.width,rect.top+97/192*rect.height);
      assert(elementAtShip === screen && id('space-prompt').getBoundingClientRect().top >= rect.bottom, 'briefing leaves playfield visible');
      assert(pixels.getTransform().isIdentity, 'formation rendering restores canvas coordinates');
      assert(hasColour([30,83,36,28],cockpit), 'player visible before launch');
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
      const closed = new Promise(resolve => id('space-window').addEventListener('close', resolve, {once: true}));
      id('space-close').click();
      await closed;
      assert(!visible(task('space-window')) && item('space-window').hidden, 'closed game removed');
      task('rally-window').click();
      id('rally-go').click();
      for (let i=0;i<400 && id('rally-wallpaper').hidden;i++) advance();
      assert(!id('rally-wallpaper').hidden && id('rally-progress').textContent === '100 %', 'finish a complete lap');
      const board=id('rally-scores'), initials=id('rally-initials');
      assert(board.open && fits(initials), 'initials fit after finishing');
      initials.value=width===320?'PIX':'ÅKE';
      const form=board.querySelector('form');
      form.requestSubmit();
      for(let i=0;i<80 && !form.hidden;i++) await new Promise(resolve=>setTimeout(resolve,50));
      assert(form.hidden && board.querySelector('ol').textContent.includes(initials.value),'shared score accepted');
      if(width===1024) assert(board.querySelector('ol').textContent.includes('PIX'),'another player remains on the board');
      id('rally-wallpaper').click();
      assert(doc.documentElement.hasAttribute('data-rally-wallpaper'), 'apply finish frame');
      const reset = id('themeToggle').nextElementSibling;
      reset.click();
      assert(!doc.documentElement.hasAttribute('data-rally-wallpaper'), 'restore desktop background');
    }
    for (const width of [320, 390, 1024]) {
      frame.width = width;
      async function open(path) {
        const ready = new Promise(resolve => { frame.onload = resolve; });
        frame.src = path;
        await ready;
        return frame.contentDocument;
      }
      function checkLanguage(doc, lang) {
        const control = doc.querySelector('[data-lang="' + lang + '"]');
        const rect = control.getBoundingClientRect();
        if (doc.documentElement.lang !== lang || control.getAttribute('aria-pressed') !== 'true' ||
            rect.width < 24 || rect.left < 0 || rect.right > width || doc.documentElement.scrollWidth > width + 1) {
          throw Error(width + 'px: language switch on ' + doc.location.pathname);
        }
      }
      function checkShortcuts(doc, lang) {
        const rail = doc.querySelector('.desktop-shortcuts');
        if (rail.children.length !== 7) throw Error('Incomplete desktop on ' + doc.location.pathname);
        const links = {};
        for (const game of ['space', 'rally']) {
          const icon = rail.querySelector('[data-shortcut="' + game + '"]');
          const menu = [...doc.querySelectorAll('[data-extras-menu] a, [data-extras-menu] button')]
            .find(link => link.textContent === icon.textContent);
          const onHome = !!doc.getElementById(game + '-open');
          if (!menu || icon.hidden || menu.hidden || !!icon.getClientRects().length !== (width > 650)) {
            throw Error('Missing launcher: ' + game + ' on ' + doc.location.pathname);
          }
          for (const link of [icon, menu]) {
            if (onHome) {
              if (link.getAttribute('aria-controls') !== game + '-window') throw Error('Wrong game button');
            } else {
              const url = new URL(link.href);
              if (!url.pathname.endsWith('/index.html') || url.searchParams.get('spel') !== game ||
                  url.searchParams.get('lang') !== lang) throw Error('Wrong game link: ' + url);
            }
          }
          links[game] = width > 650 ? icon : menu;
        }
        return links;
      }
      for (const [path, heading] of [
        ['about.html?lang=en#tekniken', 'How I think'],
        ['projects.html?lang=en#fragsheet', 'Fragsheet'],
        ['contact.html?lang=en#kontakt', 'Contact']
      ]) {
        const doc = await open('/' + path);
        const panel = doc.querySelector('[data-world-panel]:not([hidden])');
        if (!panel || panel.querySelector('h2').textContent !== heading) throw Error('Wrong English panel: ' + path);
        checkLanguage(doc, 'en');
        for (const lang of ['sv', 'en']) {
          doc.querySelector('[data-lang="' + lang + '"]').click();
          checkLanguage(doc, lang);
          checkShortcuts(doc, lang);
          if (panel.hidden || doc.location.hash !== '#' + panel.id) throw Error('Language lost the current panel');
        }
      }
      const projectLink = frame.contentDocument.querySelector('a[href*="projects.html"]');
      if (!projectLink || new URL(projectLink.href).searchParams.get('lang') !== 'en') throw Error('Navigation lost English');
      const cv = await open('/resume.html?focus=mainframe-dev&panel=work&lang=en#job-seb');
      const until = Date.now() + 2000;
      while (cv.querySelector('#resumeContent').getAttribute('aria-busy') === 'true' && Date.now() < until) {
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      checkLanguage(cv, 'en');
      cv.querySelector('[data-lang="sv"]').click();
      checkLanguage(cv, 'sv');
      if (cv.location.hash !== '#job-seb' || !cv.location.search.includes('panel=work')) throw Error('CV lost its place');
      const links = checkShortcuts(cv, 'sv');
      const game = width === 320 ? 'rally' : 'space';
      if (width <= 650) {
        cv.getElementById('startButton').click();
        const programs = cv.querySelector('.start-extras summary');
        programs.focus();
        programs.dispatchEvent(new frame.contentWindow.KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}));
        if (cv.activeElement !== links.rally) throw Error('Program menu skipped the first game');
      }
      if (!links[game].getClientRects().length) throw Error('Game launcher is unreachable');
      const navigated = new Promise(resolve => { frame.onload = resolve; });
      links[game].click();
      await navigated;
      const landing = frame.contentDocument;
      const dialog = landing.getElementById(game + '-window');
      if (!dialog.open || landing.documentElement.lang !== 'sv') throw Error('Cross-page game launch failed');
      const closed = new Promise(resolve => dialog.addEventListener('close', resolve, {once: true}));
      landing.getElementById(game + '-close').click();
      await closed;
      if (new URL(landing.location.href).searchParams.has('spel')) throw Error('Closed game still in URL');
      const refreshed = await open(landing.location.href);
      if (refreshed.querySelector('.rally-window[open]')) throw Error('Closed game reopened on refresh');
      checkLanguage(refreshed, 'sv');
      const home = await open('/index.html?lang=en');
      const homeLinks = checkShortcuts(home, 'en');
      if (width <= 650) {
        home.getElementById('startButton').click();
        home.querySelector('.start-extras summary').click();
      }
      homeLinks.rally.click();
      const finished = new Promise(resolve => home.getElementById('rally-window').addEventListener('close', resolve, {once:true}));
      home.getElementById('rally-close').click();
      await finished;
      if (home.activeElement !== (width > 650 ? homeLinks.rally : home.getElementById('startButton'))) {
        throw Error('Closing the game lost keyboard focus');
      }
      const id = name => home.getElementById(name);
      id('space-open').click();
      id('space-go').click();
      id('space-pause').click();
      id('langSvBtn').click();
      id('langEnBtn').click();
      if (id('space-heading').textContent !== 'Paused' || id('space-go').textContent !== 'Resume') throw Error('Paused flight lost its state');
      id('space-close').click();
      home.querySelector('[data-open-extra="notepad"]').click();
      const note = id('extras-notepad-text');
      note.value = 'Svenska and English';
      id('langSvBtn').click();
      id('langEnBtn').click();
      if (note.value !== 'Svenska and English' || !id('extras-notepad-title').textContent.includes('Notepad')) throw Error('Notepad lost its text or label');
      const recovery = await open('/missing-page?lang=en');
      if (recovery.querySelector('h1').textContent !== 'Page not found') throw Error('Untranslated recovery page');
      checkLanguage(recovery, 'en');
    }
    report.textContent = 'BROWSER PASS';
  } catch (err) { report.textContent = 'BROWSER FAIL ' + err.message; }
  console.log('PORTFOLIO_TEST_RESULT ' + report.textContent);
}
const root = new URL('../', import.meta.url);
const dir = await mkdtemp(join(root.pathname, 'arcade-check-'));
const profile = await mkdtemp(join(tmpdir(),'portfolio-browser-'));
const server = spawn(process.execPath, ['scripts/serve.mjs','--port','4179'], {cwd:root,env:{...process.env,ARCADE_SCORE_DB:':memory:'}});
let browser, timeout;
try {
  await Promise.race([once(server.stdout,'data'), once(server,'exit').then(()=>{throw Error('Preview server stopped');})]);
  const html = '<meta charset="utf-8"><p id="result">Pending</p><iframe style="border:0" height="720"></iframe><script>(' + check.toString() + ')()</script>';
  await writeFile(join(dir,'index.html'),html);
  browser = spawn(process.env.CHROME_BIN || 'google-chrome', [
    '--headless','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--disable-extensions',
    '--enable-logging=stderr','--user-data-dir='+profile,'http://127.0.0.1:4179/'+basename(dir)+'/'
  ], {stdio:['ignore','ignore','pipe']});
  // Native dialog events and cross-document navigation need actual frames.
  // Wait for the page to finish, independently of Chrome's virtual clock.
  const lines = createInterface({input: browser.stderr});
  const result = await Promise.race([
    new Promise(resolve => lines.on('line', line => {
      const match = line.match(/"PORTFOLIO_TEST_RESULT (BROWSER (?:PASS|FAIL)[^"]*)"/);
      if (match) resolve(match[1]);
    })),
    once(browser, 'exit').then(([code]) => { throw Error('Chrome exited before reporting: ' + code); }),
    new Promise((_, reject) => { timeout = setTimeout(() => reject(Error('Browser checks timed out')), 90000); })
  ]);
  if (result !== 'BROWSER PASS') throw Error(result);
  console.log('Chrome passed desktop, arcade, keyboard and language checks at 320, 390 and 1024 px.');
} finally {
  clearTimeout(timeout);
  if (browser?.pid && browser.exitCode === null && browser.signalCode === null) {
    const stopped = once(browser, 'exit');
    browser.kill();
    await stopped;
  }
  server.kill();
  await Promise.all([rm(dir,{force:true,recursive:true}),rm(profile,{force:true,recursive:true})]);
}
