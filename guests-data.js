const GUESTS_RAW = `id	firstName	lastName	partyId	partyLabel
sample-001	Marcos	Villeda	party-marcos-valeria	Marcos & Valeria
sample-002	Valeria	Sandoval	party-marcos-valeria	Marcos & Valeria
`;

function tryRepairMojibake(value) {
    if (!value) return '';
    const text = String(value).trim();
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

function parseGuests() {
    const rows = GUESTS_RAW
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (rows.length < 2) return [];

    const headers = rows[0].split('\t').map(header => header.trim());

    return rows.slice(1).map((row, index) => {
        const cols = row.split('\t');
        const record = {};

        headers.forEach((header, headerIndex) => {
            record[header] = normalizeValue(cols[headerIndex] || '');
        });

        const firstName = record.firstName || '';
        const lastName = record.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const baseId = record.id || slugify(fullName) || `guest-${index + 1}`;
        const partyId = record.partyId || slugify(record.partyLabel || fullName) || baseId;

        return {
            id: baseId,
            firstName,
            lastName,
            fullName,
            partyId,
            partyLabel: record.partyLabel || fullName
        };
    });
}

const GUESTS = parseGuests();
