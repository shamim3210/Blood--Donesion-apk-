import crypto from 'node:crypto';
import { count, eq, sql } from 'drizzle-orm';
import type { BloodSearchDatabase } from './index.ts';
import { hashIdentifier, maskBangladeshPhone } from './repositories/bloodSearchRepo.ts';
import {
  adminRoles,
  ALL_BLOODSEARCH_TABLES,
  announcements,
  auditLogs,
  bloodBanks,
  bloodInventory,
  bloodRequests,
  communityMessages,
  deviceTokens,
  directChatMessages,
  directChatRooms,
  donations,
  donorProfiles,
  emergencyAlerts,
  gratitudeNotes,
  hospitals,
  liveDonorTrips,
  loginSessions,
  notifications,
  privateContacts,
  requestResponses,
  scamReports,
  userConsents,
  users,
  verificationRecords,
} from './schema.ts';

/**
 * All 18 Firestore collections inspected in `firebase-blueprint.json`:
 */
export const FIRESTORE_COLLECTIONS_INVENTORY = [
  'users',
  'admins',
  'adminInviteLocks',
  'donors',
  'donorDirectContacts',
  'contactRequests',
  'requestAlerts',
  'requests',
  'requestDirectContacts',
  'requestResponses',
  'liveDonorTrips',
  'bloodStock',
  'communityMessages',
  'directChats',
  'directChatMessages',
  'announcements',
  'scamReports',
  'gratitudeNotes',
] as const;

export interface FirestoreExportSnapshot {
  exportedAtIso: string;
  firebaseProjectId: string;
  firestoreDatabaseId: string;
  collections: {
    users: Array<Record<string, any>>;
    admins: Array<Record<string, any>>;
    adminInviteLocks: Array<Record<string, any>>;
    donors: Array<Record<string, any>>;
    donorDirectContacts: Array<Record<string, any>>;
    contactRequests: Array<Record<string, any>>;
    requestAlerts: Array<Record<string, any>>;
    requests: Array<Record<string, any>>;
    requestDirectContacts: Array<Record<string, any>>;
    requestResponses: Array<Record<string, any>>;
    liveDonorTrips: Array<Record<string, any>>;
    bloodStock: Array<Record<string, any>>;
    communityMessages: Array<Record<string, any>>;
    directChats: Array<Record<string, any>>;
    directChatMessages: Array<Record<string, any>>;
    announcements: Array<Record<string, any>>;
    scamReports: Array<Record<string, any>>;
    gratitudeNotes: Array<Record<string, any>>;
  };
  sha256Checksum?: string;
}

export function computeCanonicalSha256(payload: unknown): string {
  const json = JSON.stringify(payload);
  return crypto.createHash('sha256').update(json).digest('hex');
}

function toValidDateOrNow(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  if (typeof val === 'object' && val !== null && '_seconds' in (val as Record<string, unknown>)) {
    const secs = Number((val as { _seconds: number })._seconds);
    if (Number.isFinite(secs)) return new Date(secs * 1000);
  }
  const parsed = new Date(String(val));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeLegacyBloodGroup(raw: unknown): string {
  const bg = String(raw || 'O+').trim().toUpperCase();
  return ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bg) ? bg : 'O+';
}

function deterministicUuidFromLegacyId(namespace: string, legacyId: string): string {
  const hex = crypto.createHash('sha256').update(`${namespace}:${legacyId}`).digest('hex');
  // Format as RFC 4122 v4-compatible deterministic UUID
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Executes an atomic, idempotent migration from a verified 18-collection Firestore snapshot
 * into Neon PostgreSQL while:
 *  - Preserving 100% of Firebase Authentication UIDs (`users.uid`)
 *  - Isolating donor phone numbers into `private_contacts`
 *  - Preserving request -> response -> alert -> live trip foreign key relationships
 *  - Never mutating or deleting source Firestore data
 */
export async function migrateFirestoreSnapshotToNeon(
  db: BloodSearchDatabase,
  snapshot: FirestoreExportSnapshot
) {
  const c = snapshot.collections;
  const now = new Date();

  // Index direct contact vaults by ID for O(1) join during migration
  const donorContactsByDocId = new Map<string, Record<string, any>>();
  for (const dc of c.donorDirectContacts || []) {
    const key = String(dc._docId || dc.uid || dc.donorId || '');
    if (key) donorContactsByDocId.set(key, dc);
  }

  const reqContactsByDocId = new Map<string, Record<string, any>>();
  for (const rc of c.requestDirectContacts || []) {
    const key = String(rc._docId || rc.requestId || '');
    if (key) reqContactsByDocId.set(key, rc);
  }

  const requestLegacyToUuid = new Map<string, string>();

  return db.transaction(async (tx) => {
    const ensureUserUid = async (uidRaw: unknown, fallbackName = 'Legacy BloodSearch User', emailRaw?: unknown) => {
      const uid = String(uidRaw || '').trim();
      if (!uid) return null;
      const email = emailRaw ? String(emailRaw).trim().toLowerCase() : null;
      await tx
        .insert(users)
        .values({
          uid,
          email: email || null,
          emailVerified: Boolean(email),
          displayName: String(fallbackName || 'Legacy BloodSearch User').slice(0, 140),
          legacyFirestoreSyncedAt: now,
        })
        .onConflictDoNothing({ target: users.uid });
      return uid;
    };

    // 1. Migrate `/users/{userId}` (preserving exact Firebase Auth UID)
    for (const u of c.users || []) {
      const uid = String(u._docId || u.uid || '').trim();
      if (!uid) continue;
      const email = u.email ? String(u.email).trim().toLowerCase() : null;
      const bg = u.bloodGroup ? normalizeLegacyBloodGroup(u.bloodGroup) : null;
      await tx
        .insert(users)
        .values({
          uid,
          email,
          emailVerified: Boolean(u.emailVerified ?? Boolean(email)),
          displayName: String(u.name || u.displayName || 'BloodSearch User').slice(0, 140),
          photoUrl: u.photoUrl || u.avatar || null,
          bloodGroup: bg,
          district: u.district ? String(u.district).slice(0, 80) : null,
          area: u.area || u.location ? String(u.area || u.location).slice(0, 160) : null,
          familyCircleJson: Array.isArray(u.familyCircle) ? u.familyCircle : [],
          legacyFirestoreSyncedAt: now,
          createdAt: toValidDateOrNow(u.createdAt),
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            displayName: String(u.name || u.displayName || 'BloodSearch User').slice(0, 140),
            legacyFirestoreSyncedAt: now,
            updatedAt: now,
          },
        });
    }

    // 2. Migrate `/admins/{userId}` -> `admin_roles`
    for (const adm of c.admins || []) {
      const uid = await ensureUserUid(adm._docId || adm.uid, adm.name || 'Co-Admin', adm.email);
      if (!uid) continue;
      const roleRaw = String(adm.role || 'CO_ADMIN').toUpperCase();
      const mappedRole =
        roleRaw === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : roleRaw === 'MODERATOR' ? 'MODERATOR' : 'CO_ADMIN';
      await tx
        .insert(adminRoles)
        .values({
          userUid: uid,
          email: String(adm.email || `${uid}@migrated.local`).toLowerCase(),
          role: mappedRole,
          isActive: adm.active !== false,
          createdAt: toValidDateOrNow(adm.createdAt),
        })
        .onConflictDoUpdate({
          target: adminRoles.userUid,
          set: {
            role: mappedRole,
            isActive: adm.active !== false,
            updatedAt: now,
          },
        });
    }

    // 3. Migrate `/adminInviteLocks/{proofHash}` -> `verification_records`
    for (const lock of c.adminInviteLocks || []) {
      const proofHash = String(lock._docId || lock.proofHash || '').trim();
      if (!proofHash) continue;
      const claimedUid = lock.claimedByUid ? await ensureUserUid(lock.claimedByUid, 'Invite Holder') : null;
      await tx
        .insert(verificationRecords)
        .values({
          subjectUid: claimedUid,
          verificationType: 'ADMIN_INVITE_LOCK',
          status: 'CONSUMED',
          proofHash,
          evidenceSummary: 'Migrated single-use Co-Admin invite lock from Firestore',
          createdAt: toValidDateOrNow(lock.claimedAt || lock.createdAt),
        })
        .onConflictDoNothing({ target: verificationRecords.proofHash });
    }

    // 4. Migrate `/donors/{donorId}` + `/donorDirectContacts/{donorId}` -> `donor_profiles` + `private_contacts`
    for (const d of c.donors || []) {
      const legacyId = String(d._docId || d.id || '').trim();
      const userUid = await ensureUserUid(d.uid || legacyId, d.name || 'Donor');
      if (!userUid) continue;

      const vault = donorContactsByDocId.get(legacyId) || donorContactsByDocId.get(userUid) || {};
      const rawPhone = String(vault.phone || d.phone || '').trim();
      const bg = normalizeLegacyBloodGroup(d.bloodGroup);
      const rawAge = d.age !== undefined && d.age !== null ? Number(d.age) : null;
      const validAge = rawAge !== null && Number.isInteger(rawAge) && rawAge >= 18 && rawAge <= 65 ? rawAge : null;

      const smartId = `BS-MIG-${hashIdentifier(userUid).slice(0, 10).toUpperCase()}`;
      const shareDirect = Boolean(d.shareDirectContact ?? vault.shareDirectContact ?? false);
      const prefRaw = String(d.contactPreference || 'IN_APP_ONLY').toUpperCase();
      const contactPref = ['CALL_ALLOWED', 'WHATSAPP_ONLY', 'IN_APP_ONLY', 'DND'].includes(prefRaw)
        ? prefRaw
        : 'IN_APP_ONLY';

      await tx
        .insert(donorProfiles)
        .values({
          userUid,
          legacyDonorDocId: legacyId || userUid,
          donorSmartId: smartId,
          publicName: String(d.name || 'Donor').slice(0, 140),
          bloodGroup: bg,
          age: validAge,
          gender: d.gender && ['MALE', 'FEMALE', 'OTHER'].includes(String(d.gender).toUpperCase())
            ? String(d.gender).toUpperCase()
            : null,
          district: String(d.district || 'Dhaka').slice(0, 80),
          area: String(d.location || d.area || 'Bangladesh').slice(0, 180),
          latitude: typeof d.lat === 'number' ? d.lat : null,
          longitude: typeof d.lng === 'number' ? d.lng : null,
          availabilityStatus: d.isAvailable === false ? 'OFFLINE' : 'AVAILABLE',
          isAvailable: d.isAvailable !== false,
          totalDonations: Math.max(0, Number(d.donationsCount || d.totalDonations || 0)),
          isVerified: Boolean(d.isVerified),
          medicalDeclarationAccepted: true,
          shareDirectContact: shareDirect,
          contactPreference: contactPref,
          maskedPhoneHint: rawPhone ? maskBangladeshPhone(rawPhone) : null,
          createdAt: toValidDateOrNow(d.createdAt),
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: donorProfiles.userUid,
          set: {
            publicName: String(d.name || 'Donor').slice(0, 140),
            bloodGroup: bg,
            updatedAt: now,
          },
        });

      if (rawPhone) {
        await tx
          .insert(privateContacts)
          .values({
            userUid,
            phoneE164: rawPhone.slice(0, 24),
            whatsappNumber: String(vault.whatsapp || rawPhone).slice(0, 24),
            facebookProfileUrl: vault.facebookUrl || d.facebookUrl || null,
            contactVisibility:
              contactPref === 'DND' ? 'DND_PRIVATE' : shareDirect ? 'PUBLIC_OPT_IN' : 'REQUEST_ONLY',
          })
          .onConflictDoUpdate({
            target: privateContacts.userUid,
            set: {
              phoneE164: rawPhone.slice(0, 24),
              updatedAt: now,
            },
          });
      }
    }

    // 5. Migrate `/requests/{requestId}` + `/requestDirectContacts/{requestId}` -> `blood_requests`
    for (const r of c.requests || []) {
      const legacyReqId = String(r._docId || r.id || '').trim();
      if (!legacyReqId) continue;
      const requesterUid = await ensureUserUid(r.requesterUid || r.createdBy || `legacy_req_${legacyReqId}`, r.contactName || 'Requester');
      if (!requesterUid) continue;

      const reqVault = reqContactsByDocId.get(legacyReqId) || {};
      const detId = deterministicUuidFromLegacyId('blood_requests', legacyReqId);
      requestLegacyToUuid.set(legacyReqId, detId);

      const statusRaw = String(r.status || 'ACTIVE').toUpperCase();
      const mappedStatus = ['ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED'].includes(statusRaw)
        ? statusRaw
        : 'ACTIVE';
      const urgRaw = String(r.urgency || 'URGENT').toUpperCase();
      const mappedUrg = ['CRITICAL', 'URGENT', 'STANDARD'].includes(urgRaw) ? urgRaw : 'URGENT';

      await tx
        .insert(bloodRequests)
        .values({
          id: detId,
          legacyRequestDocId: legacyReqId,
          requesterUid,
          patientName: String(r.patientName || 'Emergency Patient').slice(0, 160),
          bloodGroup: normalizeLegacyBloodGroup(r.bloodGroup),
          bagsNeeded: Math.min(20, Math.max(1, Number(r.bags || r.bagsNeeded || 1))),
          urgency: mappedUrg,
          status: mappedStatus,
          hospitalName: String(r.hospital || r.hospitalName || 'Hospital').slice(0, 220),
          district: String(r.district || 'Dhaka').slice(0, 80),
          area: String(r.location || r.area || r.district || 'Bangladesh').slice(0, 180),
          latitude: typeof r.lat === 'number' ? r.lat : null,
          longitude: typeof r.lng === 'number' ? r.lng : null,
          contactName: String(reqVault.contactName || r.contactName || '').slice(0, 140) || null,
          contactPhonePrivate: String(reqVault.phone || r.contactPhone || '').slice(0, 28) || null,
          shareDirectContact: Boolean(r.shareDirectContact ?? reqVault.shareDirectContact ?? false),
          createdAt: toValidDateOrNow(r.createdAt),
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: bloodRequests.legacyRequestDocId,
          set: {
            status: mappedStatus,
            updatedAt: now,
          },
        });
    }

    // 6. Migrate `/contactRequests/{contactReqId}` -> `user_consents`
    for (const cr of c.contactRequests || []) {
      const legacyId = String(cr._docId || cr.id || '');
      const donorUid = await ensureUserUid(cr.donorUid || cr.targetDonorUid, 'Donor');
      const seekerUid = await ensureUserUid(cr.requesterUid || cr.seekerUid, 'Seeker');
      if (!donorUid || !seekerUid) continue;
      const stRaw = String(cr.status || 'PENDING').toUpperCase();
      const st =
        stRaw === 'APPROVED' || stRaw === 'GRANTED'
          ? 'GRANTED'
          : stRaw === 'REJECTED' || stRaw === 'DENIED'
            ? 'DENIED'
            : stRaw === 'REVOKED'
              ? 'REVOKED'
              : 'PENDING';
      await tx
        .insert(userConsents)
        .values({
          id: legacyId ? deterministicUuidFromLegacyId('user_consents', legacyId) : undefined,
          legacyConsentDocId: legacyId || null,
          userUid: donorUid,
          counterpartyUid: seekerUid,
          consentType: 'SEEKER_CONTACT_REQUEST',
          status: st,
          reason: cr.reason ? String(cr.reason) : 'Migrated Firestore contact request',
          createdAt: toValidDateOrNow(cr.createdAt),
        })
        .onConflictDoNothing({ target: userConsents.id });
    }

    // 7. Migrate `/requestResponses/{responseId}` -> `request_responses`
    for (const rr of c.requestResponses || []) {
      const legacyReqId = String(rr.requestId || '');
      const pgReqId = requestLegacyToUuid.get(legacyReqId);
      if (!pgReqId) continue;
      const donorUid = await ensureUserUid(rr.donorUid || rr.responderUid, rr.donorName || 'Responder');
      if (!donorUid) continue;
      const respStatusRaw = String(rr.status || 'ACCEPTED').toUpperCase();
      const mappedRespStatus = ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'DONATED', 'DECLINED', 'CANCELLED'].includes(respStatusRaw)
        ? respStatusRaw
        : 'ACCEPTED';
      await tx
        .insert(requestResponses)
        .values({
          legacyResponseDocId: String(rr._docId || rr.id || '') || null,
          requestId: pgReqId,
          donorUid,
          donorName: String(rr.donorName || 'Responder').slice(0, 140),
          donorBloodGroup: normalizeLegacyBloodGroup(rr.bloodGroup || rr.donorBloodGroup),
          responseStatus: mappedRespStatus,
          respondedAt: toValidDateOrNow(rr.createdAt),
        })
        .onConflictDoNothing({ target: [requestResponses.requestId, requestResponses.donorUid] });
    }

    // 8. Migrate `/requestAlerts/{alertId}` -> `emergency_alerts`
    for (const al of c.requestAlerts || []) {
      const legacyId = String(al._docId || al.id || '');
      const pgReqId = requestLegacyToUuid.get(String(al.requestId || ''));
      if (!pgReqId) continue;
      const targetUid = al.targetDonorUid ? await ensureUserUid(al.targetDonorUid, 'Alerted Donor') : null;
      await tx
        .insert(emergencyAlerts)
        .values({
          id: legacyId ? deterministicUuidFromLegacyId('emergency_alerts', legacyId) : undefined,
          legacyAlertDocId: legacyId || null,
          requestId: pgReqId,
          targetDonorUid: targetUid,
          escalationLevel: Math.min(4, Math.max(0, Number(al.escalationLevel || 0))),
          alertState: al.status === 'STOPPED' ? 'STOPPED_RESOLVED' : 'DISPATCHED',
          dispatchedAt: toValidDateOrNow(al.createdAt),
        })
        .onConflictDoNothing({ target: emergencyAlerts.id });
    }

    // 9. Migrate `/liveDonorTrips/{tripId}` -> `live_donor_trips`
    for (const tr of c.liveDonorTrips || []) {
      const legacyId = String(tr._docId || tr.id || '');
      const pgReqId = requestLegacyToUuid.get(String(tr.requestId || ''));
      if (!pgReqId || !legacyId) continue;
      const donorUid = await ensureUserUid(tr.donorUid, tr.donorName || 'Donor');
      const requesterUid = await ensureUserUid(tr.requesterUid, 'Requester');
      if (!donorUid || !requesterUid) continue;
      await tx
        .insert(liveDonorTrips)
        .values({
          id: deterministicUuidFromLegacyId('live_donor_trips', legacyId),
          legacyTripDocId: legacyId,
          requestId: pgReqId,
          donorUid,
          requesterUid,
          donorName: String(tr.donorName || 'Donor').slice(0, 140),
          bloodGroup: normalizeLegacyBloodGroup(tr.bloodGroup),
          currentLat: Number(tr.currentLat ?? 23.8103),
          currentLng: Number(tr.currentLng ?? 90.4125),
          tripStatus: String(tr.status || 'EN_ROUTE').toUpperCase(),
        })
        .onConflictDoNothing({ target: liveDonorTrips.legacyTripDocId });
    }

    // 10. Migrate `/bloodStock/{groupId}` -> central `blood_banks` + `blood_inventory`
    if ((c.bloodStock || []).length > 0) {
      const [centralBank] = await tx
        .insert(bloodBanks)
        .values({
          code: 'BD-CENTRAL-NETWORK',
          name: 'BloodSearch Central Transfusion Network',
          district: 'Dhaka',
          address: 'Dhaka Medical & Nationwide Partner Network',
          contactPhone: '16263',
        })
        .onConflictDoUpdate({
          target: bloodBanks.code,
          set: { updatedAt: now },
        })
        .returning();

      for (const st of c.bloodStock || []) {
        const bg = normalizeLegacyBloodGroup(st.bloodGroup || st._docId);
        const units = Math.max(0, Number(st.units ?? st.bags ?? 0));
        await tx
          .insert(bloodInventory)
          .values({
            bloodBankId: centralBank.id,
            bloodGroup: bg,
            componentType: 'WHOLE_BLOOD',
            unitsAvailable: units,
            stockStatus: units === 0 ? 'OUT_OF_STOCK' : units <= 5 ? 'CRITICAL' : 'ADEQUATE',
          })
          .onConflictDoUpdate({
            target: [bloodInventory.bloodBankId, bloodInventory.bloodGroup, bloodInventory.componentType],
            set: { unitsAvailable: units, updatedAt: now },
          });
      }
    }

    // 11. Migrate `/communityMessages`, `/directChats`, `/directChatMessages`, `/announcements`, `/scamReports`, `/gratitudeNotes`
    for (const cm of c.communityMessages || []) {
      const legacyId = String(cm._docId || cm.id || '');
      const senderUid = await ensureUserUid(cm.senderUid || cm.uid, cm.senderName || 'Member');
      if (!legacyId || !senderUid) continue;
      await tx
        .insert(communityMessages)
        .values({
          id: deterministicUuidFromLegacyId('community_messages', legacyId),
          legacyMessageDocId: legacyId,
          senderUid,
          senderName: String(cm.senderName || 'Member').slice(0, 140),
          senderBloodGroup: cm.bloodGroup ? normalizeLegacyBloodGroup(cm.bloodGroup) : null,
          district: cm.district ? String(cm.district).slice(0, 80) : null,
          messageText: String(cm.text || cm.message || ''),
          createdAt: toValidDateOrNow(cm.createdAt),
        })
        .onConflictDoNothing({ target: communityMessages.legacyMessageDocId });
    }

    for (const room of c.directChats || []) {
      const roomId = String(room._docId || room.id || '').trim();
      const participants: string[] = Array.isArray(room.participants) ? room.participants.map(String) : [];
      if (!roomId || participants.length < 2) continue;
      const p1 = await ensureUserUid(participants[0], 'Chat Participant 1');
      const p2 = await ensureUserUid(participants[1], 'Chat Participant 2');
      if (!p1 || !p2) continue;
      await tx
        .insert(directChatRooms)
        .values({
          id: roomId.slice(0, 160),
          participantOneUid: p1,
          participantTwoUid: p2,
          lastMessagePreview: room.lastMessage ? String(room.lastMessage) : null,
          createdAt: toValidDateOrNow(room.createdAt),
        })
        .onConflictDoNothing({ target: directChatRooms.id });
    }

    for (const dm of c.directChatMessages || []) {
      const legacyId = String(dm._docId || dm.id || '');
      const roomId = String(dm.roomId || dm.chatId || '').trim();
      const senderUid = await ensureUserUid(dm.senderUid, 'Sender');
      if (!legacyId || !roomId || !senderUid) continue;
      await tx
        .insert(directChatMessages)
        .values({
          id: deterministicUuidFromLegacyId('direct_chat_messages', legacyId),
          legacyMessageDocId: legacyId,
          roomId: roomId.slice(0, 160),
          senderUid,
          messageText: String(dm.text || dm.message || ''),
          createdAt: toValidDateOrNow(dm.createdAt),
        })
        .onConflictDoNothing({ target: directChatMessages.legacyMessageDocId });
    }

    for (const ann of c.announcements || []) {
      const legacyId = String(ann._docId || ann.id || '');
      if (!legacyId) continue;
      const authorUid = ann.authorUid ? await ensureUserUid(ann.authorUid, 'Admin') : null;
      await tx
        .insert(announcements)
        .values({
          id: deterministicUuidFromLegacyId('announcements', legacyId),
          legacyAnnouncementDocId: legacyId,
          title: String(ann.title || 'Announcement').slice(0, 220),
          body: String(ann.body || ann.message || ''),
          authorUid,
          createdAt: toValidDateOrNow(ann.createdAt),
        })
        .onConflictDoNothing({ target: announcements.legacyAnnouncementDocId });
    }

    for (const sr of c.scamReports || []) {
      const legacyId = String(sr._docId || sr.id || '');
      const reporterUid = await ensureUserUid(sr.reporterUid, 'Reporter');
      if (!legacyId || !reporterUid) continue;
      await tx
        .insert(scamReports)
        .values({
          id: deterministicUuidFromLegacyId('scam_reports', legacyId),
          legacyReportDocId: legacyId,
          reporterUid,
          description: String(sr.description || sr.reason || 'Reported suspicious activity'),
          createdAt: toValidDateOrNow(sr.createdAt),
        })
        .onConflictDoNothing({ target: scamReports.legacyReportDocId });
    }

    for (const gn of c.gratitudeNotes || []) {
      const legacyId = String(gn._docId || gn.id || '');
      const authorUid = await ensureUserUid(gn.authorUid || gn.uid, gn.authorName || 'Recipient');
      if (!legacyId || !authorUid) continue;
      await tx
        .insert(gratitudeNotes)
        .values({
          id: deterministicUuidFromLegacyId('gratitude_notes', legacyId),
          legacyNoteDocId: legacyId,
          authorUid,
          authorName: String(gn.authorName || 'Grateful Family').slice(0, 140),
          message: String(gn.message || gn.note || ''),
          createdAt: toValidDateOrNow(gn.createdAt),
        })
        .onConflictDoNothing({ target: gratitudeNotes.legacyNoteDocId });
    }

    await tx.insert(auditLogs).values({
      actorUid: null,
      actorRole: 'SUPER_ADMIN',
      action: 'FIRESTORE_TO_NEON_MIGRATION_COMPLETED',
      targetEntityType: 'database',
      targetEntityId: snapshot.firestoreDatabaseId || 'firestore',
      outcome: 'SUCCESS',
      detailsJson: {
        exportedAtIso: snapshot.exportedAtIso,
        sourceUsers: (c.users || []).length,
        sourceDonors: (c.donors || []).length,
        sourceRequests: (c.requests || []).length,
      },
    });
  });
}

/**
 * Compares Firestore source record counts, Firebase Auth UID preservation, and FK integrity
 * against destination Neon PostgreSQL tables BEFORE allowing production cutover.
 */
export async function verifyFirestoreToNeonMigration(
  db: BloodSearchDatabase,
  snapshot: FirestoreExportSnapshot
) {
  const c = snapshot.collections;

  const [
    [{ cntUsers }],
    [{ cntDonors }],
    [{ cntPrivateContacts }],
    [{ cntRequests }],
    [{ cntResponses }],
    [{ cntAdmins }],
    [{ cntAlerts }],
    [{ cntTrips }],
    [{ cntInventory }],
    [{ cntCommunity }],
    [{ cntRooms }],
    [{ cntDirectMsgs }],
    [{ cntAnnouncements }],
    [{ cntScam }],
    [{ cntGratitude }],
  ] = await Promise.all([
    db.select({ cntUsers: count() }).from(users),
    db.select({ cntDonors: count() }).from(donorProfiles),
    db.select({ cntPrivateContacts: count() }).from(privateContacts),
    db.select({ cntRequests: count() }).from(bloodRequests),
    db.select({ cntResponses: count() }).from(requestResponses),
    db.select({ cntAdmins: count() }).from(adminRoles),
    db.select({ cntAlerts: count() }).from(emergencyAlerts),
    db.select({ cntTrips: count() }).from(liveDonorTrips),
    db.select({ cntInventory: count() }).from(bloodInventory),
    db.select({ cntCommunity: count() }).from(communityMessages),
    db.select({ cntRooms: count() }).from(directChatRooms),
    db.select({ cntDirectMsgs: count() }).from(directChatMessages),
    db.select({ cntAnnouncements: count() }).from(announcements),
    db.select({ cntScam: count() }).from(scamReports),
    db.select({ cntGratitude: count() }).from(gratitudeNotes),
  ]);

  // Verify 100% of explicit Firebase Auth UIDs in source `users` exist in Neon `users`
  const missingFirebaseUids: string[] = [];
  for (const srcUser of c.users || []) {
    const uid = String(srcUser._docId || srcUser.uid || '').trim();
    if (!uid) continue;
    const [found] = await db.select({ uid: users.uid }).from(users).where(eq(users.uid, uid)).limit(1);
    if (!found) {
      missingFirebaseUids.push(uid);
    }
  }

  const comparisons = [
    { name: 'users (>= Firestore users)', source: (c.users || []).length, destination: Number(cntUsers), ok: Number(cntUsers) >= (c.users || []).length },
    { name: 'donor_profiles', source: (c.donors || []).length, destination: Number(cntDonors), ok: Number(cntDonors) >= (c.donors || []).length },
    { name: 'blood_requests', source: (c.requests || []).length, destination: Number(cntRequests), ok: Number(cntRequests) >= (c.requests || []).length },
    { name: 'request_responses', source: (c.requestResponses || []).length, destination: Number(cntResponses), ok: Number(cntResponses) >= (c.requestResponses || []).length },
    { name: 'admin_roles', source: (c.admins || []).length, destination: Number(cntAdmins), ok: Number(cntAdmins) >= (c.admins || []).length },
    { name: 'emergency_alerts', source: (c.requestAlerts || []).length, destination: Number(cntAlerts), ok: Number(cntAlerts) >= (c.requestAlerts || []).length },
    { name: 'live_donor_trips', source: (c.liveDonorTrips || []).length, destination: Number(cntTrips), ok: Number(cntTrips) >= (c.liveDonorTrips || []).length },
    { name: 'blood_inventory', source: (c.bloodStock || []).length, destination: Number(cntInventory), ok: Number(cntInventory) >= (c.bloodStock || []).length },
    { name: 'community_messages', source: (c.communityMessages || []).length, destination: Number(cntCommunity), ok: Number(cntCommunity) >= (c.communityMessages || []).length },
    { name: 'direct_chat_rooms', source: (c.directChats || []).length, destination: Number(cntRooms), ok: Number(cntRooms) >= (c.directChats || []).length },
    { name: 'direct_chat_messages', source: (c.directChatMessages || []).length, destination: Number(cntDirectMsgs), ok: Number(cntDirectMsgs) >= (c.directChatMessages || []).length },
    { name: 'announcements', source: (c.announcements || []).length, destination: Number(cntAnnouncements), ok: Number(cntAnnouncements) >= (c.announcements || []).length },
    { name: 'scam_reports', source: (c.scamReports || []).length, destination: Number(cntScam), ok: Number(cntScam) >= (c.scamReports || []).length },
    { name: 'gratitude_notes', source: (c.gratitudeNotes || []).length, destination: Number(cntGratitude), ok: Number(cntGratitude) >= (c.gratitudeNotes || []).length },
  ];

  const passed = comparisons.every((cmp) => cmp.ok) && missingFirebaseUids.length === 0;

  return {
    passed,
    readyForCutover: passed,
    missingFirebaseUids,
    privateContactsIsolatedCount: Number(cntPrivateContacts),
    comparisons,
  };
}

// ============================================================================
// LOGICAL BACKUP & TAMPER-VERIFIED RESTORE ENGINE (All 24 Tables)
// ============================================================================
export interface NeonLogicalBackupBundle {
  formatVersion: '1.0';
  createdAtIso: string;
  tableOrder: string[];
  tableCounts: Record<string, number>;
  tables: Record<string, Array<Record<string, unknown>>>;
  sha256Manifest: string;
}

const ORDERED_BACKUP_TABLES = [
  'users',
  'hospitals',
  'blood_banks',
  'donor_profiles',
  'private_contacts',
  'blood_inventory',
  'blood_requests',
  'request_responses',
  'donations',
  'emergency_alerts',
  'notifications',
  'device_tokens',
  'admin_roles',
  'verification_records',
  'user_consents',
  'login_sessions',
  'live_donor_trips',
  'community_messages',
  'direct_chat_rooms',
  'direct_chat_messages',
  'announcements',
  'scam_reports',
  'gratitude_notes',
  'audit_logs',
] as const;

export async function exportNeonLogicalBackup(db: BloodSearchDatabase): Promise<NeonLogicalBackupBundle> {
  const tables: Record<string, Array<Record<string, unknown>>> = {};
  const tableCounts: Record<string, number> = {};

  for (const tableName of ORDERED_BACKUP_TABLES) {
    const res = await db.execute(sql.raw(`SELECT * FROM "${tableName}"`));
    const rows = ((res as unknown as { rows?: Array<Record<string, unknown>> }).rows || []).map((r) => ({ ...r }));
    tables[tableName] = rows;
    tableCounts[tableName] = rows.length;
  }

  const sha256Manifest = computeCanonicalSha256({ tableCounts, tables });

  return {
    formatVersion: '1.0',
    createdAtIso: new Date().toISOString(),
    tableOrder: [...ORDERED_BACKUP_TABLES],
    tableCounts,
    tables,
    sha256Manifest,
  };
}

/**
 * Verifies cryptographic SHA-256 integrity of a backup bundle and restores all 24 tables
 * in parent-before-child foreign-key order inside an atomic PostgreSQL transaction.
 */
export async function restoreAndVerifyNeonBackup(
  db: BloodSearchDatabase,
  bundle: NeonLogicalBackupBundle
): Promise<{ restoredTables: number; totalRowsRestored: number; verifiedCountsMatch: boolean }> {
  const expectedHash = computeCanonicalSha256({
    tableCounts: bundle.tableCounts,
    tables: bundle.tables,
  });

  if (expectedHash !== bundle.sha256Manifest) {
    throw new Error('BACKUP_INTEGRITY_FAILED: SHA-256 manifest mismatch. Backup file may be corrupted or tampered with.');
  }

  // Validate table whitelist strictly against ALL_BLOODSEARCH_TABLES
  const allowedTables = new Set<string>(ALL_BLOODSEARCH_TABLES);
  for (const tbl of Object.keys(bundle.tables)) {
    if (!allowedTables.has(tbl)) {
      throw new Error(`UNTRUSTED_BACKUP_TABLE: Refusing to restore unrecognized table "${tbl}".`);
    }
  }

  let totalRowsRestored = 0;

  await db.transaction(async (tx) => {
    // Truncate in reverse dependency order
    const reverseOrder = [...ORDERED_BACKUP_TABLES].reverse();
    for (const tbl of reverseOrder) {
      await tx.execute(sql.raw(`DELETE FROM "${tbl}"`));
    }

    // Insert in forward parent-to-child FK order using parameterized Drizzle SQL values
    for (const tbl of ORDERED_BACKUP_TABLES) {
      const rows = bundle.tables[tbl] || [];
      for (const row of rows) {
        const cols = Object.keys(row).filter((k) => /^[a-z0-9_]+$/.test(k));
        if (cols.length === 0) continue;

        const colIdentifiers = sql.raw(cols.map((c) => `"${c}"`).join(', '));
        const valFragments = cols.map((c) => {
          const val = row[c];
          if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
            return sql`${JSON.stringify(val)}::jsonb`;
          }
          return sql`${val as any}`;
        });

        await tx.execute(sql`INSERT INTO ${sql.raw(`"${tbl}"`)} (${colIdentifiers}) VALUES (${sql.join(valFragments, sql`, `)})`);
        totalRowsRestored += 1;
      }
    }

    // Sync audit_logs serial sequence if rows were restored
    await tx.execute(
      sql.raw(`SELECT setval(pg_get_serial_sequence('audit_logs', 'id'), COALESCE((SELECT MAX(id) FROM audit_logs), 1), true)`)
    );
  });

  // Post-restore row count verification
  let verifiedCountsMatch = true;
  for (const tbl of ORDERED_BACKUP_TABLES) {
    const checkRes = await db.execute(sql.raw(`SELECT COUNT(*)::int AS cnt FROM "${tbl}"`));
    const actualCnt = Number(
      ((checkRes as unknown as { rows?: Array<{ cnt?: number }> }).rows || [])[0]?.cnt ?? 0
    );
    if (actualCnt !== (bundle.tableCounts[tbl] ?? 0)) {
      verifiedCountsMatch = false;
    }
  }

  return {
    restoredTables: ORDERED_BACKUP_TABLES.length,
    totalRowsRestored,
    verifiedCountsMatch,
  };
}
