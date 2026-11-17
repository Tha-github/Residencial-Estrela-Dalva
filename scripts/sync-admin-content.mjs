import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

if (process.env.CF_SYNC_CONTENT !== '1') process.exit(0);
const db = process.env.CF_D1_DATABASE;
if (!db || !process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) throw new Error('CF_D1_DATABASE, CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID são necessários para sincronizar o conteúdo publicado.');
const run = (...args) => execFileSync('npx', ['--yes', 'wrangler@4.164.0', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], env: process.env });
const result = JSON.parse(run('d1','execute',db,'--remote','--json','--command',"SELECT body FROM content WHERE id='estrela-dalva'"));
const body = JSON.parse(result[0].results[0].results[0].body);
const files = [body.hero.image,...body.gallery].filter(Boolean);
await mkdir('src/assets/fotos',{recursive:true});
for (const item of files) {
  const match = /^\/api\/media\/([0-9a-f-]{36}\.(?:jpg|png|webp))$/.exec(item.src);
  if (!match) continue;
  const filename = match[1];
  const bytes = execFileSync('npx', ['--yes','wrangler@4.164.0','r2','object','get',`${process.env.CF_R2_BUCKET}/${filename}`,'--remote','--pipe'], { env: process.env, stdio:['ignore','pipe','inherit'] });
  const local = path.join('src/assets/fotos',filename);
  await writeFile(local,bytes);
  item.src = `/fotos/${filename}`;
}
await writeFile('src/data/residencial.json',`${JSON.stringify(body,null,2)}\n`);
