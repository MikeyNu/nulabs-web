/** Static search metadata. Never use a preview hostname as a canonical origin. */
export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const jsonForHtml = value => JSON.stringify(value).replace(/</g, '\\u003c');

export function resolveSeo(config, env = process.env) {
  const raw = env.SITE_URL ?? config.siteUrl;
  let origin = null;
  if (raw) {
    let parsed;
    try { parsed = new URL(raw); } catch { throw new Error('SITE_URL must be an absolute HTTPS origin.'); }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port ||
        parsed.pathname !== '/' || parsed.search || parsed.hash ||
        !parsed.hostname.includes('.') || parsed.hostname.endsWith('.localhost')) {
      throw new Error('SITE_URL must be a public HTTPS origin without a path, credentials, query or fragment. Use BASE_PATH for subpaths.');
    }
    origin = parsed.origin;
  }
  const rawBase = env.BASE_PATH || '';
  const base = rawBase.replace(/^\/+|\/+$/g, '');
  if (base && !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(base)) {
    throw new Error('BASE_PATH must contain only path segments, without traversal, query or fragment.');
  }
  if (env.SEO_NOINDEX && !['0','1'].includes(env.SEO_NOINDEX)) throw new Error('SEO_NOINDEX must be 0 or 1.');
  const environment = env.VERCEL_TARGET_ENV || env.VERCEL_ENV;
  const noindex = !origin || env.SEO_NOINDEX === '1' || Boolean(environment && environment !== 'production');
  const prefix = base ? '/' + base : '';
  return {origin, prefix, noindex, absolute: p => origin ? origin + prefix + p : null};
}

export const routePath = route => '/' + (route ? route + '/' : '');

export function pageDefinitions(content) {
  const pages = [
    {route:'', key:'home', label:'Home', type:'WebPage'},
    {route:'work', key:'work', label:'Solutions', type:'CollectionPage'},
    {route:'studio', key:'studio', label:'Studio', type:'AboutPage'},
    {route:'services', key:'services', label:'Services', type:'CollectionPage'},
    {route:'contact', key:'contact', label:'Contact', type:'ContactPage'},
  ].map(p => ({...p, title:content[p.key].meta_title, description:content[p.key].meta_description}));
  for (const project of content.work.projects) pages.push({route:'work/' + project.id,
    label:project.title, title:project.meta_title, description:project.meta_description,
    type:'WebPage', project});
  for (const page of pages) {
    if (!page.title?.trim() || !page.description?.trim()) throw new Error('Missing search copy: ' + routePath(page.route));
  }
  for (const field of ['title','description']) {
    if (new Set(pages.map(p=>p[field])).size !== pages.length) throw new Error('Duplicate page ' + field);
  }
  return pages;
}

export function breadcrumbsFor(page) {
  if (!page.route) return [];
  return [{route:'',label:'Home'}, ...(page.project ? [{route:'work',label:'Solutions'}] : []),
    {route:page.route,label:page.label}];
}

export function structuredData(page, content, seo) {
  if (!seo.origin || page.noindex) return null;
  const absolute = seo.absolute;
  const home = absolute('/');
  const canonical = absolute(routePath(page.route));
  const organization = {'@type':'Organization','@id':home+'#organization',name:content.brand,
    url:home,description:content.site.description,
    logo:{'@type':'ImageObject',url:absolute('/assets/social/logo.png'),width:512,height:512}};
  const website = {'@type':'WebSite','@id':home+'#website',url:home,name:content.brand,
    inLanguage:content.locale,publisher:{'@id':organization['@id']}};
  const webpage = {'@type':page.type,'@id':canonical+'#webpage',url:canonical,
    name:page.title,description:page.description,inLanguage:content.locale,
    isPartOf:{'@id':website['@id']},about:{'@id':organization['@id']}};
  const graph = [organization,website,webpage];
  const crumbs = breadcrumbsFor(page);
  if (crumbs.length) {
    const breadcrumb = {'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',
      itemListElement:crumbs.map((crumb,i)=>({'@type':'ListItem',position:i+1,
        name:crumb.label,item:absolute(routePath(crumb.route))}))};
    webpage.breadcrumb = {'@id':breadcrumb['@id']};graph.push(breadcrumb);
  }
  if (page.project) {
    const p = page.project;
    const service = {'@type':'Service','@id':canonical+'#service',name:p.service_name,
      serviceType:p.service_name,description:p.overview,url:canonical,
      provider:{'@id':organization['@id']},mainEntityOfPage:{'@id':webpage['@id']}};
    webpage.mainEntity = {'@id':service['@id']};graph.push(service);
  } else if (page.route === 'services') {
    const services = content.services.services.map(service=>({'@type':'Service',
      '@id':canonical+'#'+service.id,name:service.name.replace(/\n/g,' '),
      serviceType:service.name.replace(/\n/g,' '),description:service.body,
      url:canonical+'#'+service.id,provider:{'@id':organization['@id']}}));
    webpage.mainEntity = services.map(service=>({'@id':service['@id']}));graph.push(...services);
  }
  return {'@context':'https://schema.org','@graph':graph};
}

export function renderSeoHead(page, content, seo) {
  const esc = escapeHtml;
  const noindex = seo.noindex || page.noindex;
  const canonical = !page.noindex && seo.absolute(routePath(page.route));
  const image = seo.absolute('/assets/social/' + (page.project?.asset || 'nu-labs') + '.png');
  const imageAlt = page.project
    ? `${page.project.title} by Nu Labs. Illustrative interface with demo data.`
    : 'Nu Labs. Software built around your business.';
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}">`,
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">`,
  ];
  if (canonical) tags.push(`<link rel="canonical" href="${esc(canonical)}">`);
  if (!page.noindex) {
    const social = {'og:type':'website','og:site_name':content.brand,'og:locale':content.locale.replace('-','_'),
      'og:title':page.title,'og:description':page.description,'og:url':canonical,
      'og:image':image,'og:image:width':'1200','og:image:height':'630','og:image:type':'image/png','og:image:alt':imageAlt};
    for (const [property,value] of Object.entries(social)) if(value) tags.push(`<meta property="${property}" content="${esc(value)}">`);
    for (const [name,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':page.title,
      'twitter:description':page.description,'twitter:image':image,'twitter:image:alt':imageAlt})) {
      if(value) tags.push(`<meta name="${name}" content="${esc(value)}">`);
    }
    const data = structuredData(page,content,seo);
    if(data) tags.push(`<script type="application/ld+json">${jsonForHtml(data)}</script>`);
  }
  return tags.join('\n');
}

export function renderSitemap(pages, seo) {
  const entries = seo.noindex ? [] : pages.filter(p=>!p.noindex);
  // Do not invent lastmod timestamps from build time or promise crawl frequency.
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.map(p=>`  <url><loc>${escapeHtml(seo.absolute(routePath(p.route)))}</loc></url>`).join('\n') + '\n</urlset>\n';
}

export function renderRobots(seo) {
  // Crawling must remain possible so crawlers can see preview/404 noindex rules.
  return 'User-agent: *\nAllow: /\n' + (seo.noindex ? '' : '\nSitemap: ' + seo.absolute('/sitemap.xml') + '\n');
}
