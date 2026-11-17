import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdir } from 'node:fs/promises';

const mode=process.env.PUBLIC_DEPLOY_ENV || 'development';
const html=await readFile('dist/index.html','utf8');
const robots=await readFile('dist/robots.txt','utf8');
const headers=await readFile('dist/_headers','utf8');
const count=(pattern)=>(html.match(pattern)||[]).length;
assert.equal(count(/<h1\b/g),1,'Home must contain exactly one H1');
assert.match(html,/<title>[^<]+<\/title>/,'Home title is missing');
assert.match(html,/<meta name="description" content="[^"]+">/,'Meta description is missing');
assert.ok(html.indexOf('<h1') < html.indexOf('<h2'),'Heading order must start at H1');
await access('dist/favicon.svg');
await access('dist/og-residencial.png');
for(const header of ['Content-Security-Policy:','Strict-Transport-Security: max-age=31536000','X-Content-Type-Options: nosniff','Referrer-Policy: strict-origin-when-cross-origin','X-Frame-Options: DENY'])assert.ok(headers.includes(header),`Security header missing: ${header}`);
const scriptPolicy=headers.match(/script-src ([^;\r\n]+)/)?.[1]||'';
async function verifyScriptHashes(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const file=`${dir}/${entry.name}`;
    if(entry.isDirectory())await verifyScriptHashes(file);
    else if(entry.name.endsWith('.html')){
      const page=await readFile(file,'utf8');
      for(const match of page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
        if(/\bsrc\s*=/.test(match[1]))continue;
        const digest=createHash('sha256').update(match[2]).digest('base64');
        assert.ok(scriptPolicy.includes(`'sha256-${digest}'`),`Inline script hash missing from CSP for ${file}`);
      }
    }
  }
}
await verifyScriptHashes('dist');

if(mode==='production'){
  const site=new URL(process.env.PUBLIC_SITE_URL);
  const root=site.origin+'/';
  assert.ok(html.includes(`<link rel="canonical" href="${root}">`),'Canonical must match production origin');
  assert.ok(!/name="robots" content="noindex/.test(html),'Production page must not be noindex');
  for(const tag of ['og:title','og:description','og:url','og:image','twitter:card'])assert.ok(html.includes(`property="${tag}"`)||html.includes(`name="${tag}"`),`Missing social metadata: ${tag}`);
  const jsonLd=html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
  assert.ok(jsonLd,'Production JSON-LD is missing');
  const entity=JSON.parse(jsonLd[1]);
  assert.equal(entity['@type'],'LodgingBusiness');
  assert.equal(entity.url,root);
  assert.match(robots,/^User-agent: \*\nAllow: \/\nSitemap: /);
  const sitemap=await readFile('dist/sitemap.xml','utf8');
  assert.ok(sitemap.includes(`<loc>${root}</loc>`),'Sitemap must contain production homepage');
}else{
  assert.match(html,/<meta name="robots" content="noindex, nofollow">/,'Preview must be noindex');
  assert.equal(robots,'User-agent: *\nDisallow: /\n');
  await assert.rejects(access('dist/sitemap.xml'),'Preview must not expose a sitemap');
  assert.ok(!html.includes('rel="canonical"'),'Preview must not advertise a canonical URL');
}
console.log(`SEO artifact checks passed for ${mode}.`);
