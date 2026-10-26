import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { normalizeCsv } from './normalize-math-publication.mjs';

async function withTempCsv(contents, callback) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fv-normalizer-'));
  const file = path.join(dir, 'table.csv');
  try {
    await fs.writeFile(file, contents, 'utf8');
    await callback(file);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('legacy id,payout,probability maps payout and probability to the correct integer columns', async () => {
  await withTempCsv('id,payout,probability\n0,0.5,0.7\n1,1.25,0.000002\n', async (file) => {
    const count = await normalizeCsv(file);
    assert.equal(count, 2);
    assert.equal(await fs.readFile(file, 'utf8'), 'id,weight,payout\n0,700000,500\n1,2,1250\n');
  });
});

test('publication format is idempotent', async () => {
  const publication = 'id,weight,payout\n0,700000,500\n1,2,1250\n';
  await withTempCsv(publication, async (file) => {
    const count = await normalizeCsv(file);
    assert.equal(count, 2);
    assert.equal(await fs.readFile(file, 'utf8'), publication);
  });
});

test('rejects duplicate IDs without modifying the original file', async () => {
  const invalid = 'id,payout,probability\n0,0.5,0.7\n0,0.6,0.3\n';
  await withTempCsv(invalid, async (file) => {
    await assert.rejects(() => normalizeCsv(file), /Duplicate id 0/);
    assert.equal(await fs.readFile(file, 'utf8'), invalid);
  });
});

test('rejects malformed rows without modifying the original file', async () => {
  const invalid = 'id,payout,probability\n0,0.5\n';
  await withTempCsv(invalid, async (file) => {
    await assert.rejects(() => normalizeCsv(file), /exactly 3 columns/);
    assert.equal(await fs.readFile(file, 'utf8'), invalid);
  });
});
