import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'math/index.json'), 'utf8'));
const tolerance = 0.0005;
let failed = false;

for (const mode of manifest.modes ?? []) {
  const relative = mode.lookup ?? mode.table ?? mode.weights;
  if (!relative) {
    console.error(`FAIL ${mode.name}: no lookup/table/weights path`);
    failed = true;
    continue;
  }

  const file = path.join(root, 'math', relative);
  const lines = (await fs.readFile(file, 'utf8')).trim().split(/\r?\n/);
  const header = lines.shift();
  if (header !== 'id,payout,probability') {
    console.error(`FAIL ${mode.name}: expected unchanged legacy source header, got "${header}"`);
    failed = true;
    continue;
  }

  let probabilitySum = 0;
  let expectedReturn = 0;
  const ids = new Set();
  let valid = true;
  for (const [index, line] of lines.entries()) {
    const columns = line.split(',').map(Number);
    if (columns.length !== 3 || columns.some((v) => !Number.isFinite(v))) {
      console.error(`FAIL ${mode.name}: invalid numeric row ${index + 2}`);
      valid = false;
      break;
    }
    const [id, payout, probability] = columns;
    if (!Number.isSafeInteger(id) || id < 0 || ids.has(id) || payout < 0 || probability < 0) {
      console.error(`FAIL ${mode.name}: invalid or duplicate id / negative value on row ${index + 2}`);
      valid = false;
      break;
    }
    ids.add(id);
    probabilitySum += probability;
    expectedReturn += payout * probability;
  }

  const expected = Number(mode.cost) * Number(manifest.target_rtp);
  const sumOk = Math.abs(probabilitySum - 1) <= 0.00001;
  const returnOk = Math.abs(expectedReturn - expected) <= tolerance;
  if (!valid || !sumOk || !returnOk) {
    console.error(`FAIL ${mode.name}: rows=${lines.length}, probabilitySum=${probabilitySum.toFixed(8)}, weightedReturn=${expectedReturn.toFixed(6)}, expected=${expected.toFixed(6)}`);
    failed = true;
  } else {
    console.log(`PASS ${mode.name}: ${lines.length} rows, probabilitySum=${probabilitySum.toFixed(8)}, weightedReturn=${expectedReturn.toFixed(6)} (target ${expected.toFixed(6)})`);
  }
}

if (failed) process.exitCode = 1;
else console.log('PASS: CSV probability and weighted-return audit. This does not validate compressed-book mapping or official SDK acceptance.');
