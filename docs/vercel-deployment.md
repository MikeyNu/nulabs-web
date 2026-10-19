# Vercel deployment

The repository is configured for static hosting. No framework migration, server process, database or dependency installation is required.

## Import settings

1. In Vercel, choose Add New > Project and import MikeyNu/nulabs-web.
2. Use the repository root as Root Directory, Other as Framework Preset, and main as Production Branch.
3. Select Node.js 24.x, the currently supported default. Local Node 26 remains compatible with the repository's >=20 requirement.
4. Keep the settings supplied by vercel.json: no install command, build command `npm test && npm run build && npm run check`, output directory `dist`.
5. Leave BASE_PATH unset. No environment variables are required for the current site.

The configuration is ready for hosting, but no Vercel project or deployment was created by this preparation. Importing main normally creates a production deployment. For review before launch, create a preview from a non-production branch first and retain deployment protection.

## Routing and assets

Every page has its own folder/index.html. trailingSlash preserves the existing canonical link structure. There is no catch-all SPA rewrite: missing pages must remain real 404s, served with the generated 404.html. JavaScript modules under /scripts/ receive an explicit JavaScript content type for nosniff compatibility. The browser-ready Higgsfield MP4 and all posters, fonts and logos are copied from public/ into dist/ during build.

No immutable cache policy is applied to reusable filenames. Vercel's static hosting defaults remain responsible for cache validation. Only dist is publicly served. .vercelignore excludes authoring archives and local QA from CLI uploads, while .gitignore excludes local project credentials and metadata.

## Before public launch

The ordinary build checks verify code and static output, not final business approval. Run `node scripts/check.mjs --release` separately. It currently fails for two documented reasons: media status remains candidate-review, and no real contact destination is configured. Resolve and verify those requirements before treating a hosted review as a completed launch. The form currently prepares a local brief and does not deliver enquiries.

After a deployment, verify /, /work/, /studio/, /services/, /contact/ and all three project detail URLs directly and on refresh. Check an unknown URL returns HTTP 404. Confirm /scripts/site.mjs is JavaScript, and the Higgsfield MP4 loads and supports byte-range seeking. Test all four chapter holds, forward and reverse scrubbing, transparent navigation until stage release, horizontal work panels, mobile and reduced-motion layouts. Hosted routing, range requests and headers still require this live verification.

## References

- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
