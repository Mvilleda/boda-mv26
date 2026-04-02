import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const repoRoot = path.resolve(process.cwd(), '..', '..');
const guestsPath = path.resolve(repoRoot, 'Guests');
const csvPath = path.resolve(repoRoot, 'withjoy-rsvp.csv');
const outputPath = path.resolve(repoRoot, 'rsvp-status.json');

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
  let value = String(text || '');
  for (const [broken, fixed] of Object.entries(MOJIBAKE_REPLACEMENTS)) {
    value = value.split(broken).join(fixed);
  }
  return value;
}

const normalize = (value) => String(value || '')
  .normalize('NFC')
  .trim();

const normalizeFixed = (value) => repairCommonMojibake(value)
  .normalize('NFC')
  .trim();

const normKey = (value) => normalizeFixed(value)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9 ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function findValue(row, keys) {
  const entries = Object.entries(row);
  const hit = entries.find(([k]) => keys.includes(normKey(k)));
  return hit ? normalizeFixed(hit[1]) : '';
}

function mapStatus(raw) {
  const value = normKey(raw);
  if (['yes', 'attending', 'accept', 'accepted', 'going', 'si', 'sí'].some((s) => value.includes(s))) return 'yes';
  if (['no', 'declined', 'not attending', 'cannot attend'].some((s) => value.includes(s))) return 'no';
  return 'unknown';
}

const guestsRaw = await fs.readFile(guestsPath, 'utf8');
const guestLines = guestsRaw.split(/\r?\n/).filter(Boolean);
const guestRows = guestLines.slice(1).map((line) => {
  const [firstName = '', lastName = '', partyLabel = ''] = line.split('\t');
  const fullName = `${normalizeFixed(firstName)} ${normalizeFixed(lastName)}`.trim();
  return { fullName, partyLabel: normalizeFixed(partyLabel) };
});

const csvRaw = await fs.readFile(csvPath, 'utf8');
const csvRows = parse(csvRaw, { columns: true, skip_empty_lines: true, relax_column_count: true });

const responseMap = new Map();

for (const row of csvRows) {
  const first = findValue(row, ['firstname', 'first name', 'guest first name', 'givenname']);
  const last = findValue(row, ['lastname', 'last name', 'guest last name', 'surname', 'familyname']);
  const full = findValue(row, ['fullname', 'full name', 'guest name']) || `${first} ${last}`.trim();
  const party = findValue(row, ['party', 'partyname', 'group', 'household']);
  const status = mapStatus(findValue(row, ['rsvp', 'status', 'response', 'attending']));

  if (!full) continue;
  const key = `${normKey(full)}|${normKey(party)}`;
  responseMap.set(key, { fullName: full, partyLabel: party, status });
}

const responses = guestRows.map((guest) => {
  const strictKey = `${normKey(guest.fullName)}|${normKey(guest.partyLabel)}`;
  const nameOnlyKey = `${normKey(guest.fullName)}|`;
  const matched = responseMap.get(strictKey) || responseMap.get(nameOnlyKey);
  return {
    fullName: guest.fullName,
    partyLabel: guest.partyLabel,
    status: matched?.status || 'unknown'
  };
});

const payload = {
  active: true,
  generatedAt: new Date().toISOString(),
  source: 'withjoy-csv-automation',
  responses
};

await fs.writeFile(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outputPath}`);
