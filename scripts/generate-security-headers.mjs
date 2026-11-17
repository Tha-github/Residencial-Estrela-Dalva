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
  Cache-Control: no-store
`;
await writeFile('dist/_headers',headers);
