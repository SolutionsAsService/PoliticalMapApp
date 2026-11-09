// Validates data/systems.json. Run: node scripts/check-data.mjs
import fs from 'node:fs';
const fams = new Set(['monarchy','empire','republic','theocracy','oligarchy','authoritarian','federal']);
const data = JSON.parse(fs.readFileSync(new URL('../data/systems.json', import.meta.url)));
const countries = JSON.parse(fs.readFileSync(new URL('../data/countries.json', import.meta.url)));
const ids = new Set([...data, ...countries].map(s => s.id)); const bad = [];
if (ids.size !== data.length + countries.length) bad.push('duplicate ids across systems and countries');
for (const s of countries) { if (!fams.has(s.family)) bad.push(`${s.id}: bad family`); if (!Number.isInteger(s.start) || s.start === 0) bad.push(`${s.id}: bad start`); if (s.end !== null && s.end <= s.start) bad.push(`${s.id}: end <= start`); }
for (const s of data) {
  for (const k of ['id','name','family','start','region','origin','ending','summary'])
    if (s[k] === undefined || s[k] === '') bad.push(`${s.id}: missing ${k}`);
  if (!fams.has(s.family)) bad.push(`${s.id}: bad family ${s.family}`);
  if (s.end !== null && s.end <= s.start) bad.push(`${s.id}: end <= start`);
  if (s.start === 0 || s.end === 0) bad.push(`${s.id}: year 0 does not exist`);
  for (const n of s.next ?? []) if (!ids.has(n)) bad.push(`${s.id}: next ${n} unknown`);
}
console.log(`${data.length} systems, ${countries.length} countries`, bad.length ? bad : 'OK');
process.exit(bad.length ? 1 : 0);
