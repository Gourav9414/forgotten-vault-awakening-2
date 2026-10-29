import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await fs.readFile(path.join(root, 'forgotten-vault.html'), 'utf8');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'math/index.json'), 'utf8'));
const checks = [];
function check(name, fn) { fn(); checks.push(name); }

check('HTML document is complete and includes its inline runtime', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<\/html>\s*$/i);
  assert.match(html, /<script[\s>]/i);
  assert.match(html, /<\/script>/i);
  assert.match(html, /<\/style>/i);
});
check('Game board is configured as an 8-column by 6-row grid', () => {
  assert.ok(/const C\s*=\s*8/.test(html) || html.includes('repeat(8'), 'missing 8-column board');
  assert.ok(/const R\s*=\s*6/.test(html) || html.includes('repeat(6') || html.includes('8 × 6'), 'missing 6-row board');
});
check('Current v110 controls exist and are wired', () => {
  for (const id of ['spin','down','up','autoToggle','featureForgeBtn','turbo','sound','replayBtn','mobileSpinDock','mobileSpin','buyNormal','buyHigher','buyMythic','extremeSpin']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing control ' + id);
  }
  assert.ok(html.includes("$('spin').onclick="), 'spin button handler is missing');
  assert.ok(html.includes('async function spinCore('), 'spin logic is missing');
  assert.ok(html.includes('function findClustersForBoard('), 'cluster detection is missing');
  assert.ok(html.includes('function simulate('), 'diagnostic simulator is missing');
});
check('Guardian tiers and feature modes are represented', () => {
  for (const id of ['buyNormal','buyHigher','buyMythic','extremeSpin','multi10','multi50','multi200']) {
    assert.ok(html.includes('id="' + id + '"'), 'missing feature control ' + id);
  }
  assert.ok(/tierForGuardians\(4\)/.test(html), 'Normal Guardian threshold path missing');
  assert.ok(/tierForGuardians\(6\)/.test(html), 'Mythic Guardian threshold path missing');
  assert.ok(/tierForGuardians\(8\)/.test(html), 'Epic Guardian threshold path missing');
});
check('Prototype-only and unverified RTP disclosures remain visible', () => {
  assert.match(html, /NOT STAKE ENGINE INTEGRATED/i);
  assert.match(html, /VIRTUAL CREDITS/i);
  assert.match(html, /RTP.{0,35}(?:not verified|not validated|not certified)/i);
  assert.match(html, /100[, ]?000|100000/);
});
check('Math manifest keeps RTP as a target and publication pending', () => {
  assert.equal(manifest.target_rtp, 0.98);
  assert.equal(manifest.status, 'PENDING_OFFICIAL_STAKE_SDK_VALIDATION');
});
check('Required math modes are unique and complete', () => {
  const expected = ['standard','ante','multi10','multi50','multi200','buy-normal','buy-higher','buy-mythic','extreme-spin'];
  const names = manifest.modes.map(x => x.name);
  assert.equal(new Set(names).size, names.length);
  for (const name of expected) assert.ok(names.includes(name), 'missing ' + name);
});
check('No false claim of official certification remains in the playable entry', () => {
  assert.doesNotMatch(html, /STAKE ENGINE CERTIFIED|certified RTP 98\.00%/i);
});
console.log('Forgotten Vault v110 local source smoke tests');
for (const name of checks) console.log('PASS ' + name);
console.log(checks.length + ' checks passed. These source smoke tests do not replace browser, SDK, RGS, or RTP certification.');
