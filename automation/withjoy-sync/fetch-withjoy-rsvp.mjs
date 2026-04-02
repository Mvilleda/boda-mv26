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
  'text=Export All Guests',
  '[role="menuitem"]:has-text("Export All Guests")',
  'button:has-text("Export All Guests")',
  'a:has-text("Export All Guests")',
  'text=Export',
  'button:has-text("Export")',
  'a:has-text("Export")',
  '[role="menuitem"]:has-text("Export")',
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

function normalizeGuestsUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.pathname.includes('/edit/guests')) {
      return url.toString();
    }
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      url.pathname = `/${segments[0]}/edit/guests`;
      url.search = '';
      url.hash = '';
      return url.toString();
    }
  } catch {
    // fall through
  }
  return rawUrl;
}

async function waitForGuestUiReady(page, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const frames = page.frames();
    for (const frame of frames) {
      const hasControls = await frame.evaluate(() => {
        const controls = document.querySelectorAll('button, a, [role="button"]');
        return controls.length > 0;
      }).catch(() => false);
      if (hasControls) {
        return;
      }
    }
    await page.waitForTimeout(1000);
  }
}

async function collectControlsAcrossFrames(page) {
  const all = [];
  for (const frame of page.frames()) {
    const frameControls = await frame.evaluate(() =>
      [...document.querySelectorAll('button, a, [role="button"]')]
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 80),
          ariaLabel: el.getAttribute('aria-label'),
          title: el.getAttribute('title') || '',
          testid: el.getAttribute('data-testid'),
        }))
        .filter(el => el.text || el.ariaLabel || el.title)
    ).catch(() => []);
    if (frameControls.length > 0) {
      all.push({ frameUrl: frame.url(), controls: frameControls });
    }
  }
  return all;
}

async function clickVisibleInAnyFrame(page, selector, timeoutMs = 1000) {
  for (const frame of page.frames()) {
    const locator = frame.locator(selector).first();
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) continue;
    try {
      await locator.click({ timeout: timeoutMs });
      return true;
    } catch {
      // try next frame
    }
  }
  return false;
}

async function prepareExportUi(page) {
  const dismissSelectors = [
    'button:has-text("Done")',
    'button:has-text("Close")',
    'button:has-text("Skip")',
    'button:has-text("Not now")',
    'button:has-text("Maybe later")',
    '[aria-label*="close" i]',
  ];

  for (const selector of dismissSelectors) {
    const clicked = await clickVisibleInAnyFrame(page, selector, 1500);
    if (clicked) {
      console.log(`[ui] dismissed blocking control with selector: ${selector}`);
      await page.waitForTimeout(500);
    }
  }

  const menuOpenSelectors = [
    'button:has-text("More")',
    'button:has-text("Actions")',
    '[aria-label*="more" i]',
    '[aria-label*="actions" i]',
    '[data-testid*="more"]',
    '[data-testid*="action"]',
  ];

  for (const selector of menuOpenSelectors) {
    const clicked = await clickVisibleInAnyFrame(page, selector, 1500);
    if (clicked) {
      console.log(`[ui] opened menu with selector: ${selector}`);
      await page.waitForTimeout(500);
    }
  }
}

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

  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
  console.log(`[login] success - URL: ${page.url()}`);
  await screenshot(page, 'withjoy-03-after-login.png');

  // Step 4: Navigate to guests page
  const guestsUrl = normalizeGuestsUrl(afterLoginUrl);
  if (guestsUrl && guestsUrl !== process.env.WITHJOY_LOGIN_URL) {
    console.log(`[guests] navigating to: ${guestsUrl}`);
    try {
      await page.goto(guestsUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (error) {
      console.warn(`[guests] navigation timeout, continuing with current page state: ${error.message}`);
    }

    await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});

    if (page.url().includes('login') || page.url().includes('auth0')) {
      await screenshot(page, 'withjoy-04-rsvp-redirect.png');
      throw new Error(`Redirected to login when opening guests page - URL: ${page.url()}`);
    }
  }

  console.log(`[guests] URL: ${page.url()}`);
  if (!page.url().includes('/edit/guests')) {
    const forcedGuestsUrl = normalizeGuestsUrl(page.url());
    if (forcedGuestsUrl !== page.url()) {
      console.log(`[guests] forcing canonical guests route: ${forcedGuestsUrl}`);
      await page.goto(forcedGuestsUrl, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
    }
  }

  console.log(`[guests] final URL: ${page.url()}`);
  await screenshot(page, 'withjoy-04-guests-page.png');
  await waitForGuestUiReady(page);
  await prepareExportUi(page);

  let download;
  for (const selector of exportSelectorCandidates) {
    for (const frame of page.frames()) {
      const locator = frame.locator(selector).first();
      const isVisible = await locator.isVisible().catch(() => false);
      if (isVisible) {
        try {
          [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 45000 }),
            locator.click()
          ]);
          console.log(`Clicked export control using selector: ${selector} in frame: ${frame.url() || 'main'}`);
          break;
        } catch {
          // Try next frame/selector candidate
        }
      }
    }
    if (download) break;
  }

  if (!download) {
    const controls = await collectControlsAcrossFrames(page);
    console.log('[export] visible controls by frame:\n' + JSON.stringify(controls, null, 2));
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
