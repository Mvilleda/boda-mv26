const ticketTranslations = {
    en: {
        pageTitle: 'digital tIckets | Marcos & Valeria',
        headerTitle: 'digital tIckets',
        headerSubtitle: 'Type your first name and surname to open your party tickets.',
        lookupTitle: 'digital tIckets',
        lookupText: 'Type your first name and surname exactly as on the invite list.',
        firstNameLabel: 'First name',
        lastNameLabel: 'Last name',
        findButton: 'Find my tickets',
        lookupHelp: 'If you have trouble accessing your tickets, please contact us directly.',
        notFoundMessage: 'Name not found. Check spelling and accents, then try again.',
        multipleMessage: 'We found multiple matches. Pick your name below.',
        needAnotherTitle: 'digital tIckets',
        needAnotherText: 'Search by name to open another party.',
        findByName: 'Find by name',
        notice: 'Each guest has an individual ticket. Download only who will attend.',
        venueLabel: 'Venue:',
        venueValue: 'Jardín de Cielo, Paraíso Palmira',
        accessLabel: 'Access:',
        accessValue: '1 ticket = 1 guest',
        ticketId: 'Ticket ID:',
        ticketUseNote: 'Present this QR code at the entrance. This ticket is personal and non-transferable.',
        downloadButton: 'Download ticket',
        copyButton: 'Copy ticket link',
        noData: 'No guest list loaded yet.',
        idNotFound: 'This ticket ID was not found.',
        partyNotFound: 'This party was not found.',
        notEligible: 'You need to RSVP first before downloading your ticket.',
        unknownError: 'Unable to load tickets.'
    },
    es: {
        pageTitle: 'digital tIckets | Marcos & Valeria',
        headerTitle: 'digital tIckets',
        headerSubtitle: 'Escribe tu nombre y apellido para abrir los boletos de tu grupo.',
        lookupTitle: 'digital tIckets',
        lookupText: 'Escribe tu nombre y apellido exactamente como aparecen en la lista.',
        firstNameLabel: 'Nombre',
        lastNameLabel: 'Apellido',
        findButton: 'Buscar mis boletos',
        lookupHelp: 'Si tienes problemas para acceder a tus boletos, contáctanos directamente.',
        notFoundMessage: 'No encontramos ese nombre. Revisa la ortografía e inténtalo de nuevo.',
        multipleMessage: 'Encontramos varias coincidencias. Elige tu nombre abajo.',
        needAnotherTitle: 'digital tIckets',
        needAnotherText: 'Busca por nombre para abrir otro grupo.',
        findByName: 'Buscar por nombre',
        notice: 'Cada invitado tiene un boleto individual. Descarga solo quienes asistirán.',
        venueLabel: 'Lugar:',
        venueValue: 'Jardín de Cielo, Paraíso Palmira',
        accessLabel: 'Acceso:',
        accessValue: '1 boleto = 1 invitado',
        ticketId: 'ID del boleto:',
        ticketUseNote: 'Presenta este codigo QR en el acceso. Este boleto es personal e intransferible.',
        downloadButton: 'Descargar boleto',
        copyButton: 'Copiar enlace del boleto',
        noData: 'Aún no se cargó la lista de invitados.',
        idNotFound: 'No encontramos ese ID de boleto.',
        partyNotFound: 'No encontramos ese grupo.',
        notEligible: 'Primero debes confirmar tu asistencia (RSVP) para descargar tu boleto.',
        unknownError: 'No fue posible cargar los boletos.'
    }
};

const ticketLanguage = (() => {
    const saved = localStorage.getItem('preferredLanguage');
    return saved === 'es' ? 'es' : 'en';
})();

function tt(key) {
    return ticketTranslations[ticketLanguage][key] || ticketTranslations.en[key] || '';
}

function updateHeaderLanguage() {
    document.documentElement.lang = ticketLanguage;
    document.title = tt('pageTitle');
    const headerTitle = document.getElementById('ticketHeaderTitle');
    const headerSubtitle = document.getElementById('ticketHeaderSubtitle');
    if (headerTitle) headerTitle.textContent = tt('headerTitle');
    if (headerSubtitle) headerSubtitle.textContent = tt('headerSubtitle');
}

function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return (params.get(key) || '').trim();
}

function normalizeForMatch(value) {
    const base = typeof normalizeValue === 'function' ? normalizeValue(value) : String(value || '').trim();
    return base
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function buildTicketUrl(guest) {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?id=${encodeURIComponent(guest.id)}`;
}

function findPartyMembers(guests) {
    const id = getQueryParam('id');
    const party = getQueryParam('party');

    if (!guests || !guests.length) {
        return { partyMembers: [], reason: 'no-data' };
    }

    if (id) {
        const selected = guests.find(guest => guest.id === id);
        if (!selected) return { partyMembers: [], reason: 'id-not-found' };
        const partyMembers = guests.filter(guest => guest.partyId === selected.partyId && guest.ticketEligible !== false);
        return { partyMembers, reason: partyMembers.length ? 'ok' : 'not-eligible' };
    }

    if (party) {
        const partyMembers = guests.filter(guest => guest.partyId === party && guest.ticketEligible !== false);
        return { partyMembers, reason: partyMembers.length ? 'ok' : 'not-eligible' };
    }

    return { partyMembers: [], reason: 'missing-param' };
}

function renderError(message) {
    const root = document.getElementById('ticketRoot');
    root.innerHTML = `<div class="error-box">${escapeHtml(message)}</div>`;
}

async function ensureTicketFontsLoaded() {
    if (!document.fonts || typeof document.fonts.load !== 'function') return;

    // Hello Paris is embedded as a base64 data URI in
    // fonts/hello-paris-inline.css. We force-load every weight/face we use
    // so document.fonts.ready actually waits for them.
    await Promise.all([
        document.fonts.load("400 16px 'HelloParisWeb'"),
        document.fonts.load("400 48px 'HelloParisWeb'"),
        document.fonts.load("400 16px 'Hello Paris'"),
        document.fonts.load("500 16px 'Cinzel'"),
        document.fonts.load("400 16px 'Crimson Pro'")
    ]);
    await document.fonts.ready;
}

// Loaded once per page: the base64 string for Hello Paris, extracted from the
// inline CSS file. We need the raw base64 so we can embed the @font-face
// inside an SVG (which is rasterised reliably across all browsers) without
// any external font fetch.
let helloParisBase64Promise;
function getHelloParisBase64() {
    if (helloParisBase64Promise) return helloParisBase64Promise;
    helloParisBase64Promise = (async () => {
        try {
            const response = await fetch('fonts/hello-paris-inline.css');
            const css = await response.text();
            const match = css.match(/base64,([A-Za-z0-9+/=]+)\)/);
            return match ? match[1] : null;
        } catch (error) {
            return null;
        }
    })();
    return helloParisBase64Promise;
}

/**
 * Build an SVG that contains the attendee name typed in Hello Paris (font
 * embedded inline as base64). Rasterise it through an <img> element to a
 * PNG data URL. Because the SVG is fully self-contained, the browser is
 * guaranteed to render it with the correct font before producing pixels —
 * regardless of html2canvas, Safari, or any @font-face quirks.
 */
async function rasteriseAttendeeName(nameEl, scale) {
    const text = (nameEl.textContent || '').trim();
    if (!text) return null;

    const styles = getComputedStyle(nameEl);
    const fontSizePx = parseFloat(styles.fontSize) || 42;
    const color = styles.color || '#4d638f';
    const transform = (styles.textTransform || 'none').toLowerCase();
    const rendered = transform === 'lowercase' ? text.toLowerCase()
        : transform === 'uppercase' ? text.toUpperCase()
        : text;

    const base64 = await getHelloParisBase64();

    // Measure roughly so the SVG canvas is large enough.
    const measure = document.createElement('canvas').getContext('2d');
    measure.font = `400 ${fontSizePx}px "HelloParisWeb", "Hello Paris", serif`;
    const metrics = measure.measureText(rendered);
    const ascent = metrics.actualBoundingBoxAscent || fontSizePx * 0.85;
    const descent = metrics.actualBoundingBoxDescent || fontSizePx * 0.25;
    const padding = Math.ceil(fontSizePx * 0.15);
    const cssWidth = Math.max(1, Math.ceil(metrics.width) + padding * 2);
    const cssHeight = Math.max(1, Math.ceil(ascent + descent) + padding * 2);

    const escaped = rendered
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const fontFaceRule = base64
        ? `@font-face{font-family:'TicketHelloParis';src:url(data:font/ttf;base64,${base64}) format('truetype');font-weight:400;font-style:normal;}`
        : '';
    const fontFamily = base64
        ? "'TicketHelloParis', 'HelloParisWeb', 'Hello Paris', serif"
        : "'HelloParisWeb', 'Hello Paris', serif";

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${cssWidth}" height="${cssHeight}" viewBox="0 0 ${cssWidth} ${cssHeight}">
  <defs><style type="text/css"><![CDATA[${fontFaceRule}]]></style></defs>
  <text x="${cssWidth / 2}" y="${padding + ascent}" font-family="${fontFamily}" font-size="${fontSizePx}" fill="${color}" text-anchor="middle" font-weight="400" style="font-kerning:normal;">${escaped}</text>
</svg>`;

    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
        const img = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = (err) => reject(err);
            image.src = svgUrl;
        });

        const outCanvas = document.createElement('canvas');
        outCanvas.width = Math.ceil(cssWidth * scale);
        outCanvas.height = Math.ceil(cssHeight * scale);
        const outCtx = outCanvas.getContext('2d');
        outCtx.imageSmoothingEnabled = true;
        outCtx.imageSmoothingQuality = 'high';
        outCtx.drawImage(img, 0, 0, outCanvas.width, outCanvas.height);

        return {
            dataUrl: outCanvas.toDataURL('image/png'),
            cssWidth,
            cssHeight
        };
    } finally {
        URL.revokeObjectURL(svgUrl);
    }
}

async function downloadCard(cardElement, filename) {
    await ensureTicketFontsLoaded();
    await new Promise(resolve => requestAnimationFrame(() => resolve()));

    const nameEl = cardElement.querySelector('.ticket-name');
    let restoreName = null;

    if (nameEl) {
        let baked = null;
        try {
            baked = await rasteriseAttendeeName(nameEl, 3);
        } catch (error) {
            baked = null;
        }
        if (baked) {
            const styles = getComputedStyle(nameEl);
            const placeholder = document.createElement('div');
            placeholder.className = 'ticket-name ticket-name-baked';
            placeholder.style.margin = styles.margin;
            placeholder.style.padding = styles.padding;
            placeholder.style.textAlign = styles.textAlign || 'center';
            placeholder.style.lineHeight = '0';
            const img = document.createElement('img');
            img.src = baked.dataUrl;
            img.alt = nameEl.textContent || '';
            img.style.display = 'inline-block';
            img.style.width = baked.cssWidth + 'px';
            img.style.height = baked.cssHeight + 'px';
            img.style.maxWidth = '100%';
            img.style.verticalAlign = 'middle';
            placeholder.appendChild(img);

            const parent = nameEl.parentNode;
            parent.insertBefore(placeholder, nameEl);
            nameEl.style.display = 'none';
            restoreName = () => {
                placeholder.remove();
                nameEl.style.display = '';
            };
        }
    }

    try {
        const canvas = await html2canvas(cardElement, {
            backgroundColor: '#fdffff',
            scale: 2,
            useCORS: true,
            ignoreElements: (element) => element.classList && element.classList.contains('ticket-actions')
        });

        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } finally {
        if (restoreName) restoreName();
    }
}

function copyLink(text) {
    navigator.clipboard.writeText(text).catch(() => {});
}

function renderLookupForm(guests, options = {}) {
    const root = document.getElementById('ticketRoot');
    const firstValue = options.firstName || '';
    const lastValue = options.lastName || '';
    const message = options.message || '';
    const matches = options.matches || [];

    const matchButtons = matches.map(guest => `
        <button class="ticket-btn js-match" data-id="${escapeHtml(guest.id)}">
            ${escapeHtml(guest.fullName)}
        </button>
    `).join('');

    root.innerHTML = `
        <section class="lookup-card">
            <h2 class="lookup-title">${tt('lookupTitle')}</h2>
            <p class="lookup-text">${tt('lookupText')}</p>
            <form class="lookup-form" id="lookupForm">
                <div class="lookup-field">
                    <label for="firstNameInput">${tt('firstNameLabel')}</label>
                    <input id="firstNameInput" name="firstName" value="${escapeHtml(firstValue)}" autocomplete="given-name" required>
                </div>
                <div class="lookup-field">
                    <label for="lastNameInput">${tt('lastNameLabel')}</label>
                    <input id="lastNameInput" name="lastName" value="${escapeHtml(lastValue)}" autocomplete="family-name" required>
                </div>
                <div class="lookup-actions">
                    <button class="ticket-btn" type="submit">${tt('findButton')}</button>
                </div>
            </form>
            <p class="lookup-help">${tt('lookupHelp')}</p>
            ${message ? `<p class="lookup-message">${escapeHtml(message)}</p>` : ''}
            ${matches.length ? `<div class="lookup-results">${matchButtons}</div>` : ''}
        </section>
    `;

    const form = document.getElementById('lookupForm');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const firstName = form.firstName.value;
        const lastName = form.lastName.value;
        const normalizedFullName = normalizeForMatch(`${firstName} ${lastName}`);
        const foundAll = guests.filter(
            guest => normalizeForMatch(guest.fullName) === normalizedFullName
        );
        const found = foundAll.filter(guest => guest.ticketEligible !== false);

        if (!foundAll.length) {
            renderLookupForm(guests, {
                firstName,
                lastName,
                message: tt('notFoundMessage')
            });
            return;
        }

        if (!found.length) {
            const declinedOnly = foundAll.length > 0 && foundAll.every(guest => guest.rsvpStatus === 'no');
            renderLookupForm(guests, {
                firstName,
                lastName,
                message: declinedOnly ? tt('notFoundMessage') : tt('notEligible')
            });
            return;
        }

        if (found.length === 1) {
            window.location.href = `tickets.html?id=${encodeURIComponent(found[0].id)}`;
            return;
        }

        renderLookupForm(guests, {
            firstName,
            lastName,
            message: tt('multipleMessage'),
            matches: found
        });
    });

    root.querySelectorAll('.js-match').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            window.location.href = `tickets.html?id=${encodeURIComponent(id)}`;
        });
    });
}

function renderTickets(guests) {
    const result = findPartyMembers(guests);

    if (result.reason !== 'ok') {
        if (result.reason === 'missing-param') {
            renderLookupForm(guests);
            return;
        }

        const reasonText = {
            'no-data': tt('noData'),
            'id-not-found': tt('idNotFound'),
            'party-not-found': tt('partyNotFound'),
            'not-eligible': tt('notEligible')
        };
        renderError(reasonText[result.reason] || tt('unknownError'));
        return;
    }

    const partyMembers = result.partyMembers;
    const partyLabel = partyMembers[0].partyLabel;

    const root = document.getElementById('ticketRoot');
    root.innerHTML = `
        <section class="lookup-card">
            <h2 class="lookup-title">${tt('needAnotherTitle')}</h2>
            <p class="lookup-text">${tt('needAnotherText')}</p>
            <div class="lookup-actions">
                <a class="ticket-btn" href="tickets.html">${tt('findByName')}</a>
            </div>
        </section>
        <div class="party-title">${escapeHtml(partyLabel)}</div>
        <div class="ticket-list" id="ticketList"></div>
        <p class="notice">${tt('notice')}</p>
    `;

    const list = document.getElementById('ticketList');

    partyMembers.forEach(guest => {
        const ticketUrl = buildTicketUrl(guest);
        const card = document.createElement('article');
        card.className = 'ticket-card';
        card.innerHTML = `
            <div class="ticket-main">
                <img class="ticket-watermark" src="images/M%20&%20V-03.png" alt="" aria-hidden="true">
                <div class="ticket-brand">Marcos & Valeria · 24·10·2026</div>
                <h2 class="ticket-name">${escapeHtml(guest.fullName || '')}</h2>
                <p class="ticket-meta"><strong>${tt('venueLabel')}</strong> ${tt('venueValue')}</p>
                <p class="ticket-meta"><strong>${tt('accessLabel')}</strong> ${tt('accessValue')}</p>
                <div class="ticket-id">${tt('ticketId')} ${escapeHtml(guest.id)}</div>
                <p class="ticket-use-note">${tt('ticketUseNote')}</p>
                <div class="ticket-actions">
                    <button class="ticket-btn js-download">${tt('downloadButton')}</button>
                    <button class="ticket-btn js-copy">${tt('copyButton')}</button>
                </div>
            </div>
            <div class="ticket-qr-wrap">
                <div class="qr-box" id="qr-${escapeHtml(guest.id)}"></div>
            </div>
        `;
        list.appendChild(card);

        const qrNode = card.querySelector(`#qr-${CSS.escape(guest.id)}`);
        new QRCode(qrNode, {
            text: ticketUrl,
            width: 96,
            height: 96,
            correctLevel: QRCode.CorrectLevel.M
        });

        card.querySelector('.js-download').addEventListener('click', () => {
            downloadCard(card, `${guest.id}-ticket.png`);
        });

        card.querySelector('.js-copy').addEventListener('click', () => {
            copyLink(ticketUrl);
        });
    });
}

async function initTickets() {
    updateHeaderLanguage();
    const guests = await loadGuests();
    renderTickets(guests);
}

initTickets();
