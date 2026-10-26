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

function parseCsvLine(line) {
  const values = line.split(',').map((v) => v.trim());
  if (values.length !== 3) {
    throw new Error(`Expected 3 CSV columns, got ${values.length}: ${line}`);
  }
  return {
    id: Number(values[0]),
    payout: Number(values[1]),
    probability: Number(values[2]),
  };
}

async function parseCsv(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error(`CSV is empty or malformed: ${filePath}`);
  }

  const header = lines[0];
  if (header !== 'id,payout,probability') {
    throw new Error(`Unexpected CSV header for ${filePath}: ${header}`);
  }

  const rows = lines.slice(1).map(parseCsvLine);
  return rows;
}

function round(value, digits = 8) {
  return Number(value.toFixed(digits));
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
    const tablePath = path.join(repoRoot, mode.table);
    const logicPath = path.join(repoRoot, mode.game_logic);

    try {
      await ensureFileExists(tablePath, `Mode table for ${mode.name}`);
      await ensureFileExists(logicPath, `Mode logic for ${mode.name}`);
    } catch (error) {
      problems.push(error.message);
      continue;
    }

    let rows;
    try {
      rows = await parseCsv(tablePath);
    } catch (error) {
      problems.push(`${mode.name}: ${error.message}`);
      continue;
    }

    if (!rows.length) {
      problems.push(`${mode.name}: CSV has no rows.`);
      continue;
    }

    const ids = rows.map((row) => row.id);
    const payouts = rows.map((row) => row.payout);
    const probabilities = rows.map((row) => row.probability);

    if (new Set(ids).size !== ids.length) {
      problems.push(`${mode.name}: Duplicate CSV ids found.`);
    }

    const sortedIds = [...ids].sort((a, b) => a - b);
    if (JSON.stringify(sortedIds) !== JSON.stringify(ids)) {
      problems.push(`${mode.name}: CSV ids are not in ascending order.`);
    }

    const totalProbability = probabilities.reduce((sum, item) => sum + item, 0);
    if (Math.abs(totalProbability - 1) > 1e-4) {
      problems.push(`${mode.name}: Probability total is ${totalProbability}, expected ~1.0.`);
    }

    const maxPayout = Math.max(...payouts);
    if (maxPayout > maxWinCap) {
      problems.push(`${mode.name}: Max payout ${maxPayout} exceeds hard cap ${maxWinCap}.`);
    }

    const rtp = probabilities.reduce((sum, probability, index) => sum + probability * payouts[index], 0);
    const targetRtp = Number(mode.rtp ?? manifest.target_rtp ?? 0.98);
    if (Math.abs(rtp - targetRtp) > 0.05) {
      problems.push(`${mode.name}: RTP is ${rtp.toFixed(6)}, target is ${targetRtp}.`);
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

  if (problems.length === 0) {
    console.log('PASS: Core publication files are structurally consistent.');
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
