/**
 * Firestore Security Rules Verification Suite — Dirty Dozen Payloads
 * Verifies that all adversarial attacks against Identity, Integrity, PII Isolation,
 * Direct Contact Consent, Concurrent Alerts, Chat Privacy, and State Transitions
 * are rejected with PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: {
    uid: string;
    email?: string;
    email_verified?: boolean;
    sign_in_provider?: string;
  } | null;
  existingDoc?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Self-Assigned ADMIN panelType without /admins record',
    collectionPath: '/users/attacker_uid',
    operation: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@gmail.com', email_verified: true },
    payload: { uid: 'attacker_uid', panelType: 'ADMIN' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Invalid SHA-256 secretProofHash on /admins creation',
    collectionPath: '/admins/attacker_uid',
    operation: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@gmail.com', email_verified: true },
    payload: {
      uid: 'attacker_uid',
      name: 'Fake Admin',
      idCardNumber: 'ADMIN-BD-2026-0001',
      district: 'dhaka',
      secretProofHash: '0'.repeat(64),
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Bootstrapped Admin Email Spoofing with email_verified == false',
    collectionPath: '/users/victim_uid',
    operation: 'get',
    auth: { uid: 'spoof_uid', email: 'shamimrakib015@gmail.com', email_verified: false },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unauthorized Read on Non-Opted-In /donorDirectContacts/{donorId} (REQUEST_ONLY / DND)',
    collectionPath: '/donorDirectContacts/donor_private',
    operation: 'get',
    auth: { uid: 'seeker_uid', email: 'seeker@gmail.com', email_verified: true },
    existingDoc: {
      ownerUid: 'donor_private',
      shareDirectContact: false,
      contactVisibility: 'REQUEST_ONLY',
      availabilityStatus: 'DND',
      phone: '+8801712345678',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Bulk List Scraping on /donorDirectContacts & /users PII collections',
    collectionPath: '/donorDirectContacts',
    operation: 'list',
    auth: { uid: 'scraper_uid', email: 'scraper@gmail.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Shadow Ghost Field Injection on /requestAlerts create',
    collectionPath: '/requestAlerts/req_1__donor_1',
    operation: 'create',
    auth: { uid: 'author_1', email: 'u1@gmail.com', email_verified: true },
    payload: {
      requestId: 'req_1',
      authorUid: 'author_1',
      donorUid: 'donor_1',
      ghostAdminFlag: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Canonical Pair ID Spoofing on /contactRequests create',
    collectionPath: '/contactRequests/spoofed_req_id',
    operation: 'create',
    auth: { uid: 'seekerA', email: 'u1@gmail.com', email_verified: true },
    payload: { seekerUid: 'seekerA', donorUid: 'donorB', status: 'PENDING' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'ID Poisoning via non-alphanumeric path chars',
    collectionPath: '/donors/bad$id!@#',
    operation: 'get',
    auth: { uid: 'user_1', email: 'u1@gmail.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Value Poisoning on whitelisted update key',
    collectionPath: '/donors/donor_1',
    operation: 'update',
    auth: { uid: 'user_1', email: 'u1@gmail.com', email_verified: true },
    payload: { available: 'NOT_A_BOOLEAN' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Seeker Self-Approving /contactRequests to bypass Donor Consent',
    collectionPath: '/contactRequests/seekerA__donorB',
    operation: 'update',
    auth: { uid: 'seekerA', email: 'u1@gmail.com', email_verified: true },
    existingDoc: { seekerUid: 'seekerA', donorUid: 'donorB', status: 'PENDING' },
    payload: { status: 'APPROVED', approvedPhone: '+8801711111111' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Unlocking on FULFILLED or CANCELLED BloodRequest',
    collectionPath: '/requests/req_fulfilled',
    operation: 'update',
    auth: { uid: 'user_1', email: 'u1@gmail.com', email_verified: true },
    existingDoc: { authorUid: 'user_1', status: 'CANCELLED' },
    payload: { status: 'ACTIVE' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Client Timestamp Forgery (createdAt != request.time)',
    collectionPath: '/communityMessages/msg_forged_time',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@gmail.com', email_verified: true },
    payload: { createdAt: '1999-01-01T00:00:00Z' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
