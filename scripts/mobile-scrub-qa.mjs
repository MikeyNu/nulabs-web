/** Reproducible presented-frame, native-touch and responsive regression QA.
 * Uses an existing Playwright installation. No dependencies are installed. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {CINEMA_TIMELINE,cinemaVideoTime} from '../src/scripts/journey-v2.mjs';
const {journey:media}=JSON.parse(await fs.readFile(new URL('../src/content/media.json',import.meta.url)));
const timeline={...CINEMA_TIMELINE,landings:media.chapterTimes,fps:media.fps};
const module=await import(pathToFileURL(process.env.NU_QA_PLAYWRIGHT).href);
const engine=process.env.NU_QA_ENGINE||'chromium';
const browser=await module[engine].launch({headless:true,...(process.env.NU_QA_BROWSER_PATH?{executablePath:process.env.NU_QA_BROWSER_PATH}:{})});
const base=process.env.NU_QA_URL||'http://localhost:3004';
const out=path.resolve(process.env.NU_QA_OUTPUT||'qa-output/mobile-scrub-'+engine);
await fs.mkdir(out,{recursive:true});
const report={engine,version:browser.version(),url:base,time:new Date().toISOString(),physicalDevice:false,scenarios:[]};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function read(page){return page.evaluate(()=>{
  const root=document.querySelector('[data-cinema]'),stage=root.querySelector('[data-cinema-stage]'),v=root.querySelector('video');
  const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,width:r.width}};
  const header=document.querySelector('.site-header'),controls=document.querySelector('.cinema-controls');
  const r=rect(root),s=rect(stage);
  return {state:root.dataset.cinemaState,reason:root.dataset.cinemaReason,progress:(scrollY+r.top===0?scrollY:scrollY-(scrollY+r.top))/(r.height-s.height),
    scrollY,viewport:{width:innerWidth,height:innerHeight},stage:s,header:{...rect(header),background:getComputedStyle(header).backgroundColor,dark:header.classList.contains('is-on-solutions')},controls:rect(controls),
    video:{src:v.currentSrc,ready:v.readyState,time:v.currentTime,seeking:v.seeking,width:v.videoWidth,height:v.videoHeight,paused:v.paused},frame:window.__mobileFrames?.at(-1),
    overflow:document.documentElement.scrollWidth-innerWidth,
    chapters:[...root.querySelectorAll('[data-cinema-chapter]')].map(e=>({id:e.id,inert:e.inert,opacity:Number(getComputedStyle(e).opacity),copy:e.querySelector('.cinema-copy')?rect(e.querySelector('.cinema-copy')):null}))};
});}
async function toProgress(page,p){await page.evaluate(p=>{const r=document.querySelector('[data-cinema]'),s=r.querySelector('[data-cinema-stage]');scrollTo({top:scrollY+r.getBoundingClientRect().top+p*(r.offsetHeight-s.offsetHeight),behavior:'instant'});},p);}
async function settle(page,p){const target=cinemaVideoTime(p,media.durationSeconds,timeline);await page.waitForFunction(t=>{const v=document.querySelector('[data-cinema-video]'),f=window.__mobileFrames?.at(-1);return !v.seeking&&f&&Math.abs(f.time-t)<.09&&Math.abs(v.currentTime-t)<.09;},target,{timeout:10000});await pause(60);}
async function capture(page,item,label){const state=await read(page);assert(state.overflow<=2,'Horizontal overflow '+state.overflow);item.states.push({label,...state});await page.screenshot({path:path.join(out,item.name+'-'+label+'.jpg'),quality:80});return state;}
async function scenario(name,options,run){
  const item={name,states:[],errors:[],videos:[]};report.scenarios.push(item);
  const {blocked=false,...contextOptions}=options;
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,...contextOptions});
  if(blocked && engine!=='webkit')await context.route('**/*.mp4',r=>r.abort());
  // WebKit on Windows loads media outside Playwright request interception.
  // A real missing URL exercises the equivalent unavailable-media path there.
  if(blocked && engine==='webkit')await context.route('**/',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const response=await route.fetch();const html=await response.text();
    await route.fulfill({response,body:html.replace(/(data-(?:mobile-)?src=")[^"]+\.mp4/g,'$1/assets/video/qa-intentionally-missing.mp4')});
  });
  await context.addInitScript(()=>{
    window.__mobileFrames=[];window.__mediaSources=[];new MutationObserver(records=>{for(const r of records)if(r.target.tagName==='VIDEO'&&r.target.src)window.__mediaSources.push(r.target.src);}).observe(document,{subtree:true,attributes:true,attributeFilter:['src']});
    const original=HTMLVideoElement.prototype.requestVideoFrameCallback;
    const record=(v,time,at)=>{const canvas=document.createElement('canvas');canvas.width=32;canvas.height=18;const ctx=canvas.getContext('2d');ctx.drawImage(v,0,0,32,18);const pixels=ctx.getImageData(0,0,32,18).data;let hash=0;for(const value of pixels)hash=(hash*31+value)|0;window.__mobileFrames.push({time,at,pixelHash:hash});};
    if(original)HTMLVideoElement.prototype.requestVideoFrameCallback=function(callback){return original.call(this,(now,m)=>{record(this,m.mediaTime,now);callback(now,m);});};
    else for(const event of ['loadeddata','seeked'])document.addEventListener(event,e=>{const v=e.target;if(v.tagName!=='VIDEO')return;requestAnimationFrame(()=>requestAnimationFrame(now=>{if(v.readyState>=2&&!v.seeking)record(v,v.currentTime,now);}));},true);
  });
  const page=await context.newPage();page.on('pageerror',e=>item.errors.push(e.message));page.on('request',r=>{if(/\.mp4/.test(r.url()))item.videos.push(r.url());});
  try{await page.goto(base,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);await run(page,item,context);assert.equal(item.errors.length,0);item.status='PASS';}
  catch(e){item.status='FAIL';item.failure=e.message;await capture(page,item,'failure').catch(()=>{});}
  await context.close();console.log(name+': '+item.status+(item.failure?' '+item.failure:''));await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
}
async function enhanced(page){await page.waitForFunction(()=>document.querySelector('[data-cinema]')?.dataset.cinemaState==='enhanced',null,{timeout:22000});}
const devices=engine==='webkit'?[['phone',{width:390,height:844}],['landscape',{width:844,height:390}]]:[['small-phone',{width:360,height:640}],['phone',{width:390,height:844}],['large-phone',{width:430,height:932}],['tablet',{width:768,height:1024}],['landscape',{width:844,height:390}],['desktop',{width:1440,height:900}],['short-desktop',{width:1280,height:600}]];
try{
for(const [name,viewport] of devices)await scenario(name,{viewport,isMobile:!name.includes('desktop'),hasTouch:!name.includes('desktop')},async(page,item,context)=>{
  await enhanced(page);await toProgress(page,0);await settle(page,0);
  for(const p of [0,.21,.34,.47,.60,.73,.9,.60,.34,0]){
    await toProgress(page,p);await settle(page,p);
    const state=await capture(page,item,'p'+Math.round(p*100)+'-'+item.states.length);
    assert.equal(state.state,'enhanced');assert(/rgba\([^)]*,\s*0\)/.test(state.header.background),'Header must remain transparent through camera journey');
    const index=[0,.34,.60,.9].indexOf(p);
    if(index>=0){assert(!state.chapters[index].inert&&state.chapters[index].opacity>.99,'Reading chapter hidden');const copy=state.chapters[index].copy;if(copy){assert(copy.top>=state.header.bottom-1,'Copy intersects navigation');assert(copy.bottom<=state.controls.top+1,'Copy intersects controls');}}
    else assert(state.chapters.every(c=>c.inert&&c.opacity<.01),'Copy must clear for the camera move');
  }
  assert(new Set(item.states.map(s=>s.frame?.pixelHash)).size>=4,'Distinct decoded camera images are required');
  const source=new URL((await read(page)).video.src).pathname;
  assert(source.endsWith(name.includes('desktop')?media.video:media.mobileVideo),'Correct responsive video requested');
  assert.equal(await page.evaluate(()=>new Set(window.__mediaSources).size),1,'Only one video source may be attached');
  if(engine==='chromium')assert.equal(new Set(item.videos).size,1,'Only one video asset may be downloaded');
  else item.mediaNetwork='WebKit native media requests are not exposed; source changes and decoded pixels verified';
  if(name==='phone'&&engine==='chromium'){
    const session=await context.newCDPSession(page);
    for(let swipe=0;swipe<4;swipe++){
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:640}]});
      for(let i=1;i<=12;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y:640-i*30}]});await pause(16);}
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(180);
    }
    await pause(300);const s=await read(page);assert(s.scrollY>600,'Native touch must advance document');await settle(page,Math.min(1,s.progress));await capture(page,item,'native-touch');await session.detach();
  }
  if(name==='phone'){
    await toProgress(page,.6);await settle(page,.6);
    await page.setViewportSize({width:844,height:390});await pause(300);
    await enhanced(page);await capture(page,item,'rotated');
    assert(Math.abs((await read(page)).progress-.6)<.015,'Rotation must retain the chapter position');
    await settle(page,.6);assert.equal(await page.evaluate(()=>new Set(window.__mediaSources).size),1,'Rotation must not attach a second video');
    await page.setViewportSize(viewport);await pause(200);await toProgress(page,.6);await settle(page,.6);
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('[data-cinema]').dataset.cinemaReason==='reduced-motion');
    assert((await read(page)).chapters.every(c=>!c.inert&&c.opacity===1));
    await page.emulateMedia({reducedMotion:'no-preference'});await enhanced(page);await toProgress(page,.34);await settle(page,.34);
    await pause(220);await page.reload({waitUntil:'load'});await enhanced(page);await settle(page,.34);await capture(page,item,'restored');
    await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');
  }
  await page.evaluate(()=>{const r=document.querySelector('[data-cinema]'),s=r.querySelector('[data-cinema-stage]');scrollTo(0,scrollY+r.getBoundingClientRect().top+r.offsetHeight-s.offsetHeight+130);});await pause(300);
  assert(!/rgba\([^)]*,\s*0\)/.test((await read(page)).header.background),'Navigation must become solid after the pin releases');
  await toProgress(page,.34);await settle(page,.34);await pause(250);assert(/rgba\([^)]*,\s*0\)/.test((await read(page)).header.background));
  await page.locator('.site-footer').scrollIntoViewIfNeeded();assert(await page.locator('.site-footer').isVisible());
});
for(const [name,options] of [['reduced',{reducedMotion:'reduce'}],['no-js',{javaScriptEnabled:false}],['blocked',{blocked:true}]])await scenario(name,options,async(page,item)=>{
  if(name==='blocked')await page.waitForFunction(()=>document.querySelector('[data-cinema]').dataset.mediaStatus==='error');
  else if(name==='reduced')await page.waitForFunction(()=>document.querySelector('[data-cinema]').dataset.cinemaReason==='reduced-motion');
  const s=await capture(page,item,'fallback');assert.notEqual(s.state,'enhanced');assert(s.chapters.every(c=>!c.inert&&c.opacity===1));
  if(name!=='blocked')assert.equal(item.videos.length,0,'Static preference must not download video');
  await page.locator('#craft').scrollIntoViewIfNeeded();await capture(page,item,'craft');await page.locator('.site-footer').scrollIntoViewIfNeeded();
});
}finally{await browser.close();}
report.passed=report.scenarios.filter(s=>s.status==='PASS').length;
report.failed=report.scenarios.length-report.passed;
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({engine,passed:report.passed,failed:report.failed,out}));
if(report.failed)process.exitCode=1;
