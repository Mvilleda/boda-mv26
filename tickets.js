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
    await Promise.all([
        document.fonts.load("400 16px 'HelloParisWeb'"),
        document.fonts.load("400 48px 'HelloParisWeb'"),
        document.fonts.load("400 16px 'Hello Paris'"),
        document.fonts.load("500 16px 'Cinzel'"),
        document.fonts.load("400 16px 'Crimson Pro'")
    ]);
    await document.fonts.ready;
}

/**
 * Returns the embedded `@font-face` CSS for Hello Paris. We try the
 * stylesheets that are already in the DOM first (so this works on
 * `file://` and offline, where `fetch()` is blocked), and only fall back
 * to `fetch()` if that's not possible.
 */
let ticketFontEmbedCssPromise;
function getTicketFontEmbedCSS() {
    if (ticketFontEmbedCssPromise) return ticketFontEmbedCssPromise;
    ticketFontEmbedCssPromise = (async () => {
        // 1. Walk the live stylesheets and collect every @font-face rule
        //    that mentions Hello Paris. This works without any network.
        const collected = [];
        for (const sheet of Array.from(document.styleSheets)) {
            let rules;
            try { rules = sheet.cssRules; } catch (e) { continue; }
            if (!rules) continue;
            for (const rule of Array.from(rules)) {
                if (rule.type === CSSRule.FONT_FACE_RULE) {
                    const text = rule.cssText || '';
                    if (/Hello\s*Paris/i.test(text)) collected.push(text);
                }
            }
        }
        if (collected.length) return collected.join('\n');

        // 2. Fallback: try fetching the inline-base64 file directly.
        try {
            const response = await fetch('fonts/hello-paris-inline.css');
            return await response.text();
        } catch (error) {
            return '';
        }
    })();
    return ticketFontEmbedCssPromise;
}

function formatError(error) {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error instanceof Event) {
        const target = error.target || {};
        const src = target.src ? ': ' + String(target.src).slice(0, 80) : '';
        return `image load failed (${target.tagName || 'resource'}${src})`;
    }
    if (error.message) return error.message;
    try { return JSON.stringify(error); } catch (_) { return String(error); }
}

function dataUrlToBlob(dataUrl) {
    const [header, base64] = dataUrl.split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

function triggerDownload(dataUrl, filename) {
    const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent) && !window.MSStream;

    // iOS Safari blocks programmatic downloads of large data URLs. Open the
    // image in a new tab so the user can long-press → "Save image".
    if (isIOS) {
        const blob = dataUrlToBlob(dataUrl);
        const blobUrl = URL.createObjectURL(blob);
        const win = window.open(blobUrl, '_blank');
        if (!win) {
            // Pop-up blocked — fall back to navigating the same tab.
            window.location.href = blobUrl;
        }
        // Revoke later so the new tab has time to load.
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        return;
    }

    // Other mobile browsers (Android Chrome) and desktop: blob URL + anchor
    // is the most compatible path.
    try {
        const blob = dataUrlToBlob(dataUrl);
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    } catch (error) {
        // Last-resort fallback to the original data URL.
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
    }
}

async function downloadCard(cardElement, filename) {
    if (typeof htmlToImage === 'undefined' || !htmlToImage.toPng) {
        throw new Error('Image library not loaded. Check your internet connection and try again.');
    }

    await ensureTicketFontsLoaded();
    await new Promise(resolve => requestAnimationFrame(() => resolve()));

    const fontEmbedCSS = await getTicketFontEmbedCSS();
    const baseOptions = {
        backgroundColor: '#fdffff',
        cacheBust: true,
        // Skip the action buttons in the export.
        filter: (node) => {
            if (!node || !node.classList) return true;
            return !node.classList.contains('ticket-actions');
        }
    };

    // Strategy 1 (best quality): pixelRatio 2 with the embedded font CSS.
    // Strategy 2 (mobile-safe fallback): skip the embedded fonts and drop
    //   pixelRatio to 1.5. iOS Safari has a hard limit on the size of an
    //   inline SVG inside a `<foreignObject>`; when the base64 font CSS is
    //   present the snapshot can blow past that limit and the internal
    //   image load rejects with an Event (which surfaces as "object Event").
    const attempts = [
        { ...baseOptions, pixelRatio: 2, ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }) },
        { ...baseOptions, pixelRatio: 1.5, skipFonts: true }
    ];

    let lastError;
    for (const options of attempts) {
        try {
            const dataUrl = await htmlToImage.toPng(cardElement, options);
            triggerDownload(dataUrl, filename);
            return;
        } catch (error) {
            lastError = error;
            console.warn('Ticket export attempt failed, retrying:', error);
        }
    }
    throw lastError || new Error('Unable to render the ticket image.');
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

        card.querySelector('.js-download').addEventListener('click', async (event) => {
            const btn = event.currentTarget;
            const originalLabel = btn.textContent;
            btn.disabled = true;
            btn.textContent = '…';
            try {
                await downloadCard(card, `${guest.id}-ticket.png`);
            } catch (error) {
                console.error('Ticket download failed:', error);
                alert('Download failed: ' + formatError(error));
            } finally {
                btn.disabled = false;
                btn.textContent = originalLabel;
            }
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
