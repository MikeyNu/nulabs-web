/** Editable social-card layouts. QA-only Playwright, never a build dependency. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { escapeHtml as esc } from '../../scripts/seo.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const out=path.join(root,'public/assets/social');
const content=JSON.parse(await fs.readFile(path.join(root,'src/content/site.json'),'utf8'));
const data=async(p,type)=>`data:${type};base64,${(await fs.readFile(path.join(root,p))).toString('base64')}`;
const symbol=await data('public/assets/logo-symbol.svg','image/svg+xml');
const wordmark=await data('public/assets/logo-wordmark.svg','image/svg+xml');
const font=await data('public/assets/font-instrument-sans.woff2','font/woff2');
const {chromium}=await import(pathToFileURL(path.resolve(process.env.NU_QA_PLAYWRIGHT)).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.NU_QA_BROWSER_PATH});
await fs.mkdir(out,{recursive:true});
try {
 const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
 const cards=[{id:'nu-labs',asset:'erp',headline:'Software.\nBuilt around\nbusiness.',subtitle:'Engineering depth.\nHuman understanding.'},
  ...content.work.projects.map(p=>({id:p.asset,asset:p.asset,headline:({erp:'ERP\nsystems.',crm:'CRM\nsystems.',pos:'Point\nof sale.',mobile:'Native\nmobile apps.',ai:'AI\nsolutions.',cybersecurity:'Cybersecurity\nsoftware.'})[p.id],subtitle:p.subtitle}))];
 for(const card of cards){
  const photo=await data(`public/assets/solutions/${card.asset}-1600.webp`,'image/webp');
  await page.setContent(`<!doctype html><html lang="en-ZA"><head><meta charset="utf-8"><style>
   @font-face{font-family:Instrument;src:url('${font}') format('woff2');font-weight:400 700}
   *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#f7f7f2;color:#101010;font-family:Instrument,sans-serif}
   header{position:absolute;inset:40px 48px auto;display:flex;align-items:center;justify-content:space-between}
   .brand{display:flex;gap:17px;align-items:center}.symbol{width:50px;height:38px}.wordmark{width:107px;height:29px}
   .domain{font-size:20px}.copy{position:absolute;left:48px;top:164px;width:550px}
   h1{font-size:${card.id==='nu-labs'?88:76}px;line-height:.98;letter-spacing:-.055em;font-weight:500;margin:0;white-space:pre-line}
   .subtitle{font-size:24px;line-height:1.35;margin-top:24px;white-space:pre-line;max-width:33ch}
   .photo{position:absolute;right:32px;top:146px;width:550px;height:367px;object-fit:contain}
   footer{position:absolute;bottom:35px;left:48px;right:48px;border-top:1px solid #b8b8b2;padding-top:20px;display:flex;justify-content:space-between;font-size:19px}
  </style></head><body><header><div class="brand"><img class="symbol" src="${symbol}"><img class="wordmark" src="${wordmark}"></div><span class="domain">www.nulabs.co.za</span></header><div class="copy"><h1>${esc(card.headline)}</h1><p class="subtitle">${esc(card.subtitle)}</p></div><img class="photo" src="${photo}"><footer><span>Software engineering + UI/UX</span><span>Illustrative interface · Demo data</span></footer></body></html>`);
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));});
  const fits=await page.evaluate(()=>{const h=document.querySelector('h1'),p=document.querySelector('.subtitle');return h.scrollWidth<=550&&p.getBoundingClientRect().bottom<548;});
  if(!fits)throw new Error('Social card copy does not fit: '+card.id);
  await page.screenshot({path:path.join(out,card.id+'.png')});
 }
 await page.setViewportSize({width:512,height:512});
 await page.setContent(`<html><body style="margin:0;width:512px;height:512px;background:white;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:38px"><img src="${symbol}" width="300" height="222"><img src="${wordmark}" width="240" height="65"></body></html>`);
 await page.evaluate(async()=>Promise.all([...document.images].map(i=>i.decode())));
 await page.screenshot({path:path.join(out,'logo.png')});
 console.log('Rendered seven 1200 × 630 social cards and a 512 × 512 organization logo. Visual review required.');
} finally {await browser.close();}
