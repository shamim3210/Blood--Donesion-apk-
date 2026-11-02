import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { closeNeonDatabase, getNeonDatabase } from '../src/db/index';
import {
  verifyFirestoreToNeonMigration,
  type FirestoreExportSnapshot,
} from '../src/db/migrationAndBackupEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function main() {
  const inputPath =
    process.argv[2] || path.join(ROOT_DIR, 'backups', 'firestore-snapshot-latest.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`✗ Source snapshot not found at ${inputPath}.`);
    process.exit(1);
  }

  const snapshot = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as FirestoreExportSnapshot;
  const { db, info } = getNeonDatabase();
  if (!db) {
    console.error('✗ DATABASE_URL is not configured.');
    process.exit(1);
  }

  console.log(`→ Verifying Neon migration counts & Firebase UIDs on ${info.redactedUrl}...`);
  const report = await verifyFirestoreToNeonMigration(db, snapshot);

  for (const row of report.comparisons) {
    console.log(
      `  [${row.ok ? 'PASS' : 'FAIL'}] ${row.name.padEnd(28)} source=${row.source} -> neon=${row.destination}`
    );
  }
  console.log(`  Missing Firebase Auth UIDs: ${report.missingFirebaseUids.length}`);
  console.log(`  Isolated Private Contacts : ${report.privateContactsIsolatedCount}`);

  await closeNeonDatabase();

  if (!report.passed) {
    console.error('✗ Migration verification FAILED. Keep DB_CUTOVER_MODE="FIRESTORE_PRIMARY" and investigate.');
    process.exit(1);
  }

  console.log('✓ Migration integrity 100% VERIFIED. Safe to set DB_CUTOVER_MODE="NEON_PRIMARY".');
}

main().catch(async (err) => {
  console.error('✗ Verification error:', err instanceof Error ? err.message : err);
  await closeNeonDatabase();
  process.exit(1);
});
