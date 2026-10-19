/** Inspect the real staged imagery at desktop and mobile placement sizes. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=await import(pathToFileURL(path.resolve(process.env.NU_QA_PLAYWRIGHT)).href);
const browser=await chromium.launch({headless:true,executablePath:process.env.NU_QA_BROWSER_PATH});
const base=process.env.NU_QA_URL||'http://localhost:3000';
const out=path.join(root,'qa-output/showcase-placement');await fs.mkdir(out,{recursive:true});
const content=JSON.parse(await fs.readFile(path.join(root,'src/content/site.json'),'utf8'));
const report={visualReview:'NOT RUN',pages:[],errors:[]};
try {
 for (const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]) {
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  for (const project of content.work.projects) {
   const response=await page.goto(`${base}/work/${project.id}/`,{waitUntil:'networkidle'});
   assert.equal(response.status(),200);
   const cover=page.locator('.case-cover');
   await cover.evaluate(el=>window.scrollTo({top:scrollY+el.getBoundingClientRect().top-130,behavior:'instant'}));
   const image=cover.locator('img');await image.evaluate(i=>i.decode());
   await page.waitForTimeout(350);
   const asset=await image.evaluate(i=>({src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight,rect:{x:i.getBoundingClientRect().x,y:i.getBoundingClientRect().y,width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height},objectFit:getComputedStyle(i).objectFit}));
   assert(asset.src.includes(`/assets/solutions/${project.asset}-`)&&asset.src.endsWith('.webp'),'Expected staged photographic asset');
   // naturalWidth is density-corrected when srcset uses width descriptors.
   // The selected URL identifies the encoded variant; positive intrinsic size
   // confirms decode without incorrectly treating a 390px mobile image as absent.
   assert(asset.width>0&&asset.height>0,'Decoded web image missing');
   assert(/-(800|1600|2400)\.webp$/.test(asset.src),'Unexpected encoded image variant');
   assert.equal(asset.objectFit,'contain','Full device must remain uncropped');
   const flat=page.locator(`a[href="/assets/solutions/${project.asset}-ui.svg"]`);assert.equal(await flat.count(),1,'Full-detail UI inspection link missing');
   assert((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,'Document overflow');
   const filename=`${name}-${project.id}.jpg`;
   await page.screenshot({path:path.join(out,filename),type:'jpeg',quality:93});
   report.pages.push({viewport:name,route:`/work/${project.id}/`,asset,file:filename});
  }
  await page.goto(`${base}/work/`,{waitUntil:'networkidle'});
  for (const index of [0,1,3,5]) {
   const card=page.locator('.project-card').nth(index);await card.scrollIntoViewIfNeeded();
   await card.locator('img').evaluate(i=>i.decode());
   await page.screenshot({path:path.join(out,`${name}-grid-${index}.jpg`),type:'jpeg',quality:93});
  }
  await page.goto(base,{waitUntil:'networkidle'});await page.locator('.studio-v2').scrollIntoViewIfNeeded();
  await page.locator('.studio-v2-visual img').evaluate(i=>i.decode());
  await page.screenshot({path:path.join(out,`${name}-studio.jpg`),type:'jpeg',quality:93});
  await context.close();
 }
 assert.equal(report.errors.length,0);
 console.log(`PASS: ${report.pages.length} placed solution views, full-detail links, decoded images and viewport bounds. Visual inspection remains separate.`);
} finally {
 await browser.close();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
}
