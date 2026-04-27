import { webkit } from 'playwright';

const browser = await webkit.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

// HOSTILE NETWORK SIMULATION:
// Intercept every image request and return an HTML 404 page with status 200.
// This reproduces the captive-portal / carrier-proxy scenario the user is hitting.
await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    if (request.resourceType() === 'image' || /\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(url)) {
        return route.fulfill({
            status: 200,
            contentType: 'text/html; charset=utf-8',
            body: '<!DOCTYPE html><html><head><title>Captured</title></head><body>Hijacked by hostile proxy</body></html>'
        });
    }
    return route.continue();
});

const consoleLines = [];
page.on('console', msg => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => consoleLines.push(`[pageerror] ${err.message}`));

await page.goto('http://localhost:8765/tickets.html?id=marcos-villeda-132', { waitUntil: 'networkidle' });
await page.waitForSelector('.ticket-card', { timeout: 8000 });
await page.waitForTimeout(1500);

const result = await page.evaluate(async () => {
    const card = document.querySelector('.ticket-card');
    const out = { attempts: [] };

    // Click the real download button. It will invoke the production
    // downloadCard pipeline (with the fetch shim) and surface any error.
    // We monkey-patch URL.createObjectURL + a.click to capture the data URL
    // size instead of triggering a real download.
    const btn = card.querySelector('.js-download');
    const originalClick = HTMLAnchorElement.prototype.click;
    const originalCreate = URL.createObjectURL;
    let capturedSize = 0;
    URL.createObjectURL = (blob) => {
        capturedSize = blob && blob.size ? blob.size : 0;
        return originalCreate.call(URL, blob);
    };
    HTMLAnchorElement.prototype.click = function () { /* no-op */ };

    // Catch the alert that downloadCard fires on failure.
    const originalAlert = window.alert;
    let alertText = null;
    window.alert = (msg) => { alertText = msg; };

    btn.click();
    // Wait for the async handler to settle.
    for (let i = 0; i < 80; i++) {
        await new Promise(r => setTimeout(r, 100));
        if (capturedSize > 0 || alertText) break;
    }

    URL.createObjectURL = originalCreate;
    HTMLAnchorElement.prototype.click = originalClick;
    window.alert = originalAlert;

    out.attempts.push({
        ok: capturedSize > 0,
        size: capturedSize,
        alertText
    });
    return out;
});

console.log('--- console ---');
consoleLines.forEach(l => console.log(l));
console.log('--- result ---');
console.log(JSON.stringify(result, null, 2));
await browser.close();
