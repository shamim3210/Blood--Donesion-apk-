import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  computeCanonicalSha256,
  type FirestoreExportSnapshot,
} from '../src/db/migrationAndBackupEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function main() {
  const cfgPath = path.join(ROOT_DIR, 'firebase-applet-config.json');
  const appletCfg = fs.existsSync(cfgPath)
    ? (JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as { projectId?: string; firestoreDatabaseId?: string })
    : {};

  const projectId = process.env.FIREBASE_PROJECT_ID || appletCfg.projectId || '';
  const firestoreDbId =
    process.env.FIRESTORE_DATABASE_ID || appletCfg.firestoreDatabaseId || '(default)';

  if (!projectId) {
    console.error('✗ Missing FIREBASE_PROJECT_ID / firebase-applet-config.json projectId.');
    process.exit(1);
  }

  if (getApps().length === 0) {
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    if (svcJson) {
      initializeApp({ credential: cert(JSON.parse(svcJson)), projectId });
    } else {
      initializeApp({ projectId });
    }
  }

  const fsDb = getFirestore(getApps()[0]!, firestoreDbId);

  const readTopLevel = async (colName: string) => {
    const snap = await fsDb.collection(colName).get();
    return snap.docs.map((d) => ({ _docId: d.id, ...d.data() }));
  };

  console.log(`→ Exporting read-only backup of all 18 Firestore collections from ${projectId} (${firestoreDbId})...`);
  console.log('  (Non-destructive: zero Firestore documents are modified or deleted)');

  const directChats = await readTopLevel('directChats');
  const directChatMessages: Array<Record<string, unknown>> = [];
  for (const room of directChats) {
    const subSnap = await fsDb.collection('directChats').doc(String(room._docId)).collection('messages').get();
    for (const msg of subSnap.docs) {
      directChatMessages.push({ _docId: msg.id, roomId: room._docId, ...msg.data() });
    }
  }

  const collections: FirestoreExportSnapshot['collections'] = {
    users: await readTopLevel('users'),
    admins: await readTopLevel('admins'),
    adminInviteLocks: await readTopLevel('adminInviteLocks'),
    donors: await readTopLevel('donors'),
    donorDirectContacts: await readTopLevel('donorDirectContacts'),
    contactRequests: await readTopLevel('contactRequests'),
    requestAlerts: await readTopLevel('requestAlerts'),
    requests: await readTopLevel('requests'),
    requestDirectContacts: await readTopLevel('requestDirectContacts'),
    requestResponses: await readTopLevel('requestResponses'),
    liveDonorTrips: await readTopLevel('liveDonorTrips'),
    bloodStock: await readTopLevel('bloodStock'),
    communityMessages: await readTopLevel('communityMessages'),
    directChats,
    directChatMessages,
    announcements: await readTopLevel('announcements'),
    scamReports: await readTopLevel('scamReports'),
    gratitudeNotes: await readTopLevel('gratitudeNotes'),
  };

  const snapshot: FirestoreExportSnapshot = {
    exportedAtIso: new Date().toISOString(),
    firebaseProjectId: projectId,
    firestoreDatabaseId: firestoreDbId,
    collections,
    sha256Checksum: computeCanonicalSha256(collections),
  };

  const outDir = path.join(ROOT_DIR, 'backups');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `firestore-snapshot-${Date.now()}.json`);
  const latestPath = path.join(outDir, 'firestore-snapshot-latest.json');

  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), 'utf8');
  fs.writeFileSync(latestPath, JSON.stringify(snapshot, null, 2), 'utf8');

  console.log(`✓ Firestore backup snapshot written to: ${outPath}`);
  console.log(`  SHA-256 Checksum: ${snapshot.sha256Checksum}`);
}

main().catch((err) => {
  console.error('✗ Firestore backup failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
