import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {resolveSeo,pageDefinitions,renderSeoHead,structuredData,renderSitemap,renderRobots,jsonForHtml} from '../scripts/seo.mjs';

const content=JSON.parse(await fs.readFile(new URL('../src/content/site.json',import.meta.url),'utf8'));
const pages=pageDefinitions(content);
const config={siteUrl:'https://www.nulabs.co.za'};
const production=resolveSeo(config,{VERCEL_ENV:'production'});

test('canonical origin comes from verified config, never Vercel preview or shortest-domain aliases',()=>{
  const seo=resolveSeo(config,{VERCEL_URL:'random.vercel.app',VERCEL_PROJECT_PRODUCTION_URL:'nulabs.co.za'});
  assert.equal(seo.absolute('/work/erp/'),'https://www.nulabs.co.za/work/erp/');
  assert.equal(resolveSeo(config,{SITE_URL:'https://new.example.com/'}).origin,'https://new.example.com');
});
test('reject malformed or unsafe canonical origins before publication',()=>{
  for(const siteUrl of ['http://www.nulabs.co.za','https://u:p@example.com','https://example.com/path','https://example.com?q=x','https://example.com/#x','https://localhost','javascript:alert(1)','https://example.com:3000']) {
    assert.throws(()=>resolveSeo({siteUrl},{}),/SITE_URL/);
  }
});
test('preview and custom environments cannot override noindex with SEO_NOINDEX=0',()=>{
  for(const env of [{VERCEL_ENV:'preview'},{VERCEL_ENV:'development'},{VERCEL_ENV:'production',VERCEL_TARGET_ENV:'staging'}]) {
    const seo=resolveSeo(config,{...env,SEO_NOINDEX:'0'});
    assert.equal(seo.noindex,true);
    assert.match(renderSeoHead(pages[0],content,seo),/content="noindex, follow"/);
    assert.match(renderSeoHead(pages[0],content,seo),/rel="canonical" href="https:\/\/www.nulabs.co.za\/"/);
    assert.doesNotMatch(renderSitemap(pages,seo),/<loc>/);
    assert.doesNotMatch(renderRobots(seo),/Disallow|Sitemap:/);
  }
});
test('production permits indexing, while an explicit hold or missing origin does not',()=>{
  assert.equal(production.noindex,false);
  assert.equal(resolveSeo(config,{SEO_NOINDEX:'1'}).noindex,true);
  assert.equal(resolveSeo({},{}).noindex,true);
  assert.doesNotMatch(renderSeoHead(pages[0],content,resolveSeo({},{})),/rel="canonical"/);
  assert.throws(()=>resolveSeo(config,{SEO_NOINDEX:'yes'}),/SEO_NOINDEX/);
});
test('base path is applied once to canonicals, sitemap and social URLs',()=>{
  const seo=resolveSeo(config,{BASE_PATH:'/preview/site/'});
  const head=renderSeoHead(pages.find(p=>p.route==='work/erp'),content,seo);
  assert.match(head,/href="https:\/\/www.nulabs.co.za\/preview\/site\/work\/erp\/"/);
  assert.match(head,/content="https:\/\/www.nulabs.co.za\/preview\/site\/assets\/social\/erp.png"/);
  assert.match(renderRobots(seo),/Sitemap: https:\/\/www.nulabs.co.za\/preview\/site\/sitemap.xml/);
  for(const base of ['../x','x//y','x?y','x#y','%2e%2e','https://example.com']) assert.throws(()=>resolveSeo(config,{BASE_PATH:base}),/BASE_PATH/);
});
test('all eleven routes have distinct intent-specific titles and descriptions',()=>{
  assert.equal(pages.length,11);
  assert.equal(new Set(pages.map(p=>p.title)).size,11);
  assert.equal(new Set(pages.map(p=>p.description)).size,11);
  const altered=structuredClone(content);altered.contact.meta_description=altered.home.meta_description;
  assert.throws(()=>pageDefinitions(altered),/Duplicate/);
  delete altered.contact.meta_description;assert.throws(()=>pageDefinitions(altered),/Missing/);
});
test('sitemap includes canonical pages only, with no fictional freshness or priority',()=>{
  const sitemap=renderSitemap([...pages,{route:'404',noindex:true}],production);
  assert.equal((sitemap.match(/<loc>/g)||[]).length,11);
  assert.match(sitemap,/<loc>https:\/\/www.nulabs.co.za\/work\/cybersecurity\/<\/loc>/);
  assert.doesNotMatch(sitemap,/404|lastmod|priority|changefreq|vercel.app/);
});
test('404 has no canonical, social promotion or schema and always remains noindex',()=>{
  const head=renderSeoHead({title:'Not found',description:'Not found',route:'404',noindex:true},content,production);
  assert.match(head,/noindex, follow/);
  assert.doesNotMatch(head,/canonical|og:|application\/ld\+json/);
});
test('service schema matches visible copy and makes no unsupported certification, product or location claims',()=>{
  const page=pages.find(p=>p.route==='work/cybersecurity');
  const graph=structuredData(page,content,production)['@graph'];
  const service=graph.find(n=>n['@type']==='Service');
  assert.equal(service.description,page.project.overview);
  assert.equal(service.provider['@id'],'https://www.nulabs.co.za/#organization');
  const crumbs=graph.find(n=>n['@type']==='BreadcrumbList').itemListElement;
  assert.deepEqual(crumbs.map(c=>[c.position,c.name]),[[1,'Home'],[2,'Solutions'],[3,'Cybersecurity software']]);
  assert.equal(crumbs.at(-1).item,service.url);
  assert.doesNotMatch(JSON.stringify(graph),/aggregateRating|addressLocality|telephone|SoftwareApplication|VideoObject|FAQPage/);
});
test('HTML attributes and JSON-LD cannot be broken by editorial text',()=>{
  const copy=structuredClone(content);copy.brand='Nu </script><img src=x> & "Labs"';
  const page={...pages[0],title:copy.brand};
  const head=renderSeoHead(page,copy,production);
  assert.match(head,/Nu &lt;\/script&gt;&lt;img src=x&gt; &amp; &quot;Labs&quot;/);
  const json=head.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
  assert.equal(JSON.parse(json)['@graph'][0].name,copy.brand);
  assert.doesNotMatch(json,/<\/script>/);
  assert.equal(JSON.parse(jsonForHtml({text:'<test>'})).text,'<test>');
});
