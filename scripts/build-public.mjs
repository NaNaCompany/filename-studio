import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {completeTracking} from './publisher-tracking.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cfg=JSON.parse(fs.readFileSync(path.join(root,'APP_PUBLIC.json'),'utf8'));
const src=path.join(root,'dist'), out=path.join(root,'docs');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
fs.mkdirSync(out,{recursive:true});
fs.cpSync(src,out,{recursive:true,filter:p=>!p.split(path.sep).includes('.openai')});
fs.cpSync(path.join(root,'public-assets'),out,{recursive:true});
const appJs=path.join(out,'app.js');
if(cfg.slug==='nocturne-library'){
 let js=fs.readFileSync(appJs,'utf8');
 js=js.replace("history.pushState({reader:id},'',`#read/${id}`)","history.pushState({reader:id},'',location.pathname+location.search+`#read/${id}`)");
 fs.writeFileSync(appJs,js);
}
const links=cfg.languages.map(l=>`<link rel="alternate" hreflang="${l}" href="${cfg.url+(l==='ko'?'':l+'/')}">`).join('\n')+`\n<link rel="alternate" hreflang="x-default" href="${cfg.url}">`;
for(const lang of cfg.languages){
 const file=path.join(out,lang==='ko'?'index.html':lang+'/index.html');
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<meta\b[^>]*\bname=["']robots["'][^>]*>/gi,'');
 html=html.replace(/<link\b[^>]*\brel=["'](?:canonical|alternate)["'][^>]*>/gi,'');
 html=html.replace(/<meta\b[^>]*(?:\bname=["'](?:description|twitter:[^"']+)["']|\bproperty=["']og:[^"']+["'])[^>]*>/gi,'');
 const text=cfg.locales[lang], url=cfg.url+(lang==='ko'?'':lang+'/');
 html=html.replace(/<title>[^]*?<\/title>/i,'<title>'+esc(text.name)+' · NaNa Lab</title>');
 const meta=`\n<meta name="robots" content="index,follow">\n<meta name="description" content="${esc(text.description)}">\n<link rel="canonical" href="${url}">\n${links}\n<meta property="og:type" content="website">\n<meta property="og:url" content="${url}">\n<meta property="og:title" content="${esc(text.name)}">\n<meta property="og:description" content="${esc(text.description)}">\n<meta property="og:image" content="${cfg.url}og/${lang}.jpg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${esc(text.name)}">\n<meta name="twitter:description" content="${esc(text.description)}">\n<meta name="twitter:image" content="${cfg.url}og/${lang}.jpg">\n<link rel="stylesheet" href="public.css">\n`;
 const adjustedMeta=meta.replace('href="public.css"','href="'+(lang!=='ko'&&!/<base\b/i.test(html)?'../':'')+'public.css"');
 html=html.replace(/<\/head>/i,adjustedMeta+'</head>');
 html=completeTracking(html);
 fs.writeFileSync(file,html.trimEnd()+'\n');
}
fs.writeFileSync(path.join(out,'public.css'),'a[href="https://nanalab.kr/apps/"]{position:fixed!important;right:14px!important;bottom:12px!important;z-index:30!important;color:#888!important;font:11px/1.4 system-ui,sans-serif!important;letter-spacing:0!important;text-decoration:none!important;background:none!important;border:0!important;padding:3px!important;box-shadow:none!important}a[href="https://nanalab.kr/apps/"]:focus-visible{outline:2px solid #888;outline-offset:3px}@media print{a[href="https://nanalab.kr/apps/"]{display:none!important}}\n');
fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+cfg.languages.map(l=>'<url><loc>'+cfg.url+(l==='ko'?'':l+'/')+'</loc></url>').join('\n')+'\n</urlset>\n');
fs.writeFileSync(path.join(out,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+cfg.url+'sitemap.xml\n');
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log(JSON.stringify({slug:cfg.slug,languages:cfg.languages.length,output:'docs'}));
