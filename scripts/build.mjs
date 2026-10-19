import { renderHomeV2 } from './home-v2.mjs';
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const content = JSON.parse(await readFile(path.join(root, 'src/content/site.json'), 'utf8'));
const assets = JSON.parse(await readFile(path.join(root, 'public/assets/manifest.json'), 'utf8'));
const config = JSON.parse(await readFile(path.join(root, 'src/content/media.json'), 'utf8'));
const base = '/' + (process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '');
const prefix = base === '/' ? '' : base;
const url = (p = '/') => prefix + p;
const escape = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines = s => escape(s).replace(/\n/g, '<br>');
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const link = (href, label, cls = 'text-link') => `<a class="${cls}" href="${url(href)}">${escape(label)}${arrow}</a>`;
const image = (name, alt = '', cls = '', eager = false) => {
  const m = assets.images[name];
  if (!m) throw new Error(`Unknown image: ${name}`);
  const srcset = m.variants.map(v => `${url(v.src)} ${v.width}w`).join(', ');
  return `<img class="${cls}" src="${url(m.src)}" srcset="${srcset}" sizes="(max-width: 767px) 100vw, 70vw" width="${m.width}" height="${m.height}" alt="${escape(alt)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
};
const logo = () => `<span class="brand"><img class="brand-symbol" src="${url('/assets/logo-symbol.svg')}" width="50" height="38" alt=""><img class="brand-wordmark" src="${url('/assets/logo-wordmark.svg')}" width="107" height="29" alt="Nu Labs"></span>`;
const nav = active => content.site.nav.map(n => `<a href="${url(n.href + '/')}"${active === n.href.slice(1) ? ' aria-current="page"' : ''}>${escape(n.label)}</a>`).join('');
const header = active => `<a class="skip-link" href="#main">Skip to content</a><span id="top" class="page-top" aria-hidden="true"></span><header class="site-header"><a class="home-link" href="${url('/')}" aria-label="Nu Labs home">${logo()}</a><nav class="desktop-nav" aria-label="Main navigation">${nav(active)}</nav><button class="menu-toggle" aria-expanded="false" aria-controls="mobile-menu"><span>Menu</span><i aria-hidden="true"></i></button><nav id="mobile-menu" class="mobile-menu" aria-label="Mobile navigation" hidden>${nav(active)}</nav></header><noscript><nav class="no-js-nav" aria-label="Navigation">${nav(active)}</nav></noscript>`;
const footer = () => `<footer class="site-footer"><div class="footer-top"><p class="footer-manifesto">Keep it clear.<br>Make it useful.<br>Make it Nu.</p><div class="footer-links">${content.site.nav.map(n => `<a href="${url(n.href + '/')}">${escape(n.label)}</a>`).join('')}<a href="#top">Back to top ↑</a></div></div><div class="footer-bottom"><span>© 2026 Nu Labs</span><span>Software engineering. Considered design.</span><span>Illustrative interfaces. Demo data.</span></div></footer>`;
const closing = (headline = 'What could we\nmake together?', body = 'Tell us what needs to work better. We will help define the next step.') => `<section class="closing section-pad"><span class="eyeline">The next chapter</span><div class="closing-layout"><h2>${lines(headline)}</h2><div><p>${escape(body)}</p>${link('/contact/', 'Start a conversation')}</div></div></section>`;
const masthead = (label, headline, intro) => `<section class="page-masthead section-pad"><p class="eyeline">${escape(label)}</p><h1>${lines(headline)}</h1><p class="page-intro">${escape(intro)}</p></section>`;

function projectArt(id) {
  const p = content.work.projects.find(p => p.id === id);
  if (!p) throw new Error('Unknown solution: ' + id);
  return `<div class="solution-visual solution-${p.asset}">${image('solution-'+p.asset, assets.images['solution-'+p.asset].alt)}</div>`;
}
function projectCard(p, index) {
  return `<article class="project-card project-${index}" data-project-category="${escape(p.category)}"><a class="project-art" href="${url('/work/' + p.id + '/')}" aria-label="${escape(p.cta + ': ' + p.title)}">${projectArt(p.id)}<span class="project-open" aria-hidden="true">↗</span></a><div class="project-meta"><div><span class="micro">${escape(p.status)}</span><h3><a href="${url('/work/' + p.id + '/')}">${escape(p.title)}</a></h3><p>${escape(p.subtitle)}</p></div><span class="project-year">${escape(p.year)}</span></div></article>`;
}
function home() { return renderHomeV2({url,escape,link,image,projectArt,content,config,closing}); }
function work() {
  const w = content.work;
  return `${masthead(w.label, w.headline, w.intro)}<section class="work-section section-pad"><div class="filter-bar" role="group" aria-label="Filter work" hidden>${w.filters.map((f,i)=>`<button data-filter="${escape(f)}" aria-pressed="${!i}">${escape(f)}</button>`).join('')}</div><p class="filter-announcement sr-only" aria-live="polite"></p><div class="project-grid work-grid">${w.projects.map(projectCard).join('')}</div><p class="quiet-note">${escape(w.concept_notice)}</p></section>${closing(w.closing_headline)}`;
}
function project(p) {
  const titleClass = p.title.split(/\s+/).some(word => word.length > 11) ? ' class="case-title-long"' : '';
  return `<section class="case-masthead section-pad"><a class="back-link" href="${url('/work/')}">← All solutions</a><div class="case-title"><div><p class="eyeline">${escape(p.status)} / ${p.year}</p><h1${titleClass}>${escape(p.title)}</h1><p class="page-intro">${escape(p.subtitle)}</p></div><p class="micro">${escape(p.discipline)}</p></div></section><div class="case-cover">${projectArt(p.id)}</div><section class="case-story section-pad"><div><span class="eyeline">The question</span><h2>${escape(p.summary)}</h2></div><div class="case-copy"><p>${escape(p.challenge)}</p><h3>The direction</h3><p>${escape(p.direction)}</p><p>${escape(p.detail)}</p><p><a class="text-link" href="${url('/assets/solutions/'+p.asset+'-ui.svg')}">Inspect the interface study ${arrow}</a></p><h3>Scope</h3><ul class="plain-list">${p.scope.map(s=>`<li>${escape(s)}</li>`).join('')}</ul><p class="quiet-note">${escape(p.image_note)}</p></div></section>${closing('What is your\nnext chapter?')}`;
}
function studio() {
  const s = content.studio;
  return `${masthead(s.label,s.headline,s.intro)}<figure class="studio-wide">${image('solution-erp','ERP interface study with demo data','',true)}<figcaption>${escape(s.image_caption)}</figcaption></figure><section class="studio-principles section-pad"><div class="section-heading"><h2>${lines(s.statement)}</h2><p>${escape(s.body)}</p></div><div class="principles-grid">${s.values.map((v,i)=>`<article><span class="micro">0${i+1}</span><h3>${escape(v.title)}</h3><p>${escape(v.body)}</p></article>`).join('')}</div></section><section class="perspective section-pad"><div class="perspective-mark" aria-hidden="true"><img src="${url('/assets/logo-symbol.svg')}" alt="" width="230" height="173"></div><span class="eyeline">Our perspective</span><h2>${lines(s.perspective.headline)}</h2><p>${escape(s.perspective.body)}</p></section>${closing(s.closing.headline,s.closing.body)}`;
}
function services() {
  const s = content.services;
  return `${masthead(s.label,s.headline,s.intro)}<div class="services-stack section-pad">${s.services.map(t=>`<section class="service-detail" id="${t.id}"><div class="service-name"><span class="micro">${t.number}</span><h2>${lines(t.name)}</h2></div><div class="service-description"><h3>${escape(t.title)}</h3><p>${escape(t.body)}</p><ul class="plain-list">${t.deliverables.map(d=>`<li>${escape(d)}</li>`).join('')}</ul><p class="service-outcome">${escape(t.outcome)}</p></div></section>`).join('')}</div><section class="process-section section-pad"><span class="eyeline">From first question to fine detail</span><h2>${escape(s.process.headline)}</h2><div class="process-grid">${s.process.steps.map(t=>`<article><span class="process-number">${t.number}</span><h3>${t.title}</h3><p>${escape(t.body)}</p></article>`).join('')}</div></section><section class="faq-section section-pad"><h2>A few useful<br>starting points.</h2><div>${s.faq.map(q=>`<details><summary>${escape(q.question)}<span aria-hidden="true">+</span></summary><p>${escape(q.answer)}</p></details>`).join('')}</div></section>${closing(s.closing.headline)}`;
}
function contact() {
  const c=content.contact;
  return `${masthead(c.label,c.headline,c.intro)}<section class="contact-section section-pad"><div class="contact-aside"><span class="eyeline">A little context goes a long way.</span><p>What are you making?<br>Who is it for?<br>Where would you like to go?</p><span class="contact-star" aria-hidden="true">↗</span></div><form class="enquiry-form" data-enquiry-form><p class="form-notice">Prepare a project brief on your device. Nothing is sent or stored online.</p><div class="form-grid"><label>Your name<input name="name" autocomplete="name" required maxlength="100" placeholder="Name and surname"></label><label>Email address<input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="you@company.com"></label></div><label>Company or project <span>(optional)</span><input name="company" autocomplete="organization" maxlength="160" placeholder="Your company or project"></label><fieldset><legend>What are you thinking about?</legend><div class="interest-options">${c.form.interest.options.map((o,i)=>`<label><input type="radio" name="interest" value="${escape(o)}"${!i?' checked':''}><span>${escape(o)}</span></label>`).join('')}</div></fieldset><label>A little about your project<textarea name="message" rows="5" required maxlength="5000" placeholder="What would you like to make, change or solve?"></textarea></label><button class="button-dark" type="submit" disabled>Prepare enquiry ${arrow}</button><p class="form-hint">Please leave out passwords and sensitive personal information.</p><noscript><p>Enquiry preparation needs JavaScript. You can still use the prompts above to write your brief.</p></noscript><section data-enquiry-result class="enquiry-result" aria-labelledby="enquiry-title" hidden><h2 id="enquiry-title" tabindex="-1">Your enquiry is ready.</h2><p>Copy or download it to keep ready to share.</p><textarea data-enquiry-text readonly aria-label="Prepared enquiry" rows="10"></textarea><div class="enquiry-actions"><button type="button" data-copy-enquiry>Copy enquiry</button><button type="button" data-download-enquiry>Download brief</button></div><p data-enquiry-status aria-live="polite"></p></section></form></section>`;
}

const pages = [
  {route:'', title:content.home.meta_title, active:'home', body:home()},
  {route:'work', title:content.work.meta_title, active:'work', body:work()},
  {route:'studio', title:content.studio.meta_title, active:'studio', body:studio()},
  {route:'services', title:content.services.meta_title, active:'services', body:services()},
  {route:'contact', title:content.contact.meta_title, active:'contact', body:contact()},
  ...content.work.projects.map(p=>({route:'work/'+p.id,title:p.title+' | Nu Labs',active:'work',body:project(p)}))
];
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
await cp(path.join(root,'public'),out,{recursive:true});
await cp(path.join(root,'src/styles'),path.join(out,'styles'),{recursive:true});
await cp(path.join(root,'src/scripts'),path.join(out,'scripts'),{recursive:true});
for (const p of pages) {
  const dir=path.join(out,p.route);await mkdir(dir,{recursive:true});
  const canonical=config.siteUrl?`<link rel="canonical" href="${escape(config.siteUrl.replace(/\/$/,'')+url('/'+(p.route?p.route+'/':'')))}">`:'';
  const html=`<!doctype html><html lang="en-ZA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(p.title)}</title><meta name="description" content="${escape(content.site.description)}"><meta name="theme-color" content="#f7f7f2">${canonical}<link rel="icon" href="${url('/assets/logo-symbol.svg')}" type="image/svg+xml"><link rel="preload" href="${url('/assets/font-instrument-sans.woff2')}" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="${url('/styles/site.css')}"><link rel="stylesheet" href="${url('/styles/home-v2.css')}"><script type="module" src="${url('/scripts/site.mjs')}"></script></head><body data-page="${p.active}">${header(p.active)}<main id="main">${p.body}</main>${footer()}</body></html>`;
  await writeFile(path.join(dir,'index.html'),html);
}
await writeFile(path.join(out,'404.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | Nu Labs</title><link rel="stylesheet" href="${url('/styles/site.css')}"><script type="module" src="${url('/scripts/site.mjs')}"></script></head><body>${header('')}<main id="main" class="section-pad page-masthead"><p class="eyeline">404 / A different direction</p><h1>Nothing here.<br>Plenty ahead.</h1>${link('/','Back to Nu Labs')}</main>${footer()}</body></html>`);
await writeFile(path.join(out,'.nojekyll'),'');
console.log(`Built ${pages.length} pages. Base: ${prefix||'/'}. Journey asset: ${config.journey.status}.`);
