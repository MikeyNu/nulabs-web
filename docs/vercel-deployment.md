# Vercel deployment

The repository is configured for static hosting. No framework migration, server process, database or dependency installation is required.

## Import settings

1. In Vercel, choose Add New > Project and import MikeyNu/nulabs-web.
2. Use the repository root as Root Directory, Other as Framework Preset, and main as Production Branch.
3. Select Node.js 24.x, the currently supported default. Local Node 26 remains compatible with the repository's >=20 requirement.
4. Keep the settings supplied by vercel.json: no install command, build command `npm test && npm run build && npm run check`, output directory `dist`.
5. Leave BASE_PATH unset. Keep Vercel system environment variables enabled so VERCEL_ENV / VERCEL_TARGET_ENV distinguish preview and production builds. The verified canonical origin is stored in src/content/media.json; SITE_URL is an optional override, not a required variable.

The connected nulabs-web project serves https://www.nulabs.co.za; nulabs.co.za redirects to www with HTTP 308, verified on 19 October 2026. The original deployment preparation did not create this project. A push to the linked production branch normally starts a production build. For review work, use a non-production branch and retain deployment protection. Preview builds emit noindex and an empty sitemap; rebuild for production instead of promoting preview-built files unchanged.

## Routing and assets

Every page has its own folder/index.html. trailingSlash preserves the existing canonical link structure. There is no catch-all SPA rewrite: missing pages must remain real 404s, served with the generated 404.html. JavaScript modules under /scripts/ receive an explicit JavaScript content type for nosniff compatibility. The browser-ready Higgsfield MP4 and all posters, fonts and logos are copied from public/ into dist/ during build.

No immutable cache policy is applied to reusable filenames. Vercel's static hosting defaults remain responsible for cache validation. Only dist is publicly served. .vercelignore excludes authoring archives and local QA from CLI uploads, while .gitignore excludes local project credentials and metadata.

## Before public launch

The ordinary build checks verify code and static output, not final business approval. Run `node scripts/check.mjs --release` separately. It currently fails for two documented reasons: media status remains candidate-review, and no real contact destination is configured. Resolve and verify those requirements before treating a hosted review as a completed launch. The form currently prepares a local brief and does not deliver enquiries.

After a deployment, verify /, /work/, /studio/, /services/, /contact/ and all six solution detail URLs directly and on refresh. Check an unknown URL returns HTTP 404. Confirm /scripts/site.mjs is JavaScript, and the Higgsfield MP4 loads and supports byte-range seeking. Test all four chapter holds, forward and reverse scrubbing, transparent navigation until stage release, horizontal work panels, mobile and reduced-motion layouts. Hosted routing, range requests and headers still require this live verification.

## Search verification

Confirm /robots.txt and /sitemap.xml return HTTP 200. The production sitemap must contain exactly eleven www.nulabs.co.za canonical URLs, excluding 404 and retired concept routes. Verify production pages have no noindex header or meta rule, and preview pages do. Check the root/apex redirect, canonical tags, Open Graph images and JSON-LD on the deployed HTML. Submit the sitemap in the verified Search Console property when account access is available. See [the SEO audit](seo-audit.md) for the configuration rules and test record.

## References

- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
