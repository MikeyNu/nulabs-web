document.documentElement.classList.add('js');

const cinema = document.querySelector('[data-cinema]');
const horizontal = document.querySelector('[data-horizontal]');
// Interior routes do not download the cinema runtime. The homepage preloads its
// modules; ordinary HTML remains usable if enhancement cannot be loaded.
if (cinema || horizontal) import('./journey-v2.mjs').then(({CINEMA_TIMELINE,initCinema,initHorizontal}) => {
  if (cinema) {
    let landings = null;
    try { landings = JSON.parse(cinema.dataset.cinemaLandings || 'null'); } catch { /* Static fallback. */ }
    initCinema(cinema, {timeline:{...CINEMA_TIMELINE,landings,fps:Number(cinema.dataset.cinemaFps)}});
  }
  if (horizontal) initHorizontal(horizontal);
  scheduleHeader();
}).catch(() => { /* Complete normal-flow content remains available. */ });
const header = document.querySelector('.site-header');
const cinemaStage = cinema?.querySelector('[data-cinema-stage]');
let headerFrame = 0;
function updateHeader() {
  headerFrame = 0;
  // Keep the header on the shared video until its pinned stage releases.
  // Static/mobile layouts retain their normal scrolling navigation treatment.
  const hasPinnedJourney = cinemaStage && cinema.classList.contains('cinema-enhanced');
  const showBackground = hasPinnedJourney
    ? cinema.getBoundingClientRect().bottom <= cinemaStage.getBoundingClientRect().height
    : scrollY > 40;
  header?.classList.toggle('is-scrolled', showBackground);
}
function scheduleHeader() {
  if (!headerFrame) headerFrame = requestAnimationFrame(updateHeader);
}
addEventListener('scroll', scheduleHeader, {passive:true});
addEventListener('resize', scheduleHeader, {passive:true});
addEventListener('pageshow', scheduleHeader);
if (cinemaStage && 'ResizeObserver' in window) {
  // Enhancement, pause, media failure and reduced motion can change the
  // journey's size without a scroll event. Measure again after that layout.
  const headerLayoutObserver = new ResizeObserver(scheduleHeader);
  headerLayoutObserver.observe(cinema);
  headerLayoutObserver.observe(cinemaStage);
}
updateHeader();

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.mobile-menu');
const mobile = matchMedia('(max-width: 767px)');
function setMenu(open, returnFocus = false) {
  if (!menuButton || !menu) return;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('span').textContent = open ? 'Close' : 'Menu';
  menu.hidden = !open;
  if (returnFocus) menuButton.focus();
}
menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header') && menuButton?.getAttribute('aria-expanded') === 'true') setMenu(false);
});
menu?.addEventListener('focusout', event => {
  if (event.relatedTarget && !menu.contains(event.relatedTarget) && event.relatedTarget !== menuButton) setMenu(false);
});
mobile.addEventListener('change', () => {
  if (mobile.matches) return;
  const focusedHref = menu?.contains(document.activeElement)
    ? document.activeElement.getAttribute('href') : null;
  setMenu(false);
  if (focusedHref) {
    const destination = [...document.querySelectorAll('.desktop-nav a')]
      .find(a => a.getAttribute('href') === focusedHref);
    (destination || document.querySelector('.home-link'))?.focus();
  }
});
window.addEventListener('pageshow', () => setMenu(false));

const filters = document.querySelector('.filter-bar');
if (filters) {
  filters.hidden = false;
  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    const category = button.dataset.filter;
    filters.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let visible = 0;
    document.querySelectorAll('[data-project-category]').forEach(card => {
      card.hidden = category !== 'All' && card.dataset.projectCategory !== category;
      if (!card.hidden) visible++;
    });
    const status = document.querySelector('.filter-announcement');
    if (status) status.textContent = `${visible} ${visible === 1 ? 'project' : 'projects'} shown.`;
  });
}

const form = document.querySelector('[data-enquiry-form]');
if (form) {
  form.querySelector('[type="submit"]').disabled = false;
  const result = form.querySelector('[data-enquiry-result]');
  const text = form.querySelector('[data-enquiry-text]');
  const status = form.querySelector('[data-enquiry-status]');
  const requiredTextFields = [form.elements.name, form.elements.message];
  for (const field of requiredTextFields) {
    field.addEventListener('input', () => field.setCustomValidity(''));
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const field of requiredTextFields) {
      field.setCustomValidity(field.value.trim() ? '' : 'Please complete this field.');
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    text.value = ['NU LABS / PROJECT ENQUIRY', '', `Name: ${data.get('name').trim()}`, `Email: ${data.get('email').trim()}`, `Company or project: ${data.get('company').trim() || 'Not specified'}`, `Interest: ${data.get('interest')}`, '', 'THE IDEA', data.get('message').trim()].join('\n');
    result.hidden = false;
    status.textContent = 'Prepared on your device. Nothing has been sent.';
    form.querySelector('#enquiry-title').focus();
  });
  form.querySelector('[data-copy-enquiry]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text.value); status.textContent = 'Enquiry copied.'; }
    catch { text.focus(); text.select(); status.textContent = 'Select and copy the enquiry above, or download the brief.'; }
  });
  form.querySelector('[data-download-enquiry]').addEventListener('click', () => {
    const objectUrl = URL.createObjectURL(new Blob([text.value], {type:'text/plain;charset=utf-8'}));
    const a = document.createElement('a');a.href = objectUrl;a.download = 'Nu-Labs-project-brief.txt';a.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    status.textContent = 'Brief download requested. Nothing has been sent.';
  });
}


// Editorial rhythm after the cinematic stage: a short image wipe and a sideways type entrance.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const studio = document.querySelector('.studio-v2');
if (studio && !motionPreference.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    if (!motionPreference.matches) {
      studio.querySelector('.studio-v2-heading em')?.animate(
        [{transform:'translateX(50px)',opacity:0},{transform:'translateX(0)',opacity:1}],
        {duration:650,easing:'cubic-bezier(.22,1,.36,1)'});
      studio.querySelector('.studio-v2-visual')?.animate(
        [{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)'}],
        {duration:800,easing:'cubic-bezier(.22,1,.36,1)'});
    }
    observer.disconnect();
  }, {threshold:.14});
  observer.observe(studio);
  motionPreference.addEventListener('change', () => {
    if (motionPreference.matches) studio.getAnimations({subtree:true}).forEach(animation => animation.finish());
  });
}
