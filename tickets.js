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
        document.fonts.load("400 16px 'Hello Paris'"),
        document.fonts.load("500 16px 'Cinzel'"),
        document.fonts.load("400 16px 'Crimson Pro'"),
        document.fonts.ready
    ]);

    // Retry once if the attendee name face is still unresolved in some browsers.
    if (typeof document.fonts.check === 'function') {
        const hasNameFace = document.fonts.check("400 16px 'HelloParisWeb'") || document.fonts.check("400 16px 'Hello Paris'");
        if (!hasNameFace) {
            await new Promise(resolve => setTimeout(resolve, 120));
            await Promise.all([
                document.fonts.load("400 16px 'HelloParisWeb'"),
                document.fonts.load("400 16px 'Hello Paris'")
            ]);
        }
    }
}

let ticketNameExportFontPromise;
function ensureTicketNameExportFont() {
    if (ticketNameExportFontPromise) return ticketNameExportFontPromise;

    ticketNameExportFontPromise = (async () => {
        if (typeof FontFace !== 'function' || !document.fonts) return;

        const fontUrl = new URL('fonts/HelloParis.ttf', window.location.href).href;
        const nameFont = new FontFace('TicketNameExport', `url(${fontUrl}) format('truetype')`, {
            weight: '400',
            style: 'normal'
        });
        const loaded = await nameFont.load();
        document.fonts.add(loaded);
        await document.fonts.load("400 16px 'TicketNameExport'");
    })().catch(() => {
        // Fallbacks already exist in CSS font stacks.
    });

    return ticketNameExportFontPromise;
}

function paintAttendeeName(canvas, cardElement) {
    const nameEl = cardElement.querySelector('.ticket-name');
    if (!nameEl) return;

    const cardRect = cardElement.getBoundingClientRect();
    const nameRect = nameEl.getBoundingClientRect();
    if (!cardRect.width || !cardRect.height || !nameRect.width) return;

    const styles = getComputedStyle(nameEl);
    const scaleX = canvas.width / cardRect.width;
    const scaleY = canvas.height / cardRect.height;

    const x = (nameRect.left - cardRect.left + (nameRect.width / 2)) * scaleX;
    const yTop = (nameRect.top - cardRect.top) * scaleY;
    const fontSize = parseFloat(styles.fontSize || '42') * scaleY;
    const lineHeightRaw = parseFloat(styles.lineHeight || '0');
    const lineHeight = (lineHeightRaw > 0 ? lineHeightRaw : parseFloat(styles.fontSize || '42') * 0.95) * scaleY;
    const lines = (nameEl.innerText || nameEl.textContent || '').split('\n').map(line => line.trim()).filter(Boolean);
    if (!lines.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = styles.color || '#4d638f';
    ctx.font = `${styles.fontStyle || 'normal'} ${styles.fontWeight || '400'} ${fontSize}px "TicketNameExport", "HelloParisWeb", "Hello Paris", serif`;

    lines.forEach((line, index) => {
        const baseline = yTop + (fontSize * 0.84) + (index * lineHeight);
        ctx.fillText(line, x, baseline);
    });
    ctx.restore();
}

async function downloadCard(cardElement, filename) {
    await ensureTicketFontsLoaded();
    await ensureTicketNameExportFont();

    // One more frame ensures browser applies the loaded faces before capture.
    await new Promise(resolve => requestAnimationFrame(() => resolve()));

    html2canvas(cardElement, {
        backgroundColor: '#fdffff',
        scale: 2,
        useCORS: true,
        ignoreElements: (element) => element.classList && element.classList.contains('ticket-actions')
    }).then(canvas => {
        paintAttendeeName(canvas, cardElement);
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
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
