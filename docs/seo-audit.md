# Nu Labs SEO audit and implementation

Audit date: 19 October 2026. Baseline: commit `21475d6`, public site `https://www.nulabs.co.za/`. Scope: all eleven pages, generated HTML, HTTP routing, images, internal links, social previews, structured data and mobile loading. This is an engineering/content audit, not a search-ranking forecast or a claim of Google index coverage.

## Findings and repairs

| Area | Observed baseline | Implemented result |
| --- | --- | --- |
| Production identity | Vercel confirms www.nulabs.co.za; apex responds with HTTP 308 to www | Verified www HTTPS origin stored in media.json; retained existing domain redirect |
| Page titles | Eleven unique titles, several broad descriptions | Specific service/search intent in all eleven titles |
| Search descriptions | One description repeated across all eleven pages | Eleven unique, accurate descriptions stored beside page copy |
| Canonicals | Absent on every page | Absolute, trailing-slash canonical per page, in initial HTML |
| Crawl discovery | robots.txt and sitemap.xml both HTTP 404 | Generated robots file and XML sitemap containing exactly eleven canonical pages |
| Indexing controls | No HTML-level preview or 404 policy | Preview, custom review environments and 404 marked noindex; production remains indexable |
| Structured data | None | Organization, WebSite, typed WebPage, visible breadcrumbs and supported Service descriptions |
| Sharing | No Open Graph or Twitter metadata | Page-specific metadata; seven branded 1200 × 630 PNG cards and 512 × 512 logo |
| Content relationships | Main navigation and solution grid; limited service-to-solution paths | Visible breadcrumbs, service-to-solution links, related solutions and return links to the service scope |
| Service clarity | Mainly editorial direction and illustrative interface notes | Plain-language descriptions of ERP, CRM, POS, native apps, AI and security development, preserving concept labels |
| Hero loading | Mobile also fetched the 69,104-byte desktop arrival poster | Both poster elements use the same responsive candidates, eliminating that extra desktop request at the tested mobile viewport |
| Interior loading | Every page imported both motion modules | Motion runtime imported only when a cinema/gallery exists; homepage preloads its module dependencies |
| Image selection | Shared 70vw size hint even for half-width cards or full-width covers | Half-width default; full-width/eager primary solution covers; existing WebP photography retained |
| Regressions | Build check covered markup/resources, not SEO | Build now checks actual emitted metadata, schema, robots, sitemap, previews and social-file dimensions |

The site already had useful foundations: static semantic HTML, a single main heading per page, normal anchor links, HTTPS, real HTTP 404 responses, local fonts with font-display:swap, image dimensions and responsive WebP variants. These were preserved. The subsequent main-branch change `0798eec` restoring the hero intro to “A meeting point for design and technology.” was also retained. The cinematic hero remains a decorative background with real HTML text, not a purported indexable video article.

## Page intent

These are editorial targets based on the founder-confirmed services. No keyword-volume, competitive-position or ranking data was available, so none is invented.

| Route | Primary purpose |
| --- | --- |
| / | Nu Labs custom software development and business systems |
| /services/ | Development services, UI/UX, integrations and delivery process |
| /work/ | Explore the six software solution areas |
| /work/erp/ | ERP software development, operational workflows and integration |
| /work/crm/ | CRM development and customer workflows |
| /work/pos/ | POS development and retail system requirements |
| /work/mobile/ | Native Android and iOS app development |
| /work/ai/ | Business chatbots, assistants and automation |
| /work/cybersecurity/ | Cybersecurity application development and investigation workflows |
| /studio/ | Who Nu Labs is and how design and engineering work together |
| /contact/ | Prepare a software project brief, with honest local-only behaviour |

Keep these purposes distinct when editing. Expand pages with useful, verified product or delivery information, not repeated keywords. The current /work/ routes are retained to preserve links; changing a useful existing URL merely to insert a keyword is unnecessary.

## Configuration and maintenance

- `src/content/site.json`: `meta_title` and `meta_description` for top-level pages and each solution. `overview`, `service_name`, `service_id`, `related` and `solution_ids` connect visible content and service markup. Descriptions summarize the actual page; character counts are editing aids, not Google guarantees.
- `src/content/media.json`: `siteUrl` is the verified canonical origin, `https://www.nulabs.co.za`. Change it only for a deliberate domain move with matching redirects.
- `SITE_URL`: optional HTTPS origin override. Invalid URLs, paths, credentials, fragments and non-HTTPS origins fail early. Generated Vercel preview hostnames and Vercel's shortest-domain variable are deliberately not used as canonicals.
- `BASE_PATH`: optional validated subpath, used consistently in page, asset and sitemap URLs. Vercel production leaves this unset. A host serving the site under a subpath must also arrange its host-root robots.txt; a subpath file does not control the host.
- `VERCEL_ENV` / `VERCEL_TARGET_ENV`: non-production builds emit noindex and an empty sitemap. Custom preview environments also remain noindex. Keep Vercel system environment variables enabled and its preview protection in place.
- `SEO_NOINDEX=1`: explicit indexing hold, including for a non-Vercel staging build. `0` cannot override a Vercel preview's noindex policy. A missing production origin also prevents indexing.
- Preview robots.txt allows crawling so the HTML noindex can be read. Robots exclusions are not an access-control mechanism. Existing Vercel preview HTTP headers/protection provide another layer.
- `scripts/seo.mjs`: emits shared metadata, schema and crawl files. Canonicals, Open Graph URLs and sitemap entries use the same route/origin rules.
- `art/social/render.mjs`: editable HTML/CSS social layout, using the existing logos, Instrument Sans and website-specific device imagery. Re-render after changing its displayed copy/artwork. Exported PNGs are committed; Playwright is a QA/authoring dependency only, not part of the site build. Actual webpage photographs remain WebP and the flat UI studies remain editable SVG.
- `npm test`, `npm run build`, `npm run check`: normal Vercel build gates include SEO checks. Never publish a preview-built dist folder directly as production; rebuild with the production environment.

No fictional timestamps, crawl-frequency promises, ratings, prices, customer deployments, offices, certifications, social profiles or address details were added. FAQPage, Product/SoftwareApplication ratings and VideoObject markup would imply unsupported facts or unsuitable rich-result eligibility, so they are omitted. Service schema describes the confirmed service offering; it does not promise a dedicated Google rich result.

## Verification evidence

- Baseline live crawl: all eleven pages HTTP 200, one unique description, eleven unique titles, zero canonicals, zero JSON-LD graphs, zero Open Graph sets. Unknown path returned HTTP 404. robots.txt and sitemap.xml returned HTTP 404.
- Baseline mobile Lighthouse: performance **98**, accessibility **100**, SEO **100**, LCP **2.2 s**, CLS **0**, TBT **0 ms**. The basic SEO score did not detect the wider content/discovery gaps. This is one simulated lab run, not field Core Web Vitals or evidence of ranking.
- **79 unit tests passed**, including canonical validation, environment indexing rules, subpath behaviour, metadata escaping and service/breadcrumb integrity.
- Production and preview/subpath builds passed the generated-output checks. Preview was tested at `/preview/site` with VERCEL_ENV=preview, then the local dist folder was rebuilt for production.
- Browser SEO crawl: **11 routes with JavaScript disabled**; correct titles, descriptions, canonicals and schema; one H1 each; no orphan routes or mobile horizontal overflow; real unknown-route HTTP 404; robots/sitemap HTTP 200.
- Eight desktop/mobile rendered views plus linked-content captures checked; interior routes made no motion-module requests and the tested 390px/DPR1 mobile homepage made no redundant desktop-poster request.
- Social cards inspected as actual PNGs at full/reduced sizes; long Cybersecurity headline fits, device photographs remain uncropped, visible demo labels retained. Seven cards are 1200 × 630, 224–301 KB each; logo is 512 × 512.
- Local raw evidence is under `qa-output/seo/` and `qa-output/seo-motion/`, intentionally excluded from Git. Repeat with `npm run qa:seo` using the same NU_QA_* environment variables as the existing browser harness.

Eight existing interaction scenarios were exercised: desktop cinema, mobile, reduced motion, blocked video, routes/filter, mobile menu, local enquiry and anchors/history. Seven passed initially; routes/filter stopped on its obsolete .back-link selector after the new breadcrumb replaced that control. The selector now targets the accessible Breadcrumb > Solutions link. The isolated routes/filter rerun passed. These checks preserve the video/overlay behavior and navigation-background handoff; the hero video was not regenerated.

Google Rich Results Test and Search Console URL Inspection were not run. JSON-LD syntax, known property usage and agreement with visible content were checked locally, which does not certify a Google rich-result presentation.

## Remaining business and search work

1. **Configure a verified enquiry destination.** The current contact page only prepares a local brief. SEO cannot create a working sales handoff without a real destination; do not imply successful delivery until it exists and is tested.
2. **Verify Search Console and submit `https://www.nulabs.co.za/sitemap.xml`.** Search Console access was not available for this audit. Ownership, submitted-sitemap status, chosen canonicals, search impressions, queries and index coverage have not been inspected. Use URL Inspection on the homepage and representative solution pages after deployment.
3. **Add genuine business evidence when available.** Verified company/contact information, real product names, approved demonstrations, actual case studies and attributable results will provide useful substance beyond interface concepts. Only add city/service-area wording, Organization sameAs profiles or LocalBusiness information after confirming the facts.
4. **Monitor field results.** Review real-user Core Web Vitals and Search Console over time, then prioritize pages/queries with evidence. Lab scores, schema and a sitemap do not guarantee indexing, rich results, traffic or a ranking position.

The previously documented hero art-direction review status remains separate from this SEO pass.

## Primary references consulted

- Google: [Title links](https://developers.google.com/search/docs/appearance/title-link), [search snippets](https://developers.google.com/search/docs/appearance/snippet), [canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
- Google: [Sitemap construction](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [robots meta rules](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag), [JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
- Google: [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization), [site name](https://developers.google.com/search/docs/appearance/site-names), [breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb). [Schema.org Service](https://schema.org/Service).
- Google/web.dev: [LCP optimization](https://web.dev/articles/optimize-lcp), [video performance](https://web.dev/learn/performance/video-performance).
- Vercel: [System environment variables](https://vercel.com/docs/environment-variables/system-environment-variables), [preview indexing](https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines), [response headers](https://vercel.com/docs/headers/response-headers).
