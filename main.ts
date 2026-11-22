// VAULTLIGHT — hand-in program for the best-heist-game-20261122-0559 entry.
//
// The game itself is plain static files under game/ (no build step, no
// network). This program copies game/ and screenshots/ into the output
// directory and writes the dossier the judge reads. The dossier bytes are
// exactly what buildDossier returns for that output tree: the return value
// is written to disk untouched — never parsed, never amended.
//
// Run locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play the game with: node serve.ts  (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the sealed gate's own limits: at most 4 screenshots of at
// most 256 KiB each, at most 993 files and 48 MiB under game/, no game path
// over 1000 bytes, and the dossier text capped at 160 KiB.
const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
