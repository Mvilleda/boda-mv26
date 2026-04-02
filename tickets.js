function getQueryParam(key) {
    const params = new URLSearchParams(window.location.search);
    return (params.get(key) || '').trim();
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

function findPartyMembers() {
    const id = getQueryParam('id');
    const party = getQueryParam('party');

    if (!GUESTS || !GUESTS.length) {
        return { partyMembers: [], reason: 'no-data' };
    }

    if (id) {
        const selected = GUESTS.find(guest => guest.id === id);
        if (!selected) return { partyMembers: [], reason: 'id-not-found' };
        const partyMembers = GUESTS.filter(guest => guest.partyId === selected.partyId);
        return { partyMembers, reason: 'ok' };
    }

    if (party) {
        const partyMembers = GUESTS.filter(guest => guest.partyId === party);
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

function renderTickets() {
    const result = findPartyMembers();

    if (result.reason !== 'ok') {
        const reasonText = {
            'no-data': 'No guest list loaded yet.',
            'id-not-found': 'This ticket ID was not found.',
            'party-not-found': 'This party was not found.',
            'missing-param': 'Open this page with ?id=guest-id (or ?party=party-id).'
        };
        renderError(reasonText[result.reason] || 'Unable to load tickets.');
        return;
    }

    const partyMembers = result.partyMembers;
    const partyLabel = partyMembers[0].partyLabel;

    const root = document.getElementById('ticketRoot');
    root.innerHTML = `
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

renderTickets();
