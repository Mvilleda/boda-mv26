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
        const partyMembers = guests.filter(guest => guest.partyId === selected.partyId);
        return { partyMembers, reason: 'ok' };
    }

    if (party) {
        const partyMembers = guests.filter(guest => guest.partyId === party);
        return { partyMembers, reason: partyMembers.length ? 'ok' : 'party-not-found' };
    }

    return { partyMembers: [], reason: 'missing-param' };
}

function renderError(message) {
    const root = document.getElementById('ticketRoot');
    root.innerHTML = `<div class="error-box">${escapeHtml(message)}</div>`;
}

function downloadCard(cardElement, filename) {
    html2canvas(cardElement, {
        backgroundColor: '#fdffff',
        scale: 2,
        useCORS: true
    }).then(canvas => {
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
            <h2 class="lookup-title">Find your tickets</h2>
            <p class="lookup-text">Type your first name and surname exactly as on the invite list.</p>
            <form class="lookup-form" id="lookupForm">
                <div class="lookup-field">
                    <label for="firstNameInput">First name</label>
                    <input id="firstNameInput" name="firstName" value="${escapeHtml(firstValue)}" autocomplete="given-name" required>
                </div>
                <div class="lookup-field">
                    <label for="lastNameInput">Last name</label>
                    <input id="lastNameInput" name="lastName" value="${escapeHtml(lastValue)}" autocomplete="family-name" required>
                </div>
                <div class="lookup-actions">
                    <button class="ticket-btn" type="submit">Find my tickets</button>
                </div>
            </form>
            <p class="lookup-help">If you have trouble accessing your tickets, please contact us directly.</p>
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
        const found = guests.filter(guest => normalizeForMatch(guest.fullName) === normalizedFullName);

        if (!found.length) {
            renderLookupForm(guests, {
                firstName,
                lastName,
                message: 'Name not found. Check spelling and accents, then try again.'
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
            message: 'We found multiple matches. Pick your name below.',
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
            'no-data': 'No guest list loaded yet.',
            'id-not-found': 'This ticket ID was not found.',
            'party-not-found': 'This party was not found.'
        };
        renderError(reasonText[result.reason] || 'Unable to load tickets.');
        return;
    }

    const partyMembers = result.partyMembers;
    const partyLabel = partyMembers[0].partyLabel;

    const root = document.getElementById('ticketRoot');
    root.innerHTML = `
        <section class="lookup-card">
            <h2 class="lookup-title">Need another ticket?</h2>
            <p class="lookup-text">Search by name to open another party.</p>
            <div class="lookup-actions">
                <a class="ticket-btn" href="tickets.html">Find by name</a>
            </div>
        </section>
        <div class="party-title">${escapeHtml(partyLabel)}</div>
        <div class="ticket-list" id="ticketList"></div>
        <p class="notice">Each guest has an individual ticket. Download only who will attend.</p>
    `;

    const list = document.getElementById('ticketList');

    partyMembers.forEach(guest => {
        const ticketUrl = buildTicketUrl(guest);
        const card = document.createElement('article');
        card.className = 'ticket-card';
        card.innerHTML = `
            <div class="ticket-main">
                <div class="ticket-brand">Marcos & Valeria · 24·10·2026</div>
                <h2 class="ticket-name">${escapeHtml(guest.fullName)}</h2>
                <p class="ticket-meta"><strong>Venue:</strong> Hacienda San Juan Pueblilla</p>
                <p class="ticket-meta"><strong>Access:</strong> 1 ticket = 1 guest</p>
                <div class="ticket-id">Ticket ID: ${escapeHtml(guest.id)}</div>
                <div class="ticket-actions">
                    <button class="ticket-btn js-download">Download ticket</button>
                    <button class="ticket-btn js-copy">Copy ticket link</button>
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
    const guests = await loadGuests();
    renderTickets(guests);
}

initTickets();
