import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const requiredEnv = ['WITHJOY_LOGIN_URL', 'WITHJOY_EMAIL', 'WITHJOY_PASSWORD'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

const emailSelector = process.env.WITHJOY_EMAIL_SELECTOR || 'input[type="email"]';
const passwordSelector = process.env.WITHJOY_PASSWORD_SELECTOR || 'input[type="password"]';
const submitSelector = process.env.WITHJOY_SUBMIT_SELECTOR || 'button[type="submit"]';
const afterLoginUrl = process.env.WITHJOY_RSVP_URL || process.env.WITHJOY_LOGIN_URL;
const exportButtonSelector = process.env.WITHJOY_EXPORT_BUTTON_SELECTOR || 'button:has-text("Export")';
const outputDir = process.env.WITHJOY_OUTPUT_DIR || path.resolve(process.cwd(), '..', '..');
const outputFile = path.resolve(outputDir, 'withjoy-rsvp.csv');

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();

try {
  await page.goto(process.env.WITHJOY_LOGIN_URL, { waitUntil: 'domcontentloaded' });
  await page.fill(emailSelector, process.env.WITHJOY_EMAIL);
  await page.fill(passwordSelector, process.env.WITHJOY_PASSWORD);

  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.click(submitSelector)
  ]);

  await page.goto(afterLoginUrl, { waitUntil: 'networkidle' });

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 45000 }),
    page.click(exportButtonSelector)
  ]);

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await download.saveAs(outputFile);
  console.log(`Saved WithJoy CSV to ${outputFile}`);
} finally {
  await browser.close();
}
