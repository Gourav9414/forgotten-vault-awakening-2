import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const mathDir = path.join(repoRoot, 'math');
const manifestPath = path.join(mathDir, 'index.json');

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function main() {
  const manifest = await readJson(manifestPath);
  const requiredKeys = ['game_id', 'title', 'version', 'math_specification_version', 'target_rtp', 'modes'];
  const missing = requiredKeys.filter((key) => !(key in manifest));
  if (missing.length) throw new Error('Missing required manifest keys: ' + missing.join(', '));
  if (!Array.isArray(manifest.modes) || manifest.modes.length === 0) throw new Error('Manifest modes must be a non-empty array.');

  const expectedModes = ['standard','ante','multi10','multi50','multi200','buy-normal','buy-higher','buy-mythic','extreme-spin'];
  const names = manifest.modes.map((mode) => mode.name);
  for (const name of expectedModes) if (!names.includes(name)) throw new Error('Missing required mode: ' + name);
  if (new Set(names).size !== names.length) throw new Error('Duplicate mode names found in manifest.');
  if (manifest.target_rtp !== 0.98) console.warn('WARNING: target_rtp differs from 0.98:', manifest.target_rtp);
  if (manifest.status !== 'PENDING_OFFICIAL_STAKE_SDK_VALIDATION') console.warn('WARNING: unexpected manifest status:', manifest.status);

  for (const mode of manifest.modes) {
    const tableRel = mode.lookup || mode.table || mode.weights;
    const logicRel = mode.book || mode.events || mode.game_logic;
    if (!tableRel) throw new Error('Mode ' + mode.name + ' requires a lookup path.');
    if (!logicRel) throw new Error('Mode ' + mode.name + ' requires a compressed logic path.');
    const tablePath = path.resolve(mathDir, tableRel);
    const logicPath = path.resolve(mathDir, logicRel);
    if (!tablePath.startsWith(mathDir + path.sep) || !logicPath.startsWith(mathDir + path.sep)) {
      throw new Error('Mode ' + mode.name + ' has a path escaping the math directory.');
    }
    await fs.access(tablePath);
    const logicStat = await fs.stat(logicPath);
    if (!logicStat.isFile() || logicStat.size === 0) throw new Error('Mode ' + mode.name + ' logic file is missing or empty.');
    const csv = await fs.readFile(tablePath, 'utf8');
    const lines = csv.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error('Mode ' + mode.name + ' lookup CSV is empty.');
    if (lines[0] !== 'id,payout,probability' && lines[0] !== 'id,weight,payout') throw new Error('Mode ' + mode.name + ' has an unsupported lookup CSV header: ' + lines[0]);
    const ids = new Set();
    let total = 0;
    for (const [i,line] of lines.slice(1).entries()) {
      const cols = line.split(',').map(x => Number(x.trim()));
      if (cols.length !== 3 || cols.some(x => !Number.isFinite(x))) throw new Error('Mode ' + mode.name + ' invalid numeric CSV row ' + (i+2));
      if (!Number.isSafeInteger(cols[0]) || cols[0] < 0 || ids.has(cols[0])) throw new Error('Mode ' + mode.name + ' invalid/duplicate ID at row ' + (i+2));
      ids.add(cols[0]);
      if (cols[1] < 0 || cols[2] < 0) throw new Error('Mode ' + mode.name + ' negative values at row ' + (i+2));
      if (lines[0] === 'id,payout,probability') total += cols[2];
      else total += cols[1];
    }
    if (lines[0] === 'id,payout,probability' && Math.abs(total - 1) > 0.0001) throw new Error('Mode ' + mode.name + ' probability total is ' + total + ', expected approximately 1.');
    if (lines[0] === 'id,weight,payout' && total <= 0) throw new Error('Mode ' + mode.name + ' weight total must be positive.');
  }

  console.log('PASS: Local manifest, required modes, lookup CSVs, paths, and logic-file presence checks passed.');
  console.log('LIMIT: This is a repository-local structural validator, not the official Stake Engine SDK validator.');
}

main().catch((err) => {
  console.error('Math publication validation failed:', err.message);
  process.exit(1);
});
