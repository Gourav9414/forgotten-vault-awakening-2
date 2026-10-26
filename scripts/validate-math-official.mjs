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
  if (missing.length) {
    throw new Error('Missing required manifest keys: ' + missing.join(', '));
  }

  for (const mode of manifest.modes) {
    const modePath = path.join(mathDir, mode.lookup || mode.table || mode.weights || '');
    const logicPath = path.join(mathDir, mode.book || mode.events || mode.game_logic || '');
    if (!mode.lookup && !mode.table) {
      throw new Error(`Mode ${mode.name} requires a lookup path.`);
    }
    if (!mode.book && !mode.events && !mode.game_logic) {
      throw new Error(`Mode ${mode.name} requires a compressed logic path.`);
    }
    try {
      await fs.access(modePath);
      await fs.access(logicPath);
    } catch {
      throw new Error(`Mode ${mode.name} points to a missing file: ${modePath} or ${logicPath}`);
    }
  }

  console.log('Local manifest/path validation passed. This script is not the official Stake Engine SDK validator.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
