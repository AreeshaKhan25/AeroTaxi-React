/**
 * Writes public/sitemap.xml from the public routes.
 * Runs as part of `npm run build`, so the sitemap can never drift from the app.
 *
 *   node scripts/generate-sitemap.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = (process.env.APP_URL ?? 'https://aerotaxi-uk.vercel.app').replace(/\/+$/, '');

/* Admin and the stateful booking steps are deliberately excluded. */
const PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/coverage', changefreq: 'weekly', priority: '0.9' },
  { path: '/help', changefreq: 'monthly', priority: '0.7' },
  { path: '/booking/lookup', changefreq: 'monthly', priority: '0.6' },
  { path: '/terms-of-service', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/privacy-statement', changefreq: 'yearly', priority: '0.3' },
  { path: '/cookie-policy', changefreq: 'yearly', priority: '0.3' },
];

const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(
  ({ path, changefreq, priority }) => `  <url>
    <loc>${ORIGIN}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
).join('\n')}
</urlset>
`;

writeFileSync(resolve(ROOT, 'public/sitemap.xml'), xml, 'utf8');
console.info(`[sitemap] ${PAGES.length} urls -> public/sitemap.xml (${ORIGIN})`);
