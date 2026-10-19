/** About is semantic HTML first. The isolated object is its only generated art. */
export function renderAbout({url, escape, link, breadcrumb, image, content, assets}) {
  const s = content.studio;
  const lines = value => escape(value).replace(/\n/g, '<br>');
  if (!assets.images['about-computer']) {
    throw new Error('About page requires the registered transparent computer asset.');
  }
  const object = image('about-computer', 'A floating white vintage computer and keyboard', '', true, '(max-width: 767px) 90vw, 40vw');
  const binary = Array.from({length:24}, (_,col) => `<span style="--column:${col};--offset:${(col*7)%11}">${Array.from({length:40},(_,row)=>((col*17+row*13+row*col)%7)<3?'1':'0').join(' ')}</span>`).join('');
  return `<div class="about-page" data-about>
    <section class="about-hero" aria-labelledby="about-title" data-about-hero>
      <div class="about-topline">${breadcrumb('studio')}<span class="about-mono">Est. ${escape(content.company.founded)} / South Africa</span></div>
      <div class="about-hero-grid">
        <h1 id="about-title" aria-label="${escape(s.hero.title)}"><span class="about-human">Human</span><span class="about-behind">behind the</span><span class="about-code">code<span class="about-period">.</span></span></h1>
        <figure class="about-computer" data-about-object>${object}</figure>
        <div class="about-intro"><span class="about-mono">${escape(s.label)}</span><p>${escape(s.hero.intro)}</p></div>
      </div>
      <div class="about-hero-bottom"><span class="about-mono">${escape(s.hero.note)}</span><a href="#our-story">Meet the minds <span aria-hidden="true">↓</span></a></div>
      <div class="about-binary-edge" aria-hidden="true">01001110<br>01110101<br>00100000<br>01001100<br>01100001<br>01100010<br>01110011</div>
    </section>
    <section class="about-story" id="our-story" aria-labelledby="about-story-title" data-about-story>
      <div class="about-binary" aria-hidden="true" data-about-binary>${binary}</div>
      <div class="about-story-top"><span class="about-mono">01 / The people behind it</span><span aria-hidden="true">[ 0 → 1 ]</span></div>
      <h2 id="about-story-title">${lines(s.origin.title)}</h2>
      <div class="about-story-copy"><p class="about-lead">${escape(s.origin.body)}</p><p>${escape(s.origin.detail)}</p></div>
      <div class="about-story-foot"><span>Software is what we build.<br>Curiosity is where it starts.</span><span class="about-mono">Nu Labs / Since 2023</span></div>
    </section>
    <section class="about-values" aria-labelledby="about-values-title" data-about-values>
      <div class="about-values-stage" data-about-values-stage>
        <div class="about-section-heading"><div><span class="about-mono">02 / How we think</span><h2 id="about-values-title">The way<br> we’re wired.</h2></div><p>Three ideas.<br>One shared direction.</p></div>
        <div class="about-values-window"><div class="about-values-track" data-about-values-track>
          ${s.values.map((v,i)=>`<article class="about-value"><div class="about-value-top"><span class="about-mono">0${i+1}</span><h3>${escape(v.title)}</h3></div><div class="about-value-art about-value-art-${i}" aria-hidden="true">${i===1?'<span>Design</span><b>&</b><span>Engineering</span>':`<span>${escape(v.word)}</span>`}</div><p>${escape(v.body)}</p></article>`).join('')}
        </div></div>
        <div class="about-values-bottom"><span class="about-mono" data-about-progress-label>01 / 03</span><span class="about-progress" aria-hidden="true"><i data-about-progress></i></span><span>Curiosity. Collaboration. Craft.</span></div>
      </div>
    </section>
    <section class="about-remote" aria-labelledby="about-remote-title">
      <div class="about-remote-title"><span class="about-mono">03 / Connected by the work</span><h2 id="about-remote-title">${lines(s.remote.title)}</h2></div>
      <div class="about-remote-grid"><div class="about-location-art" aria-hidden="true"><div class="about-cross about-cross-one">+</div><div class="about-cross about-cross-two">+</div><div class="about-cross about-cross-three">+</div><span class="about-location-name">Fourways<span>South Africa</span></span><span class="about-location-caption">Our base. Our point of connection.</span><div class="about-orbit"></div></div><div class="about-remote-copy"><p>${escape(s.remote.body)}</p><p class="about-belief">${escape(s.remote.belief)}</p><dl class="about-facts"><div><dt>Registered business</dt><dd>${escape(content.company.legal_name)}</dd></div><div><dt>Founded</dt><dd>${escape(content.company.founded)}</dd></div><div><dt>Based in</dt><dd>${escape(content.company.base)}</dd></div><div><dt>How we work</dt><dd>Online, with a remote team</dd></div></dl></div></div>
    </section>
    <section class="about-end"><span class="about-mono">The next possibility</span><a class="about-end-link" href="${url('/contact/')}"><span>${lines(s.closing.title)}</span><span aria-hidden="true">↗</span></a><div><p>${escape(s.closing.body)}</p>${link('/contact/',s.closing.link)}</div></section>
  </div>`;
}
