/**
 * Lance les tests unitaires (*.test.ts sous src/) avec le lanceur integre de
 * Node, via tsx. Pas de Jest ni de Vitest : la logique testee est pure et le
 * lanceur natif suffit.
 *
 * Node 20 ne developpe pas les motifs `**` passes a --test : on liste donc
 * les fichiers nous-memes, pour que la commande marche aussi sous Windows.
 */
import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

async function findTests(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return entry.name === "node_modules" ? [] : findTests(full);
      return entry.name.endsWith(".test.ts") ? [full] : [];
    }),
  );
  return files.flat();
}

const files = await findTests("src");
if (files.length === 0) {
  console.error("Aucun fichier *.test.ts trouve sous src/.");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], { stdio: "inherit" });
process.exit(result.status ?? 1);
