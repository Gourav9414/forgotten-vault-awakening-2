import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const lookupDir = path.join(repoRoot, 'math', 'lookup_tables');

const WEIGHT_SCALE = 1_000_000;
const PAYOUT_SCALE = 1_000;
const LEGACY_HEADER = 'id,payout,probability';
const PUBLICATION_HEADER = 'id,weight,payout';

function parseCsvContent(content, filePath) {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error(`CSV missing header or data rows: ${filePath}`);

  const header = lines[0];
  if (header !== LEGACY_HEADER && header !== PUBLICATION_HEADER) {
    throw new Error(`Unexpected header in ${filePath}: ${header}`);
  }

  const seenIds = new Set();
  return lines.slice(1).map((line, index) => {
    const columns = line.split(',').map((part) => part.trim());
    if (columns.length !== 3) {
      throw new Error(`Expected exactly 3 columns at ${filePath} line ${index + 2}: ${line}`);
    }

    const [rawId, rawA, rawB] = columns;
    const id = Number(rawId);
    const a = Number(rawA);
    const b = Number(rawB);
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new Error(`Invalid non-negative integer id at ${filePath} line ${index + 2}: ${rawId}`);
    }
    if (seenIds.has(id)) {
      throw new Error(`Duplicate id ${id} in ${filePath}`);
    }
    seenIds.add(id);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) {
      throw new Error(`Invalid non-negative numeric value at ${filePath} line ${index + 2}: ${line}`);
    }

    if (header === LEGACY_HEADER) {
      // Legacy columns are id,payout,probability. Scale each value into
      // the integer publication format exactly once.
      return {
        id,
        weight: Math.max(1, Math.round(b * WEIGHT_SCALE)),
        payout: Math.round(a * PAYOUT_SCALE),
      };
    }

    // Publication-format files already contain integer weight and payout.
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
      throw new Error(`Publication weight and payout must be integers at ${filePath} line ${index + 2}`);
    }
    if (a < 1) throw new Error(`Publication weight must be at least 1 at ${filePath} line ${index + 2}`);
    return { id, weight: a, payout: b };
  });
}

export async function normalizeCsv(filePath) {
  const original = await fs.readFile(filePath, 'utf8');
  const rows = parseCsvContent(original, filePath);
  const finalContent = [PUBLICATION_HEADER, ...rows.map(({ id, weight, payout }) => `${id},${weight},${payout}`)].join('\n') + '\n';

  // Validate fully before touching the original. Write a sibling temporary
  // file, then rename it into place to avoid partial output on write failure.
  const tempPath = `${filePath}.tmp`;
  try {
    await fs.writeFile(tempPath, finalContent, 'utf8');
    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
  return rows.length;
}

async function main() {
  const csvFiles = (await fs.readdir(lookupDir)).filter((file) => file.endsWith('.csv')).sort();
  for (const file of csvFiles) {
    const filePath = path.join(lookupDir, file);
    const rows = await normalizeCsv(filePath);
    console.log(`Normalized ${file}: ${rows} rows`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
