import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const base = '/' + (process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '');
const prefix = base === '/' ? '' : base;
const errors=[];
async function walk(dir) {
  const results=[];
  for (const ent of await fs.readdir(dir,{withFileTypes:true})) {
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())results.push(...await walk(p));else results.push(p);
  }
  return results;
}
const files=await walk(dist);
const htmlFiles=files.filter(f=>f.endsWith('.html'));
for(const file of htmlFiles) {
  const source=await fs.readFile(file,'utf8');
  const label=path.relative(dist,file);
  if((source.match(/<h1(?:\s|>)/g)||[]).length!==1)errors.push(`${label}: expected one h1`);
  if(!source.includes('id="main"'))errors.push(`${label}: missing main landmark target`);
  const ids=[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(new Set(ids).size!==ids.length)errors.push(`${label}: duplicate IDs`);
  for(const match of source.matchAll(/<(img)\b([^>]+)>/g)) {
    if(!/\balt="/.test(match[2]))errors.push(`${label}: image lacks alt`);
    if(!/\bwidth="\d+"/.test(match[2])||!/\bheight="\d+"/.test(match[2]))errors.push(`${label}: image lacks dimensions`);
  }
  for(const match of source.matchAll(/\b(?:href|src|data-src)="([^"]+)"/g)) {
    let target=match[1].replaceAll('&amp;','&');
    if(/^(https?:|mailto:|tel:|data:|blob:)/.test(target))continue;
    const [pathname,hash]=target.split('#');
    let local;
    if(!pathname)local=file;
    else if(pathname.startsWith('/')) {
      if(prefix && !(pathname===prefix||pathname.startsWith(prefix+'/'))) {
        errors.push(`${label}: path escapes deployment base: ${target}`);continue;
      }
      local=path.join(dist,pathname.slice(prefix.length));
    } else local=path.resolve(path.dirname(file),pathname);
    try {
      if((await fs.stat(local)).isDirectory())local=path.join(local,'index.html');
      await fs.access(local);
      if(hash&&local.endsWith('.html')) {
        const destination=local===file?source:await fs.readFile(local,'utf8');
        if(!destination.includes(`id="${decodeURIComponent(hash)}"`))errors.push(`${label}: missing fragment ${target}`);
      }
    }catch{errors.push(`${label}: missing local resource ${target}`);}
  }
}
for(const file of files.filter(f=>f.endsWith('.css'))) {
  const source=await fs.readFile(file,'utf8');
  for(const m of source.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    if(m[1].startsWith('data:'))continue;
    try{await fs.access(path.resolve(path.dirname(file),m[1]));}catch{errors.push(`CSS resource missing: ${m[1]}`);}
  }
}
const manifest=JSON.parse(await fs.readFile(path.join(root,'src/content/media.json'),'utf8'));
if(process.argv.includes('--release')) {
  for(const field of ['video','poster','mobilePoster'])if(!manifest.journey[field])errors.push(`Release gate: journey.${field} has not been delivered`);
  if(manifest.journey.status!=='verified')errors.push('Release gate: actual temporal, responsive and reduced-motion QA remains required');
  if(!manifest.contact.endpoint&&!manifest.contact.email)errors.push('Release gate: real enquiry delivery/contact destination has not been configured');
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log(`PASS: ${htmlFiles.length} HTML routes, local links/fragments, image markup, CSS resources and deployment base.`);
if(manifest.journey.status!=='verified')console.log(`Media status: ${manifest.journey.status}. This check does not certify runtime or appearance.`);
