import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out=path.join(root,'public/assets/solutions');
await fs.mkdir(out,{recursive:true});
const E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rect=(x,y,w,h,fill='#fff',r=0,stroke='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const text=(x,y,s,size=20,fill='#202721',weight=400)=>`<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${E(s)}</text>`;
const line=(x,y,x2,y2,color='#dce1db')=>`<path d="M${x} ${y}H${x2}" fill="none" stroke="${color}"/>`;
const icon=(x,y,type,color='#536052')=>{
 const d={grid:'M1 1h7v7H1z M13 1h7v7h-7z M1 13h7v7H1z M13 13h7v7h-7z',box:'M1 6l10-5 10 5v12l-10 5-10-5z M1 6l10 5 10-5 M11 11v12',users:'M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10 M1 23v-3a6 6 0 0 1 12 0v3 M16 5a4 4 0 0 1 0 8 M17 17a5 5 0 0 1 5 5',check:'M2 12l6 6L22 3',shield:'M11 1l10 4v7c0 6-10 11-10 11S1 18 1 12V5z',chevron:'M7 2l9 9-9 9',clock:'M22 11A10 10 0 1 1 2 11a10 10 0 0 1 20 0 M12 5v7l5 3',list:'M8 3h15 M8 11h15 M8 19h15 M1 3h1 M1 11h1 M1 19h1',plus:'M12 2v20 M2 12h20',chat:'M2 2h20v15H9l-7 6z',arrow:'M3 12h18 M14 5l7 7-7 7'}[type]||'M2 2h20v20H2z';
 return `<path d="${d}" transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
};
const badge=(x,y,s,w=110,bg='#edf1e8',fg='#354b30')=>rect(x,y,w,31,bg,15)+text(x+13,y+21,s,16,fg,600);
const nav=(items,active)=>rect(0,0,252,1000,'#eef0ea')+text(32,54,'nu / labs',29,'#162319',700)+text(32,86,'PRODUCT EXPLORATIONS',12,'#586354',600)+items.map(([s,i],n)=>rect(18,143+n*58,216,48,n===active?'#dbe2d3':'#eef0ea',8)+icon(33,154+n*58,i)+text(72,175+n*58,s,19,'#233121',n===active?600:400)).join('')+line(25,896,228,896)+text(32,936,'Illustrative UI',17,'#56624f')+text(32,962,'Demo data only',15,'#56624f');
const header=(label,title,desc,action)=>text(300,49,label.toUpperCase(),14,'#65705e',600)+text(300,108,title,40,'#162319',600)+text(302,147,desc,20,'#576351')+rect(1278,65,270,56,'#18281e',8)+text(1301,101,action,19,'#fff',600);
const metric=(x,label,value,note,w=292)=>rect(x,186,w,140,'#fff',10,'#dce1db')+text(x+24,222,label,17,'#5b6754')+text(x+24,274,value,38,'#203321',600)+text(x+24,305,note,15,'#53604d');
const section=(x,y,w,h,title,sub)=>rect(x,y,w,h,'#fff',10,'#dce1db')+text(x+24,y+43,title,23,'#203321',600)+(sub?text(x+24,y+74,sub,17,'#66705f'):'');
const row=(y,vals,widths=[330,610,900,1150])=>vals.map((v,i)=>text(widths[i],y,v,18)).join('');
const productIcon=(x,y,i)=>{
 const marks=[
  rect(20,4,67,98,'#526447',5)+rect(25,8,5,89,'#b9c4ac')+rect(38,28,35,3,'#d9e0d0')+rect(38,38,28,3,'#d9e0d0'),
  '<g transform="rotate(30 54 54)">'+rect(47,5,14,80,'#3c4f34',5)+rect(48,8,4,75,'#aeba9e',2)+'<path d="M47 85l7 19 7-19" fill="#7c876e"/><path d="M54 101v5" stroke="#253923" stroke-width="2"/></g>',
  '<path d="M23 32h62l8 70H15z" fill="#c4cdb4" stroke="#7c8c69" stroke-width="2"/><path d="M37 36V21a17 17 0 0 1 34 0v15" fill="none" stroke="#748563" stroke-width="5"/>',
  rect(25,18,58,84,'#647653',8)+rect(20,11,68,13,'#34492e',5)+rect(28,43,52,30,'#9fac8b',5),
  rect(14,8,81,94,'#fffdf4',4,'#99a58a')+rect(14,8,81,20,'#76886a',4)+[0,1,2].map(j=>[0,1,2].map(k=>rect(25+k*23,41+j*19,13,9,'#d9dfce',2)).join('')).join(''),
  rect(5,25,101,62,'#526648',7)+rect(17,39,31,20,'#b9c5a7',3)+rect(17,70,70,3,'#ccd7bb')
 ];return `<g transform="translate(${x} ${y})">${marks[i]}</g>`;
};
const screens={};
screens.erp=nav([['Overview','grid'],['Inventory','box'],['Orders','list'],['Purchasing','plus'],['People','users'],['Approvals','check']],0)+header('Operations / ERP','A clear view of today.','Inventory, orders and decisions in one workspace.','Review approvals')+
metric(300,'Orders to fulfil','24','Across 3 warehouses')+metric(614,'Stock alerts','07','Items below reorder level')+metric(928,'Awaiting approval','03','Purchase orders to review',620)+
section(300,354,1248,438,'Needs your attention','Prioritised exceptions, with a clear next action.')+
rect(323,456,1198,40,'#f0f3ec',5)+row(483,['Item / reference','Location','Status','Next action'])+
row(542,['Thermal receipt rolls','Johannesburg','Low stock','Reorder'])+line(324,569,1524,569)+
row(611,['PO-1042 / Packaging','Cape Town','Pending approval','Review order'])+line(324,639,1524,639)+
row(681,['ORD-2097 / Store supply','Durban','Ready to dispatch','Prepare shipment'])+line(324,710,1524,710)+
text(327,758,'Show all exceptions',18,'#355536',600)+icon(1455,739,'arrow')+
section(300,820,1248,134,'One process. A shared record.','Purchasing  /  Inventory  /  Orders  /  Reporting')+badge(1270,865,'DEMO DATA',151);
screens.crm=nav([['Pipeline','grid'],['Contacts','users'],['Activities','clock'],['Conversations','chat'],['Reports','list']],0)+header('Customer relationships / CRM','Keep the next step clear.','A practical sales workspace built around follow-through.','Add opportunity')+
metric(300,'Open opportunities','12','Demo pipeline')+metric(614,'Follow-ups today','05','Assigned across the team')+metric(928,'Waiting on a reply','03','Review recent activity',620)+
[['Qualified','04',[['Retail expansion','Arrange discovery','Today, 10:30'],['Service rollout','Confirm requirements','Today, 14:00']]],['Proposal','05',[['Warehouse workflow','Review scope','Tomorrow, 09:00'],['Support workspace','Send proposal','Tomorrow, 11:30']]],['Decision','03',[['Customer portal','Schedule walkthrough','Thursday, 15:00'],['Branch operations','Confirm next steps','Friday, 10:00']]]].map(([s,n,c],i)=>{
let x=300+i*424;return rect(x,358,400,594,'#edf0e8',10)+text(x+22,399,s,23,'#233621',600)+text(x+337,399,n,20,'#64705b')+c.map(([t,d,time],j)=>`<g transform="translate(0 ${j*228})">`+rect(x+14,429,372,210,'#fff',9)+text(x+36,467,t,23,'#1b2c1e',600)+text(x+36,501,'Illustrative opportunity',16,'#67735e')+line(x+36,522,x+346,522)+text(x+36,558,d,19)+icon(x+36,582,'clock')+text(x+70,601,time,16,'#52624b')+'</g>').join('')+text(x+24,926,`2 of ${Number(n)} shown`,16,'#64705b');}).join('');
screens.pos=nav([['Sale','grid'],['Products','box'],['Customers','users'],['Transactions','list'],['Shift','clock']],0)+header('Point of sale / POS','A considered checkout.','Find the item. Build the basket. Keep the queue moving.','Open register')+
rect(300,188,743,61,'#fff',8,'#ccd3c7')+text(324,227,'Search products or scan an item',21,'#65715f')+
[['All items',true],['Stationery',false],['Accessories',false]].map(([t,a],i)=>badge(300+i*185,267,t,170,a?'#223626':'#e8ede3',a?'#fff':'#4c5d43')).join('')+
[['Notebook','R85.00','box'],['Desk pen','R25.00','list'],['Canvas bag','R120.00','box'],['Travel mug','R160.00','box'],['Desk planner','R95.00','list'],['Gift card','R200.00','grid']].map(([t,p,ic],i)=>{let x=300+i%3*252,y=332+Math.floor(i/3)*273;return rect(x,y,235,249,'#fff',8,'#dce1db')+rect(x+16,y+16,203,144,'#ecefe6',5)+productIcon(x+61,y+33,i)+text(x+17,y+194,t,21,'#263b28',600)+text(x+17,y+226,p,20);}).join('')+
section(1074,188,474,764,'Current sale','Till 01 / Demonstration')+line(1098,291,1524,291)+text(1098,340,'Notebook',21,'#263b28',600)+text(1435,340,'R85.00',21)+text(1098,373,'Quantity  1',17,'#5e6c57')+line(1098,397,1524,397)+text(1098,442,'Desk pen',21,'#263b28',600)+text(1435,442,'R50.00',21)+text(1098,475,'Quantity  2',17,'#5e6c57')+line(1098,723,1524,723)+text(1098,772,'Total',25,'#1d3422',600)+text(1380,772,'R135.00',28,'#1d3422',600)+rect(1098,816,426,66,'#1b3223',8)+text(1226,858,'Take payment',21,'#fff',600)+text(1127,922,'Concept screen. No live transactions.',16,'#637159');
screens.ai=nav([['Assistant','chat'],['Knowledge','list'],['Conversations','users'],['Workflows','grid'],['Review queue','check']],0)+header('AI solutions / Assistant','Useful answers. Clear sources.','Knowledge retrieval, defined actions and human handoff.','Review sources')+
section(300,188,806,764,'Workspace assistant','Demonstration conversation')+
rect(504,312,566,90,'#e8ede2',10)+text(529,350,'What should happen when a return',21)+text(529,378,'arrives without its order number?',21)+
text(327,455,'ASSISTANT',14,'#4a6043',600)+text(327,497,'Start by locating the original sale.',24,'#193422',600)+
text(327,539,'Ask for the purchase date and store, then check',20)+text(327,571,'the permitted lookup options in the returns guide.',20)+
text(327,625,'If you cannot confirm the order, pass the case',20)+text(327,657,'to the support team before approving a return.',20)+
badge(327,703,'Source: Demo returns guide',338)+
rect(324,837,758,73,'#f6f7f2',9,'#ccd4c6')+text(346,880,'Ask a follow-up question',21,'#66765f')+icon(1028,860,'arrow')+
section(1132,188,416,764,'Knowledge & control','A defined information boundary')+
icon(1158,311,'list')+text(1195,332,'Demo returns guide',20,'#24412a',600)+text(1158,369,'Section 2 / Order verification',17,'#65735c')+line(1157,397,1523,397)+
text(1158,445,'Human review',22,'#233d28',600)+text(1158,485,'Uncertain answers stay visible.',18)+text(1158,516,'Exceptions go to a person.',18)+badge(1158,559,'Handoff available',226)+
text(1158,744,'ILLUSTRATIVE RESPONSE',13,'#617158',600)+text(1158,778,'Not a live assistant or policy.',17)+text(1158,809,'Every organisation sets its rules.',17);
screens.cyber=nav([['Overview','grid'],['Incidents','shield'],['Assets','box'],['Access','users'],['Activity','list']],1)+header('Cybersecurity / Triage','See the signal. Set the priority.','An incident workspace for investigation and response.','Open investigation')+
metric(300,'Needs investigation','03','Illustrative alerts')+metric(614,'Awaiting review','05','Assigned to an owner')+metric(928,'Monitored assets','128','Demonstration environment',620)+
section(300,356,760,596,'Investigation queue','Grouped by severity and next action.')+
[['Unusual sign-in pattern','Identity / Staff workspace','High','Review sign-in history'],['Endpoint policy change','Device / Operations laptop','Medium','Compare policy events'],['New privileged session','Access / Admin workspace','Medium','Verify session context']].map(([t,d,s,a],i)=>{let y=474+i*155;return text(327,y,t,24,'#253c28',600)+text(327,y+33,d,17,'#63745b')+badge(327,y+52,s,98,s==='High'?'#f6e6d7':'#e9ede1',s==='High'?'#734428':'#4c603d')+text(446,y+75,a,18)+line(327,y+109,1034,y+109);}).join('')+
section(1084,356,464,596,'Case / INC-042','Unusual sign-in pattern')+badge(1109,463,'Investigating',164)+text(1109,550,'Current step',16,'#63745b')+text(1109,587,'Verify the account activity',22,'#233e28',600)+text(1109,635,'Next: establish scope',18)+text(1109,670,'Then: choose response',18)+line(1109,714,1523,714)+text(1109,758,'Review context before action.',18)+text(1109,789,'Record evidence and ownership.',18)+text(1109,903,'Simulated incidents / Demo data',16,'#63745b');
screens.mobile=rect(0,0,768,1536,'#f5f6f0')+text(48,72,'9:41',28,'#1c301f',600)+rect(658,48,52,24,'none',5,'#263b27')+rect(662,52,38,16,'#263b27',2)+rect(712,55,4,10,'#263b27',1)+
text(48,159,'nu / labs',34,'#1b3321',700)+text(48,206,'FIELD WORK / DEMONSTRATION',17,'#5e6d55',600)+
text(48,286,'Ready for the day.',51,'#1b3321',600)+text(48,334,'Your next job, in one place.',25,'#53664b')+
rect(48,387,672,217,'#1e3828',20)+text(78,436,'TODAY',17,'#c9d7be',600)+text(78,512,'04',66,'#fff',600)+text(198,506,'scheduled visits',26,'#eef3e9')+text(78,564,'2 complete  /  1 underway  /  1 next',22,'#d6e3cb')+
text(48,676,'Up next',30,'#1b3321',600)+badge(551,642,'11:30',167)+
rect(48,715,672,414,'#fff',18,'#d5ddcc')+text(80,769,'Store equipment check',32,'#213d28',600)+text(80,815,'Johannesburg / Demo location',22,'#64775b')+line(80,852,688,852)+
icon(82,891,'list')+text(126,913,'Review job details',24)+icon(82,950,'box')+text(126,973,'Confirm required equipment',24)+
rect(80,1012,608,74,'#253f2c',12)+text(294,1061,'Open job',25,'#fff',600)+
rect(48,1170,672,118,'#e9eee1',14)+icon(79,1210,'check')+text(122,1214,'Notes saved on this device',23,'#30482a',600)+text(122,1251,'Illustrative offline state',19,'#5c7153')+
line(0,1354,768,1354)+['Today','Jobs','Messages','Profile'].map((s,i)=>icon(88+i*182,1387,['grid','list','chat','users'][i])+text(70+i*182,1455,s,20,i===0?'#1b3321':'#66775e',i===0?600:400)).join('')+rect(264,1501,240,7,'#253f2c',4);
for(const [id,body] of Object.entries(screens)){
 const w=id==='mobile'?768:1600,h=id==='mobile'?1536:1000;
 await fs.writeFile(path.join(out,`${id}-ui.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title"><title id="title">Nu Labs ${id.toUpperCase()} illustrative interface, demo data</title>${rect(0,0,w,h,'#f5f6f0')}${body}</svg>`);
}
await fs.writeFile(path.join(root,'art/product-ui/review.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nu Labs / Product UI review</title><style>*{box-sizing:border-box}body{margin:0;background:#eeeee8;color:#191e18;font:18px Arial,sans-serif}header{padding:60px 5vw 40px;border-bottom:1px solid #ccc}h1{font-size:64px;letter-spacing:-3px;margin:16px 0}header p{max-width:750px;line-height:1.5}main{padding:50px 5vw;display:grid;gap:60px}figure{margin:0}figcaption{display:flex;justify-content:space-between;margin-bottom:18px}img{display:block;width:100%;background:#ddd}figure:last-child img{width:min(500px,100%);margin:auto}small{font-size:14px}</style><header><small>NU LABS / SOFTWARE SHOWCASE / SCREEN STUDIES</small><h1>Built around the work.</h1><p>Six purpose-built interface concepts. These are exact, editable UI layers for the planned Higgsfield device scenes. Every value, company and event shown is illustrative.</p></header><main>${Object.keys(screens).map(id=>`<figure><figcaption><b>${id.toUpperCase()}</b><small>UI source / staged imagery pending</small></figcaption><img src="../../public/assets/solutions/${id}-ui.svg" alt="${id} concept interface"></figure>`).join('')}</main></html>`);
console.log('Created six deterministic UI masters and review board.');
