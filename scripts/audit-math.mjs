import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mathDir = path.join(root, 'math');
const manifest = JSON.parse(await fs.readFile(path.join(mathDir, 'index.json'), 'utf8'));
const expected = ['standard','ante','multi10','multi50','multi200','buy-normal','buy-higher','buy-mythic','extreme-spin'];
const errors = [];
console.log('Mode | rows | probability sum | weighted return | mode cost | return/cost | max payout');
for (const mode of manifest.modes) {
  const tablePath = path.resolve(mathDir, mode.lookup || mode.table || mode.weights);
  const logicPath = path.resolve(mathDir, mode.book || mode.events || mode.game_logic);
  if (!tablePath.startsWith(mathDir + path.sep) || !logicPath.startsWith(mathDir + path.sep)) {
    errors.push(mode.name + ': path escapes math directory');
    continue;
  }
  const csv = (await fs.readFile(tablePath, 'utf8')).trim().split(/\r?\n/);
  const header = csv.shift();
  if (header !== 'id,payout,probability') { errors.push(mode.name + ': unexpected header ' + header); continue; }
  const ids = new Set();
  let probability = 0, weightedReturn = 0, maxPayout = 0;
  for (const [i,line] of csv.entries()) {
    const row = line.split(',').map(Number);
    if (row.length !== 3 || row.some(n => !Number.isFinite(n))) { errors.push(mode.name + ': malformed row ' + (i+2)); continue; }
    const [id,payout,prob] = row;
    if (!Number.isSafeInteger(id) || id < 0 || ids.has(id)) errors.push(mode.name + ': invalid/duplicate ID ' + id);
    ids.add(id);
    if (payout < 0 || prob < 0) errors.push(mode.name + ': negative payout/probability at row ' + (i+2));
    probability += prob;
    weightedReturn += payout * prob;
    maxPayout = Math.max(maxPayout, payout);
  }
  if (Math.abs(probability-1)>0.0001) errors.push(mode.name + ': probability sum out of tolerance ' + probability);
  if (!Number.isFinite(mode.cost) || mode.cost<=0) errors.push(mode.name + ': invalid mode cost');
  const rtp=weightedReturn/mode.cost;
  console.log([mode.name,csv.length,probability.toFixed(8),weightedReturn.toFixed(6),mode.cost, (rtp*100).toFixed(4)+'%',maxPayout.toFixed(2)].join(' | '));
  await fs.access(logicPath);
}
for (const name of expected) if (!manifest.modes.some(m=>m.name===name)) errors.push('missing required mode '+name);
if(errors.length){console.error('\nAUDIT ERRORS');for(const e of errors)console.error('- '+e);process.exit(1);}
console.log('\nPASS: local table arithmetic and file-presence checks. Not official RTP/SDK certification.');
