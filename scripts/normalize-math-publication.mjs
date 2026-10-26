import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const lookupDir = path.join(repoRoot, 'math', 'lookup_tables');

const WEIGHT_SCALE = 1_000_000;
const PAYOUT_SCALE = 1_000;

async function parseCsv(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error(`CSV missing rows: ${filePath}`);

  const header = lines[0];
  if (header !== 'id,payout,probability' && header !== 'id,weight,payout') {
    throw new Error(`Unexpected header in ${filePath}: ${header}`);
  }

  return lines.slice(1).map((line) => {
    const [id, valueA, valueB] = line.split(',').map((part) => part.trim());
    const first = Number(valueA);
    const second = Number(valueB);
    if (!Number.isFinite(first) || !Number.isFinite(second)) {
      throw new Error(`Non-numeric value in ${filePath}: ${line}`);
    }
    return {
      id: Number(id),
      first,
      second,
    };
  });
}

async function normalizeCsv(filePath) {
  const rows = await parseCsv(filePath);
  const normalized = rows.map((row) => {
    const originalPayout = Number(row.second);
    const originalWeight = Number(row.first);
    const payoutMultiplier = Math.max(0, Math.round(originalPayout * PAYOUT_SCALE));
    const probabilityWeight = Math.max(1, Math.round((Number.isFinite(originalWeight) ? originalWeight : originalPayout) * WEIGHT_SCALE));
    return `${row.id},${probabilityWeight},${payoutMultiplier}`;
  });

  const final = ['id,weight,payout', ...normalized].join('\n') + '\n';
  await fs.writeFile(filePath, final, 'utf8');
  return normalized.length;
}

async function main() {
  const csvFiles = (await fs.readdir(lookupDir)).filter((file) => file.endsWith('.csv')).sort();
  for (const file of csvFiles) {
    const filePath = path.join(lookupDir, file);
    const rows = await normalizeCsv(filePath);
    console.log(`Normalized ${file}: ${rows} rows`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
