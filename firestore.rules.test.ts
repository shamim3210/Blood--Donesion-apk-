/**
 * Firestore Security Rules Verification Suite — Dirty Dozen Payloads
 * Verifies that all 12 adversarial attacks against Identity, Integrity, PII Isolation,
 * Chat Privacy, and State Transitions are rejected with PERMISSION_DENIED.
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
    name: 'Cross-User PII Read on /users/{otherUid} & Non-Participant /directChats/{b__c}',
    collectionPath: '/directChats/userB__userC',
    operation: 'get',
    auth: { uid: 'userA', email: 'usera@gmail.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Bulk List Scraping on /users PII collection',
    collectionPath: '/users',
    operation: 'list',
    auth: { uid: 'other_user_uid', email: 'other@gmail.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Shadow Ghost Field Injection on /communityMessages create',
    collectionPath: '/communityMessages/msg_1',
    operation: 'create',
    auth: { uid: 'user_1', email: 'u1@gmail.com', email_verified: true },
    payload: { senderUid: 'user_1', text: 'Hi', ghostAdminFlag: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Canonical Room ID Spoofing on /directChats create',
    collectionPath: '/directChats/spoofed_room_id',
    operation: 'create',
    auth: { uid: 'userA', email: 'u1@gmail.com', email_verified: true },
    payload: { participantOneUid: 'userA', participantTwoUid: 'userB' },
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
    name: 'Peer Contact Tampering & Immortal Field Mutation on /directChats',
    collectionPath: '/directChats/userA__userB',
    operation: 'update',
    auth: { uid: 'userA', email: 'u1@gmail.com', email_verified: true },
    payload: { participantTwoWhatsapp: '+8801999999999' },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Unlocking on FULFILLED BloodRequest',
    collectionPath: '/requests/req_fulfilled',
    operation: 'update',
    auth: { uid: 'user_1', email: 'u1@gmail.com', email_verified: true },
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
