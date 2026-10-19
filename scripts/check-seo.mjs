import fs from 'node:fs/promises';
import path from 'node:path';
import {resolveSeo, pageDefinitions, routePath, escapeHtml} from './seo.mjs';

/** Validate the generated artifact, including social files, not just its config. */
export async function checkSeo(dist, content, config, env = process.env) {
  const errors=[];
  const seo=resolveSeo(config,env);
  const pages=pageDefinitions(content);
  const titles=new Set(),descriptions=new Set(),images=new Set();
  const check=(condition,message)=>{if(!condition)errors.push(message);};
  for(const page of pages) {
    const label=routePath(page.route);
    const html=await fs.readFile(path.join(dist,page.route,'index.html'),'utf8');
    const head=html.split('</head>')[0];
    const body=html.split('<body')[1] || '';
    const title=[...head.matchAll(/<title>(.*?)<\/title>/gs)];
    const description=[...head.matchAll(/<meta name="description" content="([^"]*)">/g)];
    check(title.length===1 && title[0][1]===escapeHtml(page.title),`${label}: missing or incorrect title`);
    check(description.length===1 && description[0][1]===escapeHtml(page.description),`${label}: missing or incorrect description`);
    titles.add(title[0]?.[1]);descriptions.add(description[0]?.[1]);
    const canonicals=[...head.matchAll(/<link rel="canonical" href="([^"]*)">/g)];
    const canonical=seo.absolute(label);
    check(seo.origin ? canonicals.length===1 && canonicals[0][1]===escapeHtml(canonical) : canonicals.length===0,`${label}: canonical mismatch`);
    const robots=head.match(/<meta name="robots" content="([^"]*)">/)?.[1];
    check(Boolean(robots) && /\bnoindex\b/.test(robots)===seo.noindex,`${label}: incorrect indexing policy`);
    check(head.includes(`property="og:title" content="${escapeHtml(page.title)}"`),`${label}: social title mismatch`);
    check(head.includes('name="twitter:card" content="summary_large_image"'),`${label}: missing social card`);
    if(seo.origin) {
      check(head.includes(`property="og:url" content="${escapeHtml(canonical)}"`),`${label}: social URL mismatch`);
      const image=head.match(/property="og:image" content="([^"]*)"/)?.[1];
      check(image===seo.absolute('/assets/social/'+(page.project?.asset || 'nu-labs')+'.png'),`${label}: social image mismatch`);
      if(image)images.add(new URL(image).pathname.slice(seo.prefix.length));
      const scripts=[...head.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
      check(scripts.length===1,`${label}: missing or duplicate JSON-LD graph`);
      try {
        const data=JSON.parse(scripts[0]?.[1]);
        const graph=data['@graph'];
        check(data['@context']==='https://schema.org' && Array.isArray(graph),`${label}: invalid schema graph`);
        const webpage=graph.find(item=>item['@id']===canonical+'#webpage');
        check(webpage?.url===canonical && webpage?.name===page.title,`${label}: structured page disagrees with canonical/title`);
        const forbidden=['AggregateRating','Review','LocalBusiness','SoftwareApplication','VideoObject','FAQPage'];
        check(!graph.some(item=>forbidden.includes(item['@type'])),`${label}: unsupported claim-bearing schema`);
        for(const service of graph.filter(item=>item['@type']==='Service')) {
          check(body.includes(escapeHtml(service.description)),`${label}: service description absent from visible HTML`);
        }
        const crumbs=graph.find(item=>item['@type']==='BreadcrumbList');
        if(page.route)check(crumbs?.itemListElement.at(-1)?.item===canonical && body.includes('aria-label="Breadcrumb"'),`${label}: breadcrumb mismatch`);
      } catch(error) {errors.push(`${label}: invalid JSON-LD: ${error.message}`);}
    }
    if(page.project) {
      check(body.includes('Illustrative interface') && body.includes(escapeHtml(page.project.image_note)),`${label}: missing concept qualification`);
      check(body.includes('loading="eager" fetchpriority="high"'),`${label}: primary image is deferred`);
    }
  }
  check(titles.size===pages.length,'Search titles are duplicated.');
  check(descriptions.size===pages.length,'Search descriptions are duplicated.');
  const sitemap=await fs.readFile(path.join(dist,'sitemap.xml'),'utf8');
  const locations=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
  const expected=seo.noindex?[]:pages.map(p=>seo.absolute(routePath(p.route)));
  check(JSON.stringify(locations)===JSON.stringify(expected),'Sitemap must contain exactly the canonical indexable routes.');
  check(!/<lastmod>|<priority>|<changefreq>/.test(sitemap),'Sitemap contains unsupported freshness/priority claims.');
  const robots=await fs.readFile(path.join(dist,'robots.txt'),'utf8');
  check(robots.includes('User-agent: *\nAllow: /'),'Robots must allow crawling, including preview noindex discovery.');
  check(!/Disallow:\s*\//.test(robots),'Robots blocks the pages or their assets.');
  check(seo.noindex ? !robots.includes('Sitemap:') : robots.includes('Sitemap: '+seo.absolute('/sitemap.xml')),'Robots sitemap reference mismatch.');
  const notFound=await fs.readFile(path.join(dist,'404.html'),'utf8');
  check(notFound.includes('name="robots" content="noindex, follow"') && !notFound.includes('rel="canonical"'),'404 must be noindex and must not canonicalize to a real page.');
  for(const name of [...images,'/assets/social/logo.png']) {
    try {
      const bytes=await fs.readFile(path.join(dist,name));
      const logo=name.endsWith('/logo.png');
      check(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),`${name}: invalid PNG`);
      check(bytes.readUInt32BE(16)===(logo?512:1200) && bytes.readUInt32BE(20)===(logo?512:630),`${name}: incorrect delivered dimensions`);
      check(bytes.length<2_000_000,`${name}: unnecessarily large social image`);
    } catch {errors.push(`${name}: social image missing or unreadable`);}
  }
  return errors;
}
