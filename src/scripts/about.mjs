/** A finite horizontal chapter and scroll-driven object movement. No autoplay. */
export function initAbout(root) {
  if (!root) return;
  const hero = root.querySelector('[data-about-hero]');
  const object = root.querySelector('[data-about-object]');
  const story = root.querySelector('[data-about-story]');
  const binary = root.querySelector('[data-about-binary]');
  const rail = root.querySelector('[data-about-values]');
  const stage = root.querySelector('[data-about-values-stage]');
  const track = root.querySelector('[data-about-values-track]');
  const meter = root.querySelector('[data-about-progress]');
  const label = root.querySelector('[data-about-progress-label]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const spacious = matchMedia('(min-width: 1101px) and (min-height: 800px)');
  let frame = 0, disposed = false, enabled = false, travel = 0, progress = 0, activeIndex = 0, viewportWidth = 0, centres = [];
  const clamp = n => Math.min(1,Math.max(0,n));
  function render() {
    frame = 0;
    if (disposed || document.hidden || reduced.matches) return;
    // All measurements precede style writes, once per native scroll frame.
    const h = hero.getBoundingClientRect(), s = story.getBoundingClientRect();
    const r = enabled ? rail.getBoundingClientRect() : null;
    const heroProgress = clamp(-h.top / Math.max(1,h.height));
    const storyProgress = clamp((innerHeight-s.top) / (innerHeight+s.height));
    if (h.bottom > 0 && h.top < innerHeight && innerWidth > 767) {
      object.style.transform = `translate3d(0,${-heroProgress*38}px,0) rotate(${heroProgress*5}deg)`;
    }
    if (s.bottom > 0 && s.top < innerHeight) binary.style.setProperty('--binary-shift',`${storyProgress*110}px`);
    if (r) {
      progress = clamp((112-r.top) / Math.max(1,travel));
      track.style.setProperty('--about-rail-x',`${-progress*travel}px`);
      meter.style.setProperty('--about-progress',String(progress));
      const centre = progress*travel + viewportWidth/2;
      activeIndex = centres.reduce((best,value,index)=>Math.abs(value-centre)<Math.abs(centres[best]-centre)?index:best,0);
      label.textContent = `${String(1+activeIndex).padStart(2,'0')} / 03`;
    }
  }
  function schedule() {
    if (!frame && !disposed && !document.hidden && !reduced.matches) frame = requestAnimationFrame(render);
  }
  function reset() {
    enabled = false;
    rail.classList.remove('is-enhanced');
    rail.style.removeProperty('--about-rail-height');
    track.style.removeProperty('--about-rail-x');
    object.style.removeProperty('transform');
    binary.style.removeProperty('--binary-shift');
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function measure() {
    if (disposed) return;
    const wasActive = enabled && rail.getBoundingClientRect().top <= 112 && rail.getBoundingClientRect().bottom > innerHeight;
    const activeCard = activeIndex;
    reset();
    if (spacious.matches && !reduced.matches) {
      rail.classList.add('is-enhanced');
      viewportWidth = track.parentElement.clientWidth;
      travel = Math.max(0,track.scrollWidth-viewportWidth);
      const offset = track.children[0].offsetLeft;
      centres = [...track.children].map(card=>card.offsetLeft-offset+card.offsetWidth/2);
      if (travel > 1) {
        enabled = true;
        rail.style.setProperty('--about-rail-height',`${stage.getBoundingClientRect().height+travel}px`);
      } else reset();
    } else if (wasActive) {
      track.children[activeCard]?.scrollIntoView({block:'center',behavior:'instant'});
    }
    rail.dataset.motion = enabled ? 'horizontal' : 'normal-flow';
    schedule();
  }
  function visibility() {
    if (document.hidden) {if(frame)cancelAnimationFrame(frame);frame=0;} else schedule();
  }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',measure,{passive:true});
  addEventListener('pageshow',measure);
  document.addEventListener('visibilitychange',visibility);
  reduced.addEventListener('change',measure);
  spacious.addEventListener('change',measure);
  document.fonts?.ready.then(measure);
  measure();
  return {destroy() {
    disposed = true;reset();
    removeEventListener('scroll',schedule);removeEventListener('resize',measure);removeEventListener('pageshow',measure);
    document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',measure);spacious.removeEventListener('change',measure);
  }};
}
