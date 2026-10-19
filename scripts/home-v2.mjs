export function renderHomeV2({ url, escape, link, image, projectArt, content, config, closing }) {
  const m = config.journey;
  const chapters = [
    {id:'arrival', name:'The idea', title:'Ideas made real.', image:'arrival'},
    {id:'clarity', name:'A clear direction', title:'Clarity before code.', image:'clarity'},
    {id:'craft', name:'Thought into form', title:'Built to work.', image:'craft'},
    {id:'possibility', name:'A wider perspective', title:'Make room for more.', image:'possibility'}
  ];
  const still = (c) => {
    const poster = m.chapterPosters?.find(p => p.id === c.id);
    if (!poster?.src || !poster?.mobileSrc || !poster.width || !poster.height) throw new Error('Missing chapter poster: ' + c.id);
    return `<img class="cinema-still" src="${url(poster.src)}" srcset="${url(poster.mobileSrc)} 960w, ${url(poster.src)} ${poster.width}w" sizes="100vw" width="${poster.width}" height="${poster.height}" alt="" ${c.id === 'arrival' ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
  };
  const cinema = `<div class="cinema" data-cinema data-cinema-landings="${escape(JSON.stringify(m.chapterTimes))}" data-cinema-fps="${escape(m.fps)}">
    <div class="cinema-stage" data-cinema-stage>
      <div class="cinema-media" aria-hidden="true">
        <img data-cinema-poster src="${url(m.poster)}" srcset="${url(m.mobilePoster)} 960w, ${url(m.poster)} 1920w" sizes="100vw" width="1920" height="1080" alt="" fetchpriority="high">
        <video data-cinema-video data-src="${url(m.video)}" muted playsinline preload="none" tabindex="-1" aria-hidden="true"></video>
      </div>
      <section class="cinema-chapter cinema-arrival" id="arrival" data-cinema-chapter="0" aria-labelledby="hero-title">
        ${still(chapters[0])}
        <h1 id="hero-title" class="cinema-title"><span>Ideas</span><span>made real.</span></h1>
        <p class="cinema-intro">A meeting point for<br>design and technology.</p>
        <p class="cinema-services"><span>Software.</span><span>Systems.</span><span>Native apps.</span></p>
        <a class="cinema-explore" href="#clarity">Explore what we build <span aria-hidden="true">↓</span></a>
      </section>
      <section class="cinema-chapter cinema-clarity" id="clarity" data-cinema-chapter="1" aria-labelledby="clarity-title">
        ${still(chapters[1])}
        <div class="cinema-copy">
          <span class="eyeline">01 / Understand the operation</span>
          <h2 id="clarity-title">Clarity<br>before code.</h2>
          <p>Map the process, the people and the decisions. Then build a system around the work that matters.</p>
          ${link('/services/#business-systems', 'Explore business systems')}
        </div>
        <span class="cinema-side-note" aria-hidden="true">Change the angle.<br>See the possibility.</span>
      </section>
      <section class="cinema-chapter cinema-craft" id="craft" data-cinema-chapter="2" aria-labelledby="craft-title">
        ${still(chapters[2])}
        <div class="cinema-copy">
          <span class="eyeline">02 / Design and engineering</span>
          <h2 id="craft-title">Built to<br><em>work.</em></h2>
          <p>ERP. CRM. POS. Native apps. A useful interface, backed by software built around your operation.</p>
          <div class="cinema-disciplines"><a href="${url('/services/#design')}">Design <span aria-hidden="true">↗</span></a><a href="${url('/services/#development')}">Development <span aria-hidden="true">↗</span></a></div>
        </div>
      </section>
      <section class="cinema-chapter cinema-possibility" id="possibility" data-cinema-chapter="3" aria-labelledby="possibility-title">
        ${still(chapters[3])}
        <div class="cinema-copy cinema-cut">
          <span class="eyeline">03 / Extend what is possible</span>
          <h2 id="possibility-title">Make room<br>for more.</h2>
          <p>AI assistants, connected workflows and cybersecurity tools. Useful capability, built into your business.</p>
          <a class="text-link" href="#selected-work">Explore our solutions <span class="arrow" aria-hidden="true">↘</span></a>
        </div>
      </section>
      <div class="cinema-controls">
        <span class="cinema-count"><span data-cinema-index>01</span><span>/ 04</span></span>
        <span class="cinema-meter" aria-hidden="true"><i data-cinema-progress></i></span>
        <button data-cinema-toggle type="button" hidden>Pause motion</button>
        <a href="#selected-work">Skip to solutions ↓</a>
      </div>
    </div>
  </div>`;
  const rail = `<section class="work-rail" id="selected-work" data-horizontal aria-labelledby="work-title">
    <div class="work-rail-stage" data-horizontal-stage>
      <div class="work-rail-top"><span>Software solutions / Nu Labs</span><span>Built around the way you work.</span></div>
      <div class="work-track" data-horizontal-track>
        <div class="work-intro" data-horizontal-panel>
          <span class="eyeline">Business needs. Working systems.</span>
          <h2 id="work-title">Real work.<br><em>Better<br>systems.</em></h2>
          <div class="work-intro-bottom"><p>Business systems. Native apps.<br>AI and cybersecurity.</p><span class="rail-arrow" aria-hidden="true">→</span></div>
        </div>
        ${content.home.work.project_ids.map(id => content.work.projects.find(p => p.id === id)).map((p,i)=>`<article class="work-panel" data-horizontal-panel>
          <div class="work-panel-number"><span>0${i+1}</span><span>${escape(p.discipline)}</span></div>
          <a class="work-panel-art" href="${url('/work/'+p.id+'/')}" aria-label="${escape(p.cta+': '+p.title)}">${projectArt(p.id)}<span class="work-panel-open" aria-hidden="true">↗</span></a>
          <div class="work-panel-meta"><div><span class="micro">${escape(p.status)}</span><h3><a href="${url('/work/'+p.id+'/')}">${escape(p.title)}</a></h3></div><p>${escape(p.subtitle)}</p></div>
        </article>`).join('')}
      </div>
      <div class="work-rail-bottom"><span><span data-horizontal-index>01</span> / 04</span><span class="work-rail-meter"><i data-horizontal-progress></i></span>${link('/work/', 'All six solutions')}</div>
    </div>
  </section>`;
  return `${cinema}${rail}
    <section class="studio-v2 section-pad" aria-labelledby="studio-v2-title">
      <div class="studio-v2-heading"><span class="eyeline">Software engineering + UI/UX</span><h2 id="studio-v2-title">Engineering depth.<br><em>Human understanding.</em></h2></div>
      <div class="studio-v2-layout">
        <figure class="studio-v2-visual">${image('solution-crm', 'CRM interface study with illustrative opportunities')}<figcaption>Website-specific interface study. Demo data.</figcaption></figure>
        <div class="studio-v2-copy"><span class="studio-v2-symbol" aria-hidden="true"><img src="${url('/assets/logo-symbol.svg')}" width="110" height="83" alt=""></span><h3>We design the experience.<br>We build the system.</h3><p>Our engineers and UI/UX designers connect the interface, the workflow and the software behind it. With a belief that Black creative and technical excellence deserves room to lead.</p>${link('/studio/', 'How we work')}<span class="studio-v2-footnote">Understand the problem.<br>Make the solution useful.</span></div>
      </div>
    </section>
    <section class="next-v2 section-pad"><span class="eyeline">Your next chapter</span><a class="next-v2-link" href="${url('/contact/')}"><span>What if<br>became <em>what’s next?</em></span><span class="next-v2-arrow" aria-hidden="true">↗</span></a><div class="next-v2-bottom"><p>Bring the process that needs fixing,<br>or the product you want to build.</p>${link('/contact/', 'Start a conversation')}</div></section>`;
}