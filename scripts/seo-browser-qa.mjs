/** Crawl real HTTP pages with JS disabled, then inspect the rendered UI. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {pageDefinitions,resolveSeo,routePath} from './seo.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const content=JSON.parse(await fs.readFile(path.join(root,'src/content/site.json'),'utf8'));
const config=JSON.parse(await fs.readFile(path.join(root,'src/content/media.json'),'utf8'));
const seo=resolveSeo(config);
const pages=pageDefinitions(content);
const origin=(process.env.NU_QA_URL||'http://localhost:3000').replace(/\/$/,'');
const out=path.resolve(root,process.env.NU_QA_OUTPUT||'qa-output/seo');
await fs.mkdir(out,{recursive:true});
const {chromium}=await import(pathToFileURL(path.resolve(process.env.NU_QA_PLAYWRIGHT)).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.NU_QA_BROWSER_PATH});
const report={origin,checkedAt:new Date().toISOString(),noJavaScript:[],rendered:[],errors:[],visualReview:'NOT RUN'};
try {
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844},deviceScaleFactor:1});
 const page=await context.newPage();
 for(const definition of pages) {
  const route=routePath(definition.route);
  const response=await page.goto(origin+route,{waitUntil:'load'});
  assert.equal(response.status(),200,route);
  const data=await page.evaluate(()=>({
   title:document.title,description:document.querySelector('meta[name="description"]')?.content,
   canonical:document.querySelector('link[rel="canonical"]')?.href,
   robots:document.querySelector('meta[name="robots"]')?.content,
   schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)),
   links:[...document.querySelectorAll('main a[href],nav a[href]')].map(a=>({href:new URL(a.href).pathname,text:a.textContent.trim()||a.getAttribute('aria-label')})),
   headings:[...document.querySelectorAll('main h1')].map(h=>h.textContent),
   visibleText:document.querySelector('main').innerText,
   overflow:document.documentElement.scrollWidth-innerWidth,
   imageAlt:[...document.images].every(i=>i.hasAttribute('alt')),
  }));
  assert.equal(data.title,definition.title,route+' title');
  assert.equal(data.description,definition.description,route+' description');
  assert.equal(data.canonical,seo.absolute(route),route+' canonical');
  assert.equal(/noindex/.test(data.robots),seo.noindex,route+' indexing');
  assert.equal(data.schemas.length,1,route+' schema');
  assert.equal(data.headings.length,1,route+' heading');
  assert(data.overflow<=2,route+' mobile overflow');
  assert(data.imageAlt,route+' alt attributes');
  if(definition.project) assert(data.visibleText.includes(definition.project.overview),route+' service copy must be present without JavaScript');
  assert(!/noindex/i.test(response.headers()['x-robots-tag']||'') || seo.noindex,route+' unexpected HTTP noindex');
  delete data.visibleText;
  report.noJavaScript.push({route,status:response.status(),...data});
 }
 const reachable=new Set(['/']);let changed=true;
 while(changed){changed=false;for(const row of report.noJavaScript)if(reachable.has(row.route))for(const link of row.links)if(!reachable.has(link.href)){reachable.add(link.href);changed=true;}}
 assert(pages.every(p=>reachable.has(routePath(p.route))),'Orphaned page not reachable through crawlable links');
 const missing=await page.goto(origin+'/seo-qa-page-that-does-not-exist/',{waitUntil:'load'});
 assert.equal(missing.status(),404,'Unknown route must return HTTP 404');
 const robots=await context.request.get(origin+'/robots.txt');assert.equal(robots.status(),200);
 assert.match(await robots.text(),/User-agent: \*/);
 const sitemap=await context.request.get(origin+'/sitemap.xml');assert.equal(sitemap.status(),200);
 assert.equal(((await sitemap.text()).match(/<loc>/g)||[]).length,seo.noindex?0:pages.length);
 await context.close();

 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
  const p=await ctx.newPage();const requests=[];
  p.on('request',r=>requests.push(r.url()));p.on('pageerror',e=>report.errors.push(e.message));
  for(const route of ['/','/services/','/work/erp/','/work/cybersecurity/']) {
   requests.length=0;
   await p.goto(origin+route,{waitUntil:'networkidle'});
   await p.evaluate(()=>document.fonts.ready);
   assert((await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,route+' rendered overflow');
   if(route!=='/')assert(!requests.some(u=>/\/journey(?:-v2)?\.mjs/.test(u)),'Interior page downloaded unused motion runtime');
   if(route==='/'&&name==='mobile')assert(!requests.some(u=>u.endsWith('/journey-higgsfield-arrival.webp')),'Mobile fetched unused desktop poster');
   const file=`${name}-${route.replaceAll('/','-')||'home'}.png`;
   await p.screenshot({path:path.join(out,file)});
   report.rendered.push({viewport:name,route,file,requests:requests.length});
   if(route==='/services/' || route==='/work/erp/') {
    const target=p.locator(route==='/services/'?'.service-detail':'.case-copy').first();
    await target.scrollIntoViewIfNeeded();
    await p.screenshot({path:path.join(out,`${name}-${route==='/'?'home':route.split('/')[1]}-links.png`)});
   }
  }
  await ctx.close();
 }
 assert.equal(report.errors.length,0,'Browser console errors');
 console.log(`PASS: ${report.noJavaScript.length} routes crawled without JS; canonical/schema/indexing checks; no orphan pages; real HTTP 404; ${report.rendered.length} rendered views and loading checks.`);
} finally {
 await fs.writeFile(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
