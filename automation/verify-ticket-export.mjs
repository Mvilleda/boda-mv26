import { webkit as chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ticketUrl = 'http://localhost:8765/tickets.html?id=marcos-villeda-132';

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const consoleLines = [];
page.on('console', msg => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => consoleLines.push(`[pageerror] ${err.message}`));

page.on('requestfailed', r => consoleLines.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));
await page.goto(ticketUrl, { waitUntil: 'networkidle' });
try {
    await page.waitForSelector('.ticket-card', { timeout: 8000 });
} catch (_) {
    console.log('--- card not found, console so far ---');
    consoleLines.forEach(l => console.log(l));
    const html = await page.content();
    console.log('--- body snippet ---');
    console.log(html.slice(0, 2000));
    await browser.close();
    process.exit(1);
}
await page.waitForTimeout(1500);

const result = await page.evaluate(async () => {
    const card = document.querySelector('.ticket-card');
    const wm = card.querySelector('.ticket-watermark');
    const out = {
        cardFound: !!card,
        htmlToImage: typeof htmlToImage,
        toPng: typeof htmlToImage?.toPng,
        watermarkSrc: wm?.src,
        watermarkComplete: wm?.complete,
        watermarkNaturalWidth: wm?.naturalWidth,
        attempts: []
    };

    // Attempt 1 — mobile fallback (skipFonts, pixelRatio 1.5)
    try {
        const url = await htmlToImage.toPng(card, {
            backgroundColor: '#fdffff',
            pixelRatio: 1.5,
            skipFonts: true,
            filter: n => !n?.classList?.contains?.('ticket-actions')
        });
        out.attempts.push({ name: 'skipFonts/1.5', ok: true, length: url.length, head: url.slice(0, 40) });
    } catch (err) {
        out.attempts.push({
            name: 'skipFonts/1.5',
            ok: false,
            tag: Object.prototype.toString.call(err),
            str: String(err),
            msg: err?.message,
            targetSrc: err?.target?.src,
            targetTag: err?.target?.tagName
        });
    }

    // Attempt 2 — full quality with embedded fonts
    try {
        let css = '';
        try {
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules || []) {
                        if (rule.type === CSSRule.FONT_FACE_RULE && /Hello\s*Paris/i.test(rule.cssText)) {
                            css += rule.cssText + '\n';
                        }
                    }
                } catch (_) {}
            }
        } catch (_) {}
        const url = await htmlToImage.toPng(card, {
            backgroundColor: '#fdffff',
            pixelRatio: 2,
            ...(css ? { fontEmbedCSS: css } : { skipFonts: true }),
            filter: n => !n?.classList?.contains?.('ticket-actions')
        });
        out.attempts.push({ name: 'fontEmbed/2', ok: true, length: url.length, head: url.slice(0, 40), cssLen: css.length });
    } catch (err) {
        out.attempts.push({
            name: 'fontEmbed/2',
            ok: false,
            tag: Object.prototype.toString.call(err),
            str: String(err),
            msg: err?.message,
            targetSrc: err?.target?.src,
            targetTag: err?.target?.tagName
        });
    }
    return out;
});

console.log('--- console ---');
consoleLines.forEach(l => console.log(l));
console.log('--- result ---');
console.log(JSON.stringify(result, null, 2));

await browser.close();
