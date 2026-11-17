// Prepare a standalone Sites checkout using the very same engines as the browser.
import { mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs';
import { resolve, join } from 'node:path';

if (!process.argv[2]) throw Error('Pass the scoreboard service checkout directory.');
const target=resolve(process.argv[2]);
const read=file=>readFileSync(new URL(file,import.meta.url),'utf8');
const write=(file,content)=>writeFileSync(join(target,file),content);
for (const folder of ['worker','scripts','.openai','dist/server','dist/.openai']) mkdirSync(join(target,folder),{recursive:true});
const worker=[
  read('../assets/js/rally-engine.js'),
  read('../assets/js/periapsis-engine.js'),
  read('leaderboard.mjs'),
  read('worker.mjs').replace("import { leaderboard } from './leaderboard.mjs';",'')
].join('\n');
const hosting=JSON.stringify({project_id:'appgprj_6afcb7e93fe88191b56b92f37b7d8fc7',d1:'DB',r2:null},null,2)+'\n';
write('.openai/hosting.json',hosting);
write('worker/index.js',worker);
write('package.json',JSON.stringify({private:true,type:'module',scripts:{build:'node scripts/build.mjs'}},null,2)+'\n');
write('scripts/build.mjs',`import { mkdirSync,copyFileSync } from 'node:fs';
for(const dir of ['dist/server','dist/.openai']) mkdirSync(dir,{recursive:true});
copyFileSync('worker/index.js','dist/server/index.js');
copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
`);
write('.gitignore','dist/\n');
cpSync(new URL('drizzle',import.meta.url),join(target,'drizzle'),{recursive:true});
write('dist/server/index.js',worker);
write('dist/.openai/hosting.json',hosting);
