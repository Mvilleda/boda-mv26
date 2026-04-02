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
const exportButtonSelector = process.env.WITHJOY_EXPORT_BUTTON_SELECTOR;
const exportSelectorCandidates = [
  ...(exportButtonSelector ? [exportButtonSelector] : []),
  'button:has-text("Export")',
  'a:has-text("Export")',
  'button:has-text("Download")',
  'a:has-text("Download")',
  '[aria-label*="Export"]',
  '[aria-label*="Download"]',
  'button[title*="Export"]',
  'button[title*="Download"]',
  '[data-testid*="export"]',
  '[data-testid*="download"]'
];
const outputDir = process.env.WITHJOY_OUTPUT_DIR || path.resolve(process.cwd(), '..', '..');
const outputFile = path.resolve(outputDir, 'withjoy-rsvp.csv');

async function screenshot(page, name) {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    const p = path.resolve(outputDir, name);
    await page.screenshot({ path: p, fullPage: true });
    console.log(`[screenshot] saved ${name}`);
  } catch (e) {
    console.warn(`[screenshot] failed: ${e.message}`);
  }
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page    = await context.newPage();

page.on('response', (response) => {
  const url = response.url();
  const lowerUrl = url.toLowerCase();
  if (/(googleadservices|doubleclick|analytics|bat\.js|segment|chameleon|chmln|pagead)/.test(lowerUrl)) {
    return;
  }

  const headers = response.headers();
  const contentType = (headers['content-type'] || '').toLowerCase();
  const contentDisposition = (headers['content-disposition'] || '').toLowerCase();
  const location = headers.location || '';
  const looksLikeDownload =
    /csv|octet-stream/.test(contentType) ||
    /attachment/.test(contentDisposition) ||
    /download|export|guest/.test(lowerUrl) ||
    Boolean(location);

  if (looksLikeDownload) {
    console.log(`[HTTP ${response.status()}] ${url}`);
    if (contentType) console.log(`  content-type: ${contentType}`);
    if (contentDisposition) console.log(`  content-disposition: ${contentDisposition}`);
    if (location) console.log(`  location: ${location}`);
  }
});

try {
  // Step 1: Load login page
  console.log(`[login] navigating to ${process.env.WITHJOY_LOGIN_URL}`);
  await page.goto(process.env.WITHJOY_LOGIN_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await screenshot(page, 'withjoy-01-login-loaded.png');
  console.log(`[login] URL after load: ${page.url()}`);

  // Step 2: Fill email; Auth0 may use two-step (email -> Continue -> password)
  console.log('[login] filling email...');
  await page.fill(emailSelector, process.env.WITHJOY_EMAIL);

  const pwVisible = await page.locator(passwordSelector).first().isVisible().catch(() => false);
  if (!pwVisible) {
    console.log('[login] password not visible yet - submitting email step first');
    await page.click(submitSelector);
    await page.waitForSelector(passwordSelector, { timeout: 10000 });
  }

  console.log('[login] filling password...');
  await page.fill(passwordSelector, process.env.WITHJOY_PASSWORD);
  await screenshot(page, 'withjoy-02-credentials-filled.png');

  // Step 3: Submit and wait for redirect away from login / auth0
  console.log('[login] submitting...');
  await page.click(submitSelector);

  try {
    await page.waitForFunction(
      () => !window.location.href.includes('login') && !window.location.href.includes('auth0'),
      { timeout: 30000 }
    );
  } catch {
    await screenshot(page, 'withjoy-03-login-timeout.png');
    throw new Error(`Login did not complete. URL: ${page.url()} - check WITHJOY_EMAIL / WITHJOY_PASSWORD / WITHJOY_LOGIN_URL.`);
  }

  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  console.log(`[login] success - URL: ${page.url()}`);
  await screenshot(page, 'withjoy-03-after-login.png');

  // Step 4: Navigate to guests page
  if (afterLoginUrl && afterLoginUrl !== process.env.WITHJOY_LOGIN_URL) {
    console.log(`[guests] navigating to: ${afterLoginUrl}`);
    await page.goto(afterLoginUrl, { waitUntil: 'networkidle', timeout: 30000 });

    if (page.url().includes('login') || page.url().includes('auth0')) {
      await screenshot(page, 'withjoy-04-rsvp-redirect.png');
      throw new Error(`Redirected to login when opening guests page - URL: ${page.url()}`);
    }
  }

  console.log(`[guests] URL: ${page.url()}`);
  await screenshot(page, 'withjoy-04-guests-page.png');

  let download;
  for (const selector of exportSelectorCandidates) {
    const locator = page.locator(selector).first();
    if (await locator.count() > 0 && await locator.isVisible()) {
      try {
        [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 45000 }),
          locator.click()
        ]);
        console.log(`Clicked export control using selector: ${selector}`);
        break;
      } catch {
        // Try next selector candidate
      }
    }
  }

  if (!download) {
    // Dump all buttons and links to help identify the correct selector
    const controls = await page.evaluate(() =>
      [...document.querySelectorAll('button, a')]
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 80),
          ariaLabel: el.getAttribute('aria-label'),
          title: el.title,
          testid: el.getAttribute('data-testid'),
        }))
        .filter(el => el.text || el.ariaLabel || el.title)
    );
    console.log('[export] visible controls:\n' + JSON.stringify(controls, null, 2));
    await screenshot(page, 'withjoy-05-export-debug.png');
    throw new Error(
      'Could not find export/download control. Review withjoy-05-export-debug.png and controls log above, then set WITHJOY_EXPORT_BUTTON_SELECTOR.'
    );
  }

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await download.saveAs(outputFile);
  console.log(`Saved WithJoy CSV to ${outputFile}`);
} finally {
  await browser.close();
}
