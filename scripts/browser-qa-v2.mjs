/**
 * Independent visual/temporal capture for Nu Labs v2.
 * Uses existing Edge and Playwright Core. No app mutation or browser download.
 * A successful script means capture completed, not that the visual brief passed.
 */
import {pathToFileURL, fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mediaConfig=JSON.parse(await fs.readFile(path.join(projectRoot,'src/content/media.json'),'utf8')).journey;
const landingTimes=mediaConfig.chapterTimes;
assert(Array.isArray(landingTimes)&&landingTimes.length===4&&landingTimes.every((time,i,all)=>Number.isFinite(time)&&time>=0&&(!i||time>all[i-1])),'Four inspected increasing chapterTimes are required.');
assert(Number.isFinite(mediaConfig.fps)&&mediaConfig.fps>0,'Measured video fps is required.');
assert(landingTimes.at(-1)<=mediaConfig.durationSeconds-1/mediaConfig.fps+.00001,'Configured landing must exist within the measured video.');
const frameTolerance=Math.max(2/mediaConfig.fps,1/60);
const modulePath=process.env.NU_QA_PLAYWRIGHT;
assert(modulePath,'NU_QA_PLAYWRIGHT must point to an existing Playwright module. This runner installs nothing.');
const {chromium}=await import(pathToFileURL(path.resolve(modulePath)).href);
const browserPath=process.env.NU_QA_BROWSER_PATH || (process.platform==='win32'?'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe':undefined);
assert(browserPath,'NU_QA_BROWSER_PATH must identify an existing browser.');
const output=path.resolve(process.env.NU_QA_OUTPUT||'qa-output/v2');
const base=(process.env.NU_QA_URL||'http://localhost:3000').replace(/\/$/,'');
await fs.mkdir(output,{recursive:true});
const report={started:new Date().toISOString(),url:base,visualReview:'NOT RUN',browser:null,media:{video:mediaConfig.video,chapterTimes:landingTimes,fps:mediaConfig.fps,durationSeconds:mediaConfig.durationSeconds},scenarios:[]};
const browser=await chromium.launch({headless:true,executablePath:browserPath,args:['--no-first-run','--no-default-browser-check']});
report.browser=browser.version();
const selected=(process.env.NU_QA_CASES||'desktop,mobile,tablet,short,reduced,live-reduced,blocked-video,no-js-desktop,no-js-mobile,routes-and-filter,mobile-menu,local-enquiry,anchors-history,horizontal-focus').split(',');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right}};
async function inspect(page) {
 return page.evaluate(()=>{
  const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right}};
  const vid=document.querySelector('[data-cinema-video]');
  const header=document.querySelector('.site-header');
  const rail=document.querySelector('[data-horizontal]');
  return {scrollY,viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth-innerWidth,
   header:header?{rect:rect(header),background:getComputedStyle(header).backgroundColor,position:getComputedStyle(header).position}:null,
   cinema:rect(document.querySelector('[data-cinema]')),stage:rect(document.querySelector('[data-cinema-stage]')),
   video:vid?{time:vid.currentTime,duration:vid.duration,width:vid.videoWidth,height:vid.videoHeight,ready:vid.readyState,seeking:vid.seeking,src:vid.currentSrc,error:vid.error?.message}:null,
   presented:window.__v2Frames?.at(-1)||null,
   chapters:[...document.querySelectorAll('[data-cinema-chapter]')].map(e=>({id:e.id,index:e.dataset.cinemaChapter,rect:rect(e),hidden:e.hidden,inert:e.inert,opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform,heading:e.querySelector('h1,h2')?.textContent})),
   rail:rail?{rect:rect(rail),stage:rect(rail.querySelector('[data-horizontal-stage]')),track:rect(rail.querySelector('[data-horizontal-track]')),transform:getComputedStyle(rail.querySelector('[data-horizontal-track]')).transform,panels:[...rail.querySelectorAll('[data-horizontal-panel]')].map(e=>({rect:rect(e),heading:e.querySelector('h2,h3')?.textContent,links:[...e.querySelectorAll('a')].map(a=>({text:a.textContent,href:a.getAttribute('href')}))}))}:null};
 });
}
async function capture(page,item,label) {
 if(item.javaScriptEnabled!==false) await page.evaluate(async()=>{
  const imgs=[...document.images].filter(i=>{const r=i.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth});
  await Promise.all(imgs.map(i=>i.decode().catch(()=>{})));
  await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 });
 const file=item.name+'-'+label+'.png';
 await page.screenshot({path:path.join(output,file),timeout:15000});
 const state=await inspect(page);
 assert(state.overflow<=2,'Unexpected document horizontal overflow: '+state.overflow+'px');
 item.states.push({label,file,...state});
}
async function scrollToProgress(page,selector,p){
 await page.evaluate(({selector,p})=>{
  const el=document.querySelector(selector);
  const stage=el.querySelector(selector==='[data-cinema]'?'[data-cinema-stage]':'[data-horizontal-stage]');
  const r=el.getBoundingClientRect(),s=stage.getBoundingClientRect();
  window.scrollTo({top:scrollY+r.top+p*Math.max(0,r.height-s.height),behavior:'instant'});
 },{selector,p});
}
function expectedTime(p){
 const [opening,clarity,craft,possibility]=landingTimes;
 if(p<=.14)return opening;if(p<.28)return opening+(p-.14)/.14*(clarity-opening);
 if(p<=.40)return clarity;if(p<.54)return clarity+(p-.40)/.14*(craft-clarity);
 if(p<=.66)return craft;if(p<.80)return craft+(p-.66)/.14*(possibility-craft);
 return possibility;
}
async function settleVideo(page,item,p){
 const expected=expectedTime(p);
 try{
  await page.waitForFunction(({time,tolerance})=>{
   const v=document.querySelector('[data-cinema-video]');const presented=window.__v2Frames?.at(-1);
   return v&&v.readyState>=2&&!v.seeking&&Math.abs(v.currentTime-time)<=tolerance&&presented&&Math.abs(presented.mediaTime-time)<=tolerance;
  },{time:expected,tolerance:frameTolerance},{timeout:5000});
 }catch(error){item.warnings.push({phase:'video settle',progress:p,expected,message:error.message,...await inspect(page)});throw new Error('Actual presented video did not settle near '+expected+'s at progress '+p);}
}
async function scenario(name,options,run){
 if(!selected.includes(name))return;
 const item={name,started:new Date().toISOString(),states:[],errors:[],warnings:[],frames:[],temporal:[],network:[],failedRequests:[]};report.scenarios.push(item);
 const {blockedVideo=false,...contextOptions}=options;
 item.javaScriptEnabled=contextOptions.javaScriptEnabled!==false;
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,...contextOptions});
 if(blockedVideo)await context.route('**/*.mp4',route=>route.abort('failed'));
 await context.addInitScript(()=>{
  window.__v2Frames=[];
  const original=HTMLVideoElement.prototype.requestVideoFrameCallback;
  if(original) HTMLVideoElement.prototype.requestVideoFrameCallback=function(callback){return original.call(this,(now,meta)=>{window.__v2Frames.push({at:now,mediaTime:meta.mediaTime,presentedFrames:meta.presentedFrames,currentTime:this.currentTime});if(window.__v2Frames.length>4000)window.__v2Frames.shift();callback(now,meta)});};
 });
 const page=await context.newPage();page.setDefaultTimeout(10000);
 page.on('pageerror',e=>item.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!(blockedVideo&&/ERR_FAILED|ERR_ABORTED/.test(m.text())))item.errors.push(m.text())});
 page.on('request',r=>item.network.push({url:r.url(),method:r.method()}));
 page.on('requestfailed',r=>item.failedRequests.push({url:r.url(),error:r.failure()?.errorText,expected:blockedVideo&&/\.mp4(?:\?|$)/.test(r.url())}));
 try{
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
  await page.evaluate(()=>document.fonts.ready);
  await run(page,item,context);
  assert.equal(item.errors.length,0,'Unexpected browser errors: '+item.errors.join(' | '));
  assert(!item.failedRequests.some(r=>!r.expected&&!/ERR_ABORTED/.test(r.error||'')),'Unexpected network failure');
  item.capture='COMPLETED';
 }catch(error){item.capture='FAILED';item.failure={message:error.message,stack:error.stack};try{await capture(page,item,'failure')}catch{}}
 finally{
  item.frames=await page.evaluate(()=>window.__v2Frames||[]).catch(()=>[]);
  item.finished=new Date().toISOString();await context.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(name+': '+item.capture+'; '+item.states.length+' captures; '+item.errors.length+' errors; '+item.warnings.length+' warnings');
 }
}

async function staticComplete(page){
 await page.waitForFunction(()=>!document.querySelector('[data-cinema]')?.classList.contains('cinema-enhanced'));
 const state=await inspect(page);
 assert.equal(state.chapters.length,4,'All four chapters must exist');
 assert(state.chapters.every(c=>!c.hidden&&!c.inert&&Number(c.opacity)>.99),'All static chapters must be readable');
 for(let i=1;i<state.chapters.length;i++)assert(state.chapters[i].rect.y>=state.chapters[i-1].rect.bottom-2,'Static chapters must not overlap');
 assert(state.overflow<=2,'Static document must not overflow horizontally');
}

try{
 await scenario('desktop',{},async(page,item)=>{
  await page.waitForFunction(()=>document.querySelector('[data-cinema-video]')?.readyState>=2,null,{timeout:25000});
  await page.evaluate(()=>scrollTo(0,0));await settleVideo(page,item,0);await capture(page,item,'opening');
  const opening=await inspect(page);
  const renderedTimes=JSON.parse(await page.locator('[data-cinema]').getAttribute('data-cinema-landings'));
  assert.deepEqual(renderedTimes,landingTimes,'Built timeline must match inspected media configuration.');
  assert.equal(Number(await page.locator('[data-cinema]').getAttribute('data-cinema-fps')),mediaConfig.fps,'Built fps must match media configuration.');
  assert(new URL(opening.video.src).pathname.endsWith(mediaConfig.video),'Active video must match configured media.');
  assert(opening.header.rect.y===0&&opening.header.rect.x===0,'Header must meet the viewport edges');
  assert(Math.abs(opening.stage.y)<2,'Hero stage must begin behind the header');
  assert(/rgba\([^)]*,\s*0\)/.test(opening.header.background),'Opening navigation must be transparent');
  await page.evaluate(()=>scrollTo(0,64));await delay(300);await capture(page,item,'navigation-within-journey');
  assert(/rgba\([^)]*,\s*0\)/.test((await inspect(page)).header.background),'Navigation must remain transparent inside the pinned video journey');
  const points=[0,.14,.175,.21,.245,.28,.34,.40,.435,.47,.505,.54,.60,.66,.695,.73,.765,.80,.9,1];
  for(const p of points){await scrollToProgress(page,'[data-cinema]',p);await settleVideo(page,item,p);await capture(page,item,'cinema-'+String(Math.round(p*1000)).padStart(4,'0'));
   const state=await inspect(page);
   if([0,.34,.60,.9].includes(p)){const index=[0,.34,.60,.9].indexOf(p);assert(!state.chapters[index].inert&&Number(state.chapters[index].opacity)>.99,'Reading hold must expose its chapter');}
   if([.21,.47,.73].includes(p))assert(state.chapters.every(c=>c.inert&&Number(c.opacity)<.01),'Principal sweeps must keep copy cleared');
  }
  for(const p of [.90,.60,.34,0]){await scrollToProgress(page,'[data-cinema]',p);await settleVideo(page,item,p);await capture(page,item,'reverse-'+Math.round(p*100));}
  // Real-time pass, capturing state on each scroll step without waiting for seeks.
  for(let i=0;i<=60;i++){const p=i/60;await scrollToProgress(page,'[data-cinema]',p);await delay(75);item.temporal.push({kind:'forward',p,...await inspect(page)});}
  for(const p of [.2,.75,.45,.98,.07,.6]){await scrollToProgress(page,'[data-cinema]',p);await delay(50);item.temporal.push({kind:'interrupted',p,...await inspect(page)});}
  await settleVideo(page,item,.6);await capture(page,item,'interrupted-settled');
  for(const p of [0,.2,.5,.8,1]){await scrollToProgress(page,'[data-horizontal]',p);await delay(150);await capture(page,item,'rail-'+Math.round(p*100));}
  await page.evaluate(()=>{const el=document.querySelector('[data-horizontal]');scrollTo(0,scrollY+el.getBoundingClientRect().bottom+100)});
  await delay(150);await capture(page,item,'rail-released');
  for(const p of [1,.5,0]){await scrollToProgress(page,'[data-horizontal]',p);await delay(100);await capture(page,item,'rail-reverse-'+Math.round(p*100));}
  await page.locator('.studio-v2').scrollIntoViewIfNeeded();await capture(page,item,'studio');
  await page.locator('.site-footer').scrollIntoViewIfNeeded();await capture(page,item,'footer');
 });
 for(const [name,viewport] of [['mobile',{width:390,height:844}],['tablet',{width:768,height:1024}],['short',{width:1440,height:600}]]){
  await scenario(name,{viewport},async(page,item)=>{
   await capture(page,item,'opening');
   for(const id of ['clarity','craft','possibility']){await page.locator('#'+id).scrollIntoViewIfNeeded();await capture(page,item,id);}
   const panels=page.locator('[data-horizontal-panel]');for(let i=0;i<await panels.count();i++){await panels.nth(i).scrollIntoViewIfNeeded();await capture(page,item,'project-'+i);}
   await page.locator('.studio-v2').scrollIntoViewIfNeeded();await capture(page,item,'studio');
  });
 }
 await scenario('reduced',{reducedMotion:'reduce'},async(page,item)=>{
  await capture(page,item,'opening');
  for(const id of ['clarity','craft','possibility']){await page.locator('#'+id).scrollIntoViewIfNeeded();await capture(page,item,id);}
  const panels=page.locator('[data-horizontal-panel]');for(let i=0;i<await panels.count();i++){await panels.nth(i).scrollIntoViewIfNeeded();await capture(page,item,'project-'+i);}
  await page.locator('.site-footer').scrollIntoViewIfNeeded();await capture(page,item,'footer');
 });
 await scenario('live-reduced',{},async(page,item)=>{
  await page.waitForFunction(()=>document.querySelector('[data-cinema]')?.classList.contains('cinema-enhanced'),null,{timeout:25000});
  await scrollToProgress(page,'[data-cinema]',.60);await settleVideo(page,item,.60);
  await page.emulateMedia({reducedMotion:'reduce'});await staticComplete(page);
  await capture(page,item,'normal-flow-after-preference-change');
  assert(await page.locator('[data-cinema-video]').evaluate(v=>v.paused),'Reduced motion must pause video');
 });
 await scenario('blocked-video',{blockedVideo:true},async(page,item)=>{
  await page.waitForFunction(()=>document.querySelector('[data-cinema]')?.dataset.mediaStatus==='error',null,{timeout:20000});
  await staticComplete(page);await capture(page,item,'fallback');
  assert(item.failedRequests.some(r=>r.expected),'A real video request must have been blocked');
 });
 for(const [name,viewport] of [['no-js-desktop',{width:1440,height:900}],['no-js-mobile',{width:390,height:844}]]){
  await scenario(name,{javaScriptEnabled:false,viewport},async(page,item)=>{
   await staticComplete(page);await capture(page,item,'opening');
   await page.locator('#craft').scrollIntoViewIfNeeded();await capture(page,item,'craft');
   assert(await page.locator('.no-js-nav').isVisible(),'No-JS navigation must remain available');
   await page.locator('.no-js-nav a[href$="/contact/"]').click();await page.waitForURL('**/contact/');
   assert(await page.locator('[data-enquiry-form] [type=submit]').isDisabled(),'No-JS form must not submit data');
  });
 }
 await scenario('routes-and-filter',{reducedMotion:'reduce'},async(page,item)=>{
  for(const route of ['services','studio','work','contact']){
   await page.locator('.desktop-nav a[href$="/'+route+'/"]').click();await page.waitForURL('**/'+route+'/');
   assert(await page.locator('main h1').isVisible(),route+' heading missing');await capture(page,item,route);
  }
  await page.locator('.desktop-nav a[href$="/work/"]').click();await page.waitForURL('**/work/');
  const total=await page.locator('[data-project-category]').count();assert(total>=3,'Project collection missing');
  await page.locator('[data-filter="Identity"]').click();
  const visible=page.locator('[data-project-category]:visible');
  assert.equal(await visible.count(),1);assert.match(await page.locator('.filter-announcement').textContent(),/1 project shown/);
  await page.locator('[data-filter="All"]').click();assert.equal(await visible.count(),total);
  const links=await page.locator('.project-art').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));
  for(const href of links){await page.locator('.project-art[href="'+href+'"]').click();await page.waitForURL(base+href);assert(await page.locator('h1').isVisible());await capture(page,item,'project-'+href.split('/').filter(Boolean).at(-1));await page.locator('.back-link').click();await page.waitForURL('**/work/');}
 });
 await scenario('mobile-menu',{viewport:{width:390,height:844},hasTouch:true},async(page,item)=>{
  const toggle=page.locator('.menu-toggle');
  await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert(await page.locator('.mobile-menu').isVisible());
  await capture(page,item,'open');await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert(await toggle.evaluate(e=>e===document.activeElement));
  await toggle.click();await page.locator('.mobile-menu a[href$="/work/"]').click();await page.waitForURL('**/work/');
  await toggle.click();await page.locator('.mobile-menu a').first().focus();await page.setViewportSize({width:1440,height:900});
  await page.waitForFunction(()=>document.querySelector('.mobile-menu').hidden);
  assert(await page.evaluate(()=>Boolean(document.activeElement?.closest('.desktop-nav'))),'Resize must preserve visible navigation focus');
  await capture(page,item,'desktop-focus-restored');
 });
 await scenario('local-enquiry',{},async(page,item)=>{
  await page.goto(base+'/contact/',{waitUntil:'domcontentloaded'});
  const form=page.locator('[data-enquiry-form]');
  await form.locator('[name=name]').fill('   ');await form.locator('[name=email]').fill('qa@example.test');await form.locator('[name=message]').fill('   ');
  await form.locator('[type=submit]').click();assert(await page.locator('[data-enquiry-result]').isHidden(),'Blank brief must be rejected');
  const before=item.network.length;
  await form.locator('[name=name]').fill('QA Reviewer');await form.locator('[name=company]').fill('Test project');
  await form.locator('[name=message]').fill('Synthetic browser QA brief. No real enquiry.');await form.locator('[type=submit]').click();
  assert(await page.locator('[data-enquiry-result]').isVisible());assert.match(await page.locator('[data-enquiry-text]').inputValue(),/QA Reviewer/);
  assert.match(await page.locator('[data-enquiry-status]').textContent(),/Nothing has been sent/);
  assert(await page.locator('#enquiry-title').evaluate(e=>e===document.activeElement),'Result heading must receive focus');
  const downloadPromise=page.waitForEvent('download');await page.locator('[data-download-enquiry]').click();const download=await downloadPromise;
  const file=path.join(output,'synthetic-enquiry.txt');await download.saveAs(file);assert.match(await fs.readFile(file,'utf8'),/Synthetic browser QA/);
  const later=item.network.slice(before);assert(later.every(r=>['GET','HEAD'].includes(r.method)),'Brief must not POST');
  assert(!later.some(r=>/QA%20Reviewer|qa%40example|Synthetic/.test(r.url)),'Brief content must not enter network URLs');await capture(page,item,'local-result');
 });
 await scenario('anchors-history',{},async(page,item)=>{
  await page.goto(base+'/#craft',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const e=document.querySelector('#craft');const r=e?.getBoundingClientRect();return e&&!e.inert&&Number(getComputedStyle(e).opacity)>.99&&r.bottom>0&&r.top<innerHeight},null,{timeout:25000});
  await capture(page,item,'direct-craft');
  const heading=page.locator('#craft h2');assert(await heading.isVisible());
  const nav=await page.locator('.desktop-nav a[href$="/services/"]').boundingBox();await page.mouse.click(nav.x+nav.width/2,nav.y+nav.height/2);await page.waitForURL('**/services/');
  await page.goBack({waitUntil:'domcontentloaded'});await page.waitForURL('**/#craft');
  await page.waitForFunction(()=>{const e=document.querySelector('#craft');return e&&!e.inert&&Number(getComputedStyle(e).opacity)>.99},null,{timeout:25000});
  await capture(page,item,'back-to-craft');await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const e=document.querySelector('#craft');return e&&!e.inert&&Number(getComputedStyle(e).opacity)>.99},null,{timeout:25000});
  await capture(page,item,'refreshed-craft');
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('[data-cinema]')?.classList.contains('cinema-enhanced'),null,{timeout:25000});
  await scrollToProgress(page,'[data-cinema]',.60);await settleVideo(page,item,.60);await delay(250);await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('[data-cinema]')?.classList.contains('cinema-enhanced'),null,{timeout:25000});
  await settleVideo(page,item,.60);await capture(page,item,'restored-progress');
 });
 await scenario('horizontal-focus',{},async(page,item)=>{
  const links=page.locator('[data-horizontal-panel] .work-panel-art');
  assert(await links.count()>=3,'Expected project destinations in rail');
  await links.nth(2).focus();
  await page.waitForFunction(()=>{const e=document.activeElement;const r=e?.getBoundingClientRect();return e?.closest('[data-horizontal-panel]')&&r.left>=-1&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight},null,{timeout:10000});
  await capture(page,item,'third-project-focused');
  await page.keyboard.press('Tab');assert(await page.evaluate(()=>!document.activeElement?.closest('[inert]')),'Focus must not enter inert content');
 });

}finally{await browser.close();report.finished=new Date().toISOString();report.summary={total:report.scenarios.length,passed:report.scenarios.filter(s=>s.capture==='COMPLETED').length,failed:report.scenarios.filter(s=>s.capture==='FAILED').length};await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({output,...report.summary,visualReview:report.visualReview}));if(report.summary.failed||!report.summary.total)process.exitCode=1;}