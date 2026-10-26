import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const mathDir = path.join(repoRoot, 'math');

async function ensureFileExists(filePath, label) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    throw new Error(`${label} missing: ${filePath}`);
  }
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  return JSON.parse(text);
}

function parseCsvLine(line, filePath) {
  const values = line.split(',').map((v) => v.trim());
  if (values.length !== 3) {
    throw new Error(`Expected 3 CSV columns in ${filePath}, got ${values.length}: ${line}`);
  }

  const id = Number(values[0]);
  const second = Number(values[1]);
  const third = Number(values[2]);

  if (!Number.isFinite(id) || !Number.isFinite(second) || !Number.isFinite(third)) {
    throw new Error(`CSV values must be numeric in ${filePath}: ${line}`);
  }

  return {
    id,
    second,
    third,
  };
}

async function parseCsv(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error(`CSV is empty or malformed: ${filePath}`);
  }

  const header = lines[0];
  const legacyHeader = 'id,payout,probability';
  const officialHeader = 'id,weight,payout';

  if (header !== legacyHeader && header !== officialHeader) {
    throw new Error(`Unexpected CSV header for ${filePath}: ${header}`);
  }

  const rows = lines.slice(1).map((line) => parseCsvLine(line, filePath));
  return { rows, usesLegacyHeader: header === legacyHeader, usesOfficialHeader: header === officialHeader };
}

async function tryZstdCheck(filePath) {
  const candidates = [
    '@bokuweb/zstd-wasm',
    'node-zstandard',
    'zstd-codec',
    '@devtables/zstd',
  ];

  for (const pkg of candidates) {
    try {
      const mod = await import(pkg);
      const decoder = mod.default ?? mod.decompress ?? mod.ZstdCodec ?? mod.zstd;
      if (decoder) {
        const buffer = await fs.readFile(filePath);
        if (typeof decoder === 'function') {
          try {
            decoder(buffer);
            return true;
          } catch {
            return false;
          }
        }
        if (decoder.decompress) {
          try {
            decoder.decompress(buffer);
            return true;
          } catch {
            return false;
          }
        }
      }
    } catch {
      // try next candidate
    }
  }

  return false;
}

async function main() {
  const problems = [];
  const warnings = [];

  const manifestPath = path.join(mathDir, 'index.json');
  await ensureFileExists(manifestPath, 'Math manifest');

  const manifest = await readJson(manifestPath);
  const requiredKeys = ['game_id', 'title', 'version', 'math_specification_version', 'target_rtp', 'modes'];
  for (const key of requiredKeys) {
    if (!(key in manifest)) {
      problems.push(`Manifest missing required key: ${key}`);
    }
  }

  if (!Array.isArray(manifest.modes) || manifest.modes.length === 0) {
    problems.push('Manifest modes array is missing or empty.');
  }

  const expectedModeNames = [
    'standard',
    'ante',
    'multi10',
    'multi50',
    'multi200',
    'buy-normal',
    'buy-higher',
    'buy-mythic',
    'extreme-spin',
  ];

  const modeNames = (manifest.modes ?? []).map((mode) => mode.name);
  for (const expected of expectedModeNames) {
    if (!modeNames.includes(expected)) {
      problems.push(`Missing mode entry: ${expected}`);
    }
  }

  const maxWinCap = 100000;

  for (const mode of manifest.modes ?? []) {
    const tablePath = path.join(repoRoot, mode.lookup ?? mode.table ?? mode.weights ?? '');
    const logicPath = path.join(repoRoot, mode.book ?? mode.events ?? mode.game_logic ?? '');

    if (!mode.lookup && !mode.table && !mode.weights) {
      problems.push(`${mode.name}: mode entry does not include a lookup file reference.`);
      continue;
    }

    if (!mode.book && !mode.events && !mode.game_logic) {
      problems.push(`${mode.name}: mode entry does not include a compressed logic file reference.`);
      continue;
    }

    try {
      await ensureFileExists(tablePath, `Mode table for ${mode.name}`);
      await ensureFileExists(logicPath, `Mode logic for ${mode.name}`);
    } catch (error) {
      problems.push(error.message);
      continue;
    }

    let csvResult;
    try {
      csvResult = await parseCsv(tablePath);
    } catch (error) {
      problems.push(`${mode.name}: ${error.message}`);
      continue;
    }

    const { rows, usesLegacyHeader, usesOfficialHeader } = csvResult;
    if (usesLegacyHeader) {
      warnings.push(`${mode.name}: CSV still uses legacy header 'id,payout,probability'; official validation expects integer-based probability tables and exact mapping to compressed logic book entries.`);
    }
    if (usesOfficialHeader) {
      warnings.push(`${mode.name}: CSV uses official-style integer columns but exact SDK validation is still pending.`);
    }

    const ids = rows.map((row) => row.id);
    if (new Set(ids).size !== ids.length) {
      problems.push(`${mode.name}: Duplicate CSV ids found.`);
    }

    const sortedIds = [...ids].sort((a, b) => a - b);
    if (JSON.stringify(sortedIds) !== JSON.stringify(ids)) {
      warnings.push(`${mode.name}: CSV ids are not in ascending order; this is a publication formatting issue to fix before SDK validation.`);
    }

    const firstRow = rows[0];
    const secondCol = rows.map((row) => row.second);
    const thirdCol = rows.map((row) => row.third);

    const probabilityTotal = secondCol.reduce((sum, item) => sum + item, 0);
    if (!usesLegacyHeader && Math.abs(probabilityTotal - 1) > 1e-4) {
      warnings.push(`${mode.name}: Probability/weight total is ${probabilityTotal}, not yet confirmed to match the final official table.`);
    }

    const maxPayout = Math.max(...thirdCol);
    if (maxPayout > maxWinCap) {
      problems.push(`${mode.name}: Max payout ${maxPayout} exceeds hard cap ${maxWinCap}.`);
    }

    const logicStats = await fs.stat(logicPath);
    if (logicStats.size <= 0) {
      problems.push(`${mode.name}: Logic file is empty.`);
    }

    const zstdOk = await tryZstdCheck(logicPath);
    if (!zstdOk) {
      warnings.push(`${mode.name}: Zstd decompression library not available; compressed logic file was only checked for existence/size.`);
    }
  }

  console.log('=== Forgotten Vault math validation ===');
  console.log(`Manifest: ${manifest.game_id ?? 'unknown'}`);
  console.log(`Target RTP: ${manifest.target_rtp ?? 'unknown'}`);
  console.log(`Mode count: ${(manifest.modes ?? []).length}`);
  console.log('Status: local validation only. Official Stake SDK validation remains pending.');

  if (problems.length === 0) {
    console.log('PASS: Core publication files are structurally present and internally consistent for local review.');
  } else {
    console.log('FAILURES:');
    for (const item of problems) {
      console.log(`- ${item}`);
    }
  }

  if (warnings.length > 0) {
    console.log('WARNINGS:');
    for (const item of warnings) {
      console.log(`- ${item}`);
    }
  }

  if (problems.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Validation script failed unexpectedly:');
  console.error(error);
  process.exit(1);
});
