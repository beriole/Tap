/**
 * Sauvegarde et restauration TESTEE de la base (plan phase 10).
 *
 *   node --env-file=.env scripts/db-backup.mjs                 → backups/nfc-<date>.dump
 *   node --env-file=.env scripts/db-backup.mjs --verify        → sauvegarde, puis restauration
 *                                                                 dans une base jetable et
 *                                                                 comparaison des comptes
 *   node --env-file=.env scripts/db-backup.mjs --restore <f>   → restaure <f> dans la base
 *                                                                 nommee par RESTORE_DATABASE_URL
 *
 * Format "custom" de pg_dump (compresse, restaurable table par table). La
 * restauration n ecrase JAMAIS la base de DATABASE_URL : elle vise toujours
 * une autre base, nommee explicitement. Une sauvegarde qu on n a jamais
 * restauree n est pas une sauvegarde : --verify est fait pour tourner
 * regulierement (et avant chaque migration en production).
 *
 * Prerequis : pg_dump / pg_restore / psql (PostgreSQL 16+), trouves dans le
 * PATH ou via PG_BIN.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const DATABASE_URL = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL manquant (node --env-file=.env ...)");
  process.exit(2);
}

const PG_BIN = process.env.PG_BIN ?? (process.platform === "win32" ? findWindowsPgBin() : "");
const bin = (name) => (PG_BIN ? path.join(PG_BIN, name) : name);

function findWindowsPgBin() {
  for (const major of [18, 17, 16]) {
    const candidate = `C:/Program Files/PostgreSQL/${major}/bin`;
    if (existsSync(candidate)) return candidate;
  }
  return "";
}

/** prisma ajoute ?schema=public ; les outils pg ne connaissent pas ce parametre. */
function pgUrl(url) {
  const u = new URL(url);
  u.searchParams.delete("schema");
  return u.toString();
}

function run(cmd, cmdArgs, options = {}) {
  return execFileSync(bin(cmd), cmdArgs, { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8", ...options });
}

const TABLES = ["User", "Event", "EventMember", "GuestGroup", "Guest", "GuestPreference", "Invitation", "RsvpResponse", "Ticket", "CheckIn", "CheckInStation", "AuditLog"];

function counts(url) {
  const sql = TABLES.map((t) => `SELECT '${t}' AS t, count(*)::int AS n FROM "${t}"`).join(" UNION ALL ");
  const out = run("psql", [pgUrl(url), "-At", "-F", "=", "-c", sql]);
  return Object.fromEntries(out.trim().split("\n").filter(Boolean).map((line) => line.split("=")));
}

function backup() {
  mkdirSync("backups", { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join("backups", `nfc-${stamp}.dump`);
  run("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", `--file=${file}`, pgUrl(DATABASE_URL)]);
  console.log(`Sauvegarde : ${file} (${Math.round(statSync(file).size / 1024)} ko)`);
  return file;
}

function restoreInto(file, targetUrl) {
  // --clean --if-exists : la base cible repart de zero ; --no-owner : le role
  // de production n existe pas forcement ici.
  run("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-privileges", `--dbname=${pgUrl(targetUrl)}`, file], { stdio: ["ignore", "inherit", "inherit"] });
}

if (args[0] === "--restore") {
  const file = args[1];
  const target = process.env.RESTORE_DATABASE_URL;
  if (!file || !target) {
    console.error("Usage : --restore <fichier.dump>, avec RESTORE_DATABASE_URL defini (jamais la base de production).");
    process.exit(2);
  }
  if (pgUrl(target) === pgUrl(DATABASE_URL)) {
    console.error("RESTORE_DATABASE_URL pointe sur DATABASE_URL : refuse.");
    process.exit(2);
  }
  restoreInto(file, target);
  console.log("Restauration terminee :", counts(target));
  process.exit(0);
}

const file = backup();

if (args.includes("--verify")) {
  // Base jetable a cote de la base courante : <nom>_restore_check.
  const source = new URL(pgUrl(DATABASE_URL));
  const dbName = source.pathname.slice(1);
  const scratchName = `${dbName}_restore_check`;
  const admin = new URL(source);
  admin.pathname = "/postgres";
  run("psql", [admin.toString(), "-c", `DROP DATABASE IF EXISTS "${scratchName}"`]);
  run("psql", [admin.toString(), "-c", `CREATE DATABASE "${scratchName}"`]);
  const scratch = new URL(source);
  scratch.pathname = `/${scratchName}`;

  restoreInto(file, scratch.toString());
  const before = counts(DATABASE_URL);
  const after = counts(scratch.toString());
  const diff = TABLES.filter((t) => before[t] !== after[t]);
  run("psql", [admin.toString(), "-c", `DROP DATABASE "${scratchName}"`]);

  if (diff.length) {
    console.error("ECHEC : comptes differents apres restauration :", diff.map((t) => `${t} ${before[t]}→${after[t]}`).join(", "));
    process.exit(1);
  }
  console.log(`Restauration verifiee : ${TABLES.map((t) => `${t}=${after[t]}`).join(" ")}`);
}
