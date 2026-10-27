import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const main = await fs.readFile(path.join(root, 'main.js'), 'utf8');
const html = await fs.readFile(path.join(root, 'forgotten-vault.html'), 'utf8');
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));

assert.ok(pkg.dependencies?.['stake-engine'], 'official stake-engine package dependency missing');
assert.match(main, /import \{ RGSClient \} from 'stake-engine'/, 'official RGSClient import missing');
assert.match(main, /client\.Authenticate\(\)/, 'authentication call missing');
assert.match(main, /client\.Play\(\{ amount, mode \}\)/, 'authoritative Play call missing');
assert.match(main, /client\.EndRound\(\)/, 'EndRound lifecycle call missing');
assert.match(main, /sessionID/);
assert.match(main, /rgs_url/);
assert.match(main, /activeRound\?\.active/, 'active-round protection missing');
assert.match(main, /Number\(activeRound\.payout \?\? 0\) <= 0/, 'zero-payout EndRound guard missing');
assert.match(main, /amount > authenticated\.balance\.amount/, 'insufficient-balance guard missing');
assert.match(html, /source: 'forgotten-vault-game'/, 'iframe bridge sender missing');
assert.match(html, /RGS_PLAY/, 'spin control does not send RGS play request');
assert.match(html, /Do not generate a client-side board from random values|Deliberately do not generate a client-side board/, 'must not synthesize authoritative outcomes');
assert.doesNotMatch(html, /fonts\.googleapis\.com/, 'external Google Fonts dependency remains');

console.log('Stake Engine bridge source checks');
console.log('PASS official SDK dependency and client import');
console.log('PASS authentication and authoritative play calls');
console.log('PASS active-round and zero-payout safeguards');
console.log('PASS insufficient-balance precheck');
console.log('PASS iframe request/response bridge');
console.log('PASS no external Google Fonts runtime dependency');
console.log('NOTE: source checks do not replace npm build, live RGS integration, or official SDK/math validation.');
