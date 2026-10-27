import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await fs.readFile(path.join(root, 'forgotten-vault.html'), 'utf8');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'math/index.json'), 'utf8'));
const checks = [];
function check(name, fn) { fn(); checks.push(name); }

check('HTML document has a doctype and closing tags', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<\/html>\s*$/i);
  assert.match(html, /<\/script>/i);
  assert.match(html, /<\/style>/i);
});
check('Core board dimensions are represented in source', () => {
  assert.match(html, /repeat\(8[, ]/i);
  assert.match(html, /6\s*rows|repeat\(6/i);
});
check('Game includes wired spin, bet, auto-play, turbo, and feature controls', () => {
  for (const id of ['spin','betDown','betUp','autoToggle','turboToggle','featureForgeBtn','toolbarAuto','toolbarTurbo','soundToggle','menuButton']) {
    assert.match(html, new RegExp('id=["\\\\']' + id + '["\\\\']', 'i'), 'missing control ' + id);
  }
  assert.match(html, /addEventListener\\(['"]click['"]/i);
  assert.match(html, /function runSpin\\(/);
  assert.match(html, /function findClusters\\(/);
  assert.match(html, /data-feature=["'](normal|higher|mythic|extreme)["']/i);
});
check('All eight Guardian portrait treatments exist', () => {
  assert.equal((html.match(/class=["']guardian-portrait["']/g) || []).length, 8);
  for (const name of ['Aether','Oblivion','Solara','Nexus','Void','Tidal','Inferno','Terra']) assert.match(html, new RegExp(name, 'i'));
});
check('Virtual-credit safety and limitations are visible', () => {
  assert.match(html, /PROTOTYPE DISCLAIMER/);
  assert.match(html, /VIRTUAL CREDITS ONLY/);
  assert.match(html, /RTP NOT CERTIFIED/);
  assert.match(html, /100[, ]?000|100000/);
});
check('Game includes a 100,000x prototype cap marker', () => {
  assert.match(html, /100[, ]?000|100000/);
});
check('RTP and publication state are explicit', () => {
  assert.equal(manifest.target_rtp, 0.98);
  assert.equal(manifest.status, 'PENDING_OFFICIAL_STAKE_SDK_VALIDATION');
});
check('Required math modes are unique and complete', () => {
  const expected = ['standard','ante','multi10','multi50','multi200','buy-normal','buy-higher','buy-mythic','extreme-spin'];
  const names = manifest.modes.map(x => x.name);
  assert.equal(new Set(names).size, names.length);
  for (const name of expected) assert.ok(names.includes(name), 'missing ' + name);
});
check('Game avoids false official-certified copy', () => {
  assert.match(html, /PROTOTYPE DISCLAIMER/);
  assert.doesNotMatch(html, /STAKE ENGINE CERTIFIED|certified RTP 98\.00%/i);
});
console.log('Forgotten Vault local source smoke tests');
for (const name of checks) console.log('PASS ' + name);
console.log(checks.length + ' checks passed. These source smoke tests do not replace browser, SDK, or RGS testing.');
