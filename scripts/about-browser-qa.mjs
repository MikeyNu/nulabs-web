import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.NU_QA_PLAYWRIGHT));
const browser=await chromium.launch({headless:true,executablePath:process.env.NU_QA_BROWSER_PATH});
const base=process.env.NU_QA_URL||'http://localhost:8081';
const out=path.resolve(process.env.NU_QA_OUTPUT||'qa-output/about');
await fs.mkdir(out,{recursive:true});
const report={assetStatus:'Higgsfield transparent computer, responsive WebP exports',visualReview:'NOT RUN',cases:[],errors:[]};
const expected=['Mikey Nu (Pty) Ltd','2023','Fourways, South Africa','remote team'];
try {
 for(const [name,width,height,reducedMotion,javaScriptEnabled] of [
  ['desktop',1440,1000,'no-preference',true],['mobile',390,844,'no-preference',true],
  ['narrow',320,740,'no-preference',true],['tablet',820,1180,'no-preference',true],
  ['short',1440,700,'no-preference',true],['reduced',1440,1000,'reduce',true],
  ['no-js',390,844,'reduce',false]]) {
  const context=await browser.newContext({viewport:{width,height},reducedMotion,javaScriptEnabled});
  const page=await context.newPage();
  await page.addInitScript(()=>{window.__aboutVitals={cls:0,longTasks:0,lcp:0};new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__aboutVitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(list=>{window.__aboutVitals.longTasks+=list.getEntries().length;}).observe({type:'longtask',buffered:true});new PerformanceObserver(list=>{window.__aboutVitals.lcp=list.getEntries().at(-1).startTime;}).observe({type:'largest-contentful-paint',buffered:true});});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(base+'/studio/',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('h1').count(),1);
  for(const text of expected) assert((await page.locator('main').innerText()).includes(text),name+' missing '+text);
  const row={name,width,height,states:[]};report.cases.push(row);
  async function capture(state) {
   const data=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,scrollY,
    mode:document.querySelector('[data-about-values]').dataset.motion,
    transform:getComputedStyle(document.querySelector('[data-about-values-track]')).transform,
    object:getComputedStyle(document.querySelector('[data-about-object]')).transform,
    header:getComputedStyle(document.querySelector('.site-header')).backgroundColor,
    fonts:document.fonts.check('500 20px Instrument'),vitals:window.__aboutVitals||null,image:document.querySelector('.about-computer img')?.currentSrc}));
   assert(data.overflow<=2,name+' overflow '+data.overflow);assert(data.fonts,name+' font failed');
   await page.screenshot({path:path.join(out,name+'-'+state+'.png')});row.states.push({state,...data});
  }
  await capture('hero');
  const headlineBounds=await page.locator('#about-title').evaluate(el=>[...el.children].map(line=>{const range=document.createRange();range.selectNodeContents(line);const b=range.getBoundingClientRect();return {left:b.left,right:b.right};}));
  assert(headlineBounds.every(b=>b.left>=0 && b.right<=width),name+' clipped headline glyphs');
  for(const [state,selector] of [['story','.about-story'],['values','.about-values'],['remote','.about-remote'],['end','.about-end']]) {
   await page.locator(selector).scrollIntoViewIfNeeded();
   await page.waitForTimeout(450);await capture(state);
  }
  if(name==='desktop') {
   for(const progress of [0,.25,.5,.75,1,.5,0]) {
    await page.evaluate(p=>{const e=document.querySelector('[data-about-values]'),stage=e.querySelector('[data-about-values-stage]');scrollTo(0,scrollY+e.getBoundingClientRect().top-112+p*(e.offsetHeight-stage.offsetHeight));},progress);
    await page.waitForTimeout(100);await capture('rail-'+row.states.length);
   }
   assert(row.states.filter(s=>s.state.startsWith('rail-')).every(s=>s.mode==='horizontal'));
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);await capture('live-reduced');
   assert.equal(row.states.at(-1).mode,'normal-flow');assert.equal(row.states.at(-1).transform,'none');
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.goto(base+'/studio/#our-story');await page.waitForTimeout(200);
   const box=await page.locator('#about-story-title').boundingBox();assert(box.y>=75 && box.y<height,'Deep link failed');
   await page.goto(base+'/services/');await page.goBack();assert(page.url().includes('/studio/'));
  } else if(name==='mobile') {
   await page.evaluate(()=>scrollTo(0,0));await page.locator('.menu-toggle').click();
   assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
  }
  if(name==='reduced' || name==='short' || name==='mobile') {
   assert(row.states.every(s=>s.mode==='normal-flow'));assert(row.states.every(s=>s.transform==='none'));
  }
  await page.evaluate(()=>scrollTo(0,0));
  if(name==='reduced' || name==='mobile') await page.screenshot({path:path.join(out,name+'-full.png'),fullPage:true});
  await context.close();
 }
 assert.equal(report.errors.length,0);
 console.log(`PASS: ${report.cases.length} About viewport/preference cases, facts, heading, overflow, font loading, scroll reversal, live reduced motion, deep linking, history and menu. Visual inspection is separate.`);
} finally {await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
