import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function htmlFiles(dir){
  const output=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())output.push(...await htmlFiles(file));
    else if(entry.isFile()&&entry.name.endsWith('.html'))output.push(file);
  }
  return output;
}

const hashes=new Set();
for(const file of await htmlFiles('dist')){
  const html=await readFile(file,'utf8');
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(/\bsrc\s*=/.test(match[1]))continue;
    const digest=createHash('sha256').update(match[2]).digest('base64');
    hashes.add(`'sha256-${digest}'`);
  }
}

const scriptPolicy=["'self'",...hashes].join(' ');
const csp=[
  "default-src 'self'",
  `script-src ${scriptPolicy}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

// GitHub Pages não interpreta o formato `_headers` do Cloudflare. Emitir CSP
// também como meta para que navegadores estáticos recebam a política possível.
// `frame-ancestors` só funciona como header HTTP e foi omitido desta meta.
const metaCsp=[
  "default-src 'self'",
  `script-src ${scriptPolicy}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');
const adminHtml = await readFile('dist/admin/index.html', 'utf8');
const adminCsp = adminHtml.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/i)?.[1];
if (!adminCsp) throw new Error('Admin page is missing its Content Security Policy');

for(const file of await htmlFiles('dist')){
  const html=await readFile(file,'utf8');
  // Browsers enforce every CSP. Pages with their own policy must keep it alone.
  if(!html.includes('</head>') || /<meta\b[^>]*http-equiv="Content-Security-Policy"/i.test(html))continue;
  await writeFile(file,html.replace('</head>',`<meta http-equiv="Content-Security-Policy" content="${metaCsp}"></head>`));
}

const headers=`/*
  Content-Security-Policy: ${csp}
  Strict-Transport-Security: max-age=31536000
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/admin/*
  ! Content-Security-Policy
  Content-Security-Policy: ${adminCsp}; frame-ancestors 'none'
  Cache-Control: no-store
`;
await writeFile('dist/_headers',headers);
await writeFile('dist/.nojekyll','');
