import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pw = process.env.NU_QA_PLAYWRIGHT || 'playwright';
const { chromium } = await import(path.isAbsolute(pw) ? pathToFileURL(pw).href : pw);
const browser = await chromium.launch({ headless: true, ...(process.env.NU_QA_BROWSER_PATH ? { executablePath: process.env.NU_QA_BROWSER_PATH } : {}) });
const out = path.join(root, 'private/showcase/screens');
await fs.mkdir(out, { recursive: true });
try {
  for (const id of ['erp', 'crm', 'pos', 'mobile', 'ai', 'cyber']) {
    const width = id === 'mobile' ? 768 : 1600;
    const height = id === 'mobile' ? 1536 : 1000;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 3 });
    await page.goto(pathToFileURL(path.join(root, 'public/assets/solutions', `${id}-ui.svg`)).href);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(out, `${id}.png`), type: 'png' });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log('Rendered six exact screen layers at 3x resolution.');
