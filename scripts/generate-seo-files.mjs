import { mkdir, readFile, writeFile } from 'node:fs/promises';

const mode=process.env.PUBLIC_DEPLOY_ENV || 'development';
const output='dist';
await mkdir(output,{recursive:true});

if(mode!=='production'){
  await writeFile(`${output}/robots.txt`,'User-agent: *\nDisallow: /\n');
  await import('node:fs/promises').then(({rm})=>rm(`${output}/sitemap.xml`,{force:true}));
  process.exit(0);
}

let site;
try{site=new URL(process.env.PUBLIC_SITE_URL || '')}catch{throw new Error('PUBLIC_SITE_URL deve ser uma URL HTTPS do domínio definitivo.')}
if(site.protocol!=='https:'||site.username||site.password||site.pathname!=='/'||site.search||site.hash)throw new Error('PUBLIC_SITE_URL deve conter somente a origem HTTPS, sem caminho, credenciais ou parâmetros.');
const root=site.origin+'/';
const content=JSON.parse(await readFile('src/data/residencial.json','utf8'));
const jsonLd=JSON.stringify({'@context':'https://schema.org','@type':'LodgingBusiness','@id':`${root}#lodging`,name:content.name,url:root}).replace(/</g,'\\u003c');
const indexPath=`${output}/index.html`;
const html=await readFile(indexPath,'utf8');
if(!html.includes('</head>'))throw new Error('Não foi possível inserir os dados estruturados no HTML da página inicial.');
await writeFile(indexPath,html.replace('</head>',`<script type="application/ld+json">${jsonLd}</script></head>`));
const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${root}</loc></url>\n</urlset>\n`;
await writeFile(`${output}/sitemap.xml`,xml);
await writeFile(`${output}/robots.txt`,`User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`);
