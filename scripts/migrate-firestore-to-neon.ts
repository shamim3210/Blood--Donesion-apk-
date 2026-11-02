import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { closeNeonDatabase, getNeonDatabase } from '../src/db/index';
import {
  computeCanonicalSha256,
  migrateFirestoreSnapshotToNeon,
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
    console.error(`✗ Snapshot file not found at ${inputPath}. Run \`npm run db:backup-firestore\` first.`);
    process.exit(1);
  }

  const snapshot = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as FirestoreExportSnapshot;
  const computed = computeCanonicalSha256(snapshot.collections);
  if (snapshot.sha256Checksum && snapshot.sha256Checksum !== computed) {
    console.error('✗ Snapshot SHA-256 checksum mismatch! Aborting migration.');
    process.exit(1);
  }

  const { db, info } = getNeonDatabase();
  if (!db) {
    console.error('✗ DATABASE_URL is not configured. Configure Neon DATABASE_URL before migrating.');
    process.exit(1);
  }

  console.log(`→ Migrating Firestore snapshot into Neon PostgreSQL (${info.redactedUrl})...`);
  await migrateFirestoreSnapshotToNeon(db, snapshot);
  console.log('✓ Atomic Firestore-to-Neon migration completed. Run `npm run db:verify-migration` next.');
  await closeNeonDatabase();
}

main().catch(async (err) => {
  console.error('✗ Migration failed (rolled back cleanly):', err instanceof Error ? err.message : err);
  await closeNeonDatabase();
  process.exit(1);
});
