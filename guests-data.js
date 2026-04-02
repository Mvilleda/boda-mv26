const GUESTS_RAW_FALLBACK = `first name	last name	party
Marcos	Villeda	Marcos & Valeria
Valeria	Sandoval	Marcos & Valeria
`;

const MOJIBAKE_REPLACEMENTS = {
    '√°': 'á',
    '√©': 'é',
    '√≠': 'í',
    '√≥': 'ó',
    '√∫': 'ú',
    '√Å': 'Á',
    '√‰': 'É',
    '√ç': 'Í',
    '√ì': 'Ó',
    '√ö': 'Ú',
    '√±': 'ñ',
    '√ë': 'Ñ'
};

function repairCommonMojibake(text) {
    let value = String(text);
    Object.entries(MOJIBAKE_REPLACEMENTS).forEach(([broken, fixed]) => {
        value = value.split(broken).join(fixed);
    });
    return value;
}

function normalizeHeader(header) {
    const key = normalizeValue(header)
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z]/g, '');

    if (key === 'firstname') return 'firstName';
    if (key === 'lastname') return 'lastName';
    if (key === 'party') return 'partyLabel';
    if (key === 'partyid') return 'partyId';
    if (key === 'partylabel') return 'partyLabel';
    if (key === 'id') return 'id';
    return header;
}

function tryRepairMojibake(value) {
    if (!value) return '';
    const text = repairCommonMojibake(String(value)).trim();
    if (!/[ÃÂâ]/.test(text)) return text;
    try {
        const bytes = Uint8Array.from([...text].map(char => char.charCodeAt(0)));
        const repaired = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        return repaired || text;
    } catch {
        return text;
    }
}

function normalizeValue(value) {
    return tryRepairMojibake(value).normalize('NFC').trim();
}

function slugify(value) {
    return normalizeValue(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function parseGuests(rawText) {
    const rows = rawText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (rows.length < 2) return [];

    const headers = rows[0].split('\t').map(header => normalizeHeader(header.trim()));

    return rows.slice(1).map((row, index) => {
        const cols = row.split('\t');
        const record = {};

        headers.forEach((header, headerIndex) => {
            record[header] = normalizeValue(cols[headerIndex] || '');
        });

        const firstName = normalizeValue(record.firstName || '');
        const lastName = normalizeValue(record.lastName || '');
        const fullName = `${firstName} ${lastName}`.trim();
        const baseId = record.id || `${slugify(fullName) || 'guest'}-${index + 1}`;
        const partyLabel = normalizeValue(record.partyLabel || fullName);
        const partyId = normalizeValue(record.partyId || partyLabel || baseId);

        return {
            id: baseId,
            firstName,
            lastName,
            fullName,
            partyId,
            partyLabel
        };
    });
}

async function loadGuests() {
    try {
        const response = await fetch('Guests?v=20260401a', { cache: 'no-store' });
        if (!response.ok) return parseGuests(GUESTS_RAW_FALLBACK);
        const text = await response.text();
        const normalized = text.trim();
        if (!normalized) return parseGuests(GUESTS_RAW_FALLBACK);
        return parseGuests(normalized);
    } catch {
        return parseGuests(GUESTS_RAW_FALLBACK);
    }
}
