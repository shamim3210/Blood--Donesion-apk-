# BloodSearch Bangladesh — Zero-Trust Firestore Security Specification

## 1. Data Invariants & Master Sources of Truth
1. **Global Default-Deny**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Gate**: All writes require an authenticated user (`request.auth != null`) who is verified either via verified email (`request.auth.token.email_verified == true`) or verified SIM SMS OTP (`request.auth.token.firebase.sign_in_provider == 'phone'`).
3. **Exclusive Bootstrapped Super Owner & Cloud-Vaulted Admin Gate**:
   - Runtime owner `shamimrakib015@gmail.com` is the ONLY bootstrapped Super Admin, recognized strictly when `request.auth.token.email == 'shamimrakib015@gmail.com' && request.auth.token.email_verified == true` (prevents email spoofing).
   - Zero static admin secret codes or hashes exist in the client bundle or `firestore.rules`. Creating `/admins/{userId}` requires either `isBootstrappedSuperAdmin()` OR an active server-side `/adminInviteLocks/$(incoming().secretProofHash)` document (`active == true`) created exclusively by `shamimrakib015@gmail.com`. Only `isBootstrappedSuperAdmin()` can list/revoke `/admins` or manage `/adminInviteLocks`, and co-admins can never modify or delete `shamimrakib015@gmail.com` or delete user accounts.
4. **Anti-Self-Escalation (Atomic Role Sync)**:
   - A user creating `/users/{userId}` or `/donors/{donorId}` with `panelType == 'ADMIN'` MUST either already satisfy `isAdmin()` OR atomically create `/admins/$(request.auth.uid)` in the same batch (`existsAfter(/databases/$(database)/documents/admins/$(request.auth.uid))`).
5. **PII Split-Collection Isolation & Safe Null-Resource Pre-Flight Reads**:
   - Raw `email`, `phone`, `whatsappPhone`, and `facebookUrl` live strictly in `/users/{userId}` with `allow get: if isOwner(userId) || isAdmin()` and `allow list: if false`. Non-admin owners cannot mutate `email`, `uid`, or `createdAt`.
   - `/donors/{donorId}` contains only non-PII public fields (`maskedPhone`), safely permits pre-flight `getDoc` checks when `resource == null` without null-pointer errors, and enforces `resource.data.isPublic == true` on `list` without any `get()`/`exists()` calls.
6. **Terminal State Locking**:
   - Once `/requests/{requestId}` reaches `status in ['FULFILLED', 'CANCELLED']`, non-admin users cannot mutate it further.
7. **Temporal & Immutable Integrity**:
   - `createdAt == request.time` on `create`; `updatedAt == request.time` on `update`; `uid`, `ownerUid`, `authorUid`, `participantOneUid`, `participantTwoUid`, and `createdAt` are immutable on `update`.
8. **1-to-1 Direct Chat & Community Chat Isolation (Master Gate + Canonical Room ID + Query Enforcer)**:
   - `/communityMessages/{messageId}` contains zero raw phone PII, enforces `incoming().senderUid == request.auth.uid` + `incoming().createdAt == request.time`, and forbids client `update`s (`allow update: if false;`).
   - `/directChats/{chatId}` enforces canonical deterministic room IDs (`chatId == incoming().participantOneUid + '__' + incoming().participantTwoUid` and `incoming().participantOneUid < incoming().participantTwoUid`), safely allows participant-only pre-flight `getDoc` when `resource == null` (`chatId.split('__').size() == 2 && (chatId.split('__')[0] == request.auth.uid || chatId.split('__')[1] == request.auth.uid)`), and isolates existing rooms strictly to `participantOneUid == request.auth.uid || participantTwoUid == request.auth.uid` on both `get` and `list`.
   - `/directChats/{chatId}/messages/{messageId}` enforces Pillar 1 Master Gate via `get(/databases/$(database)/documents/directChats/$(chatId))` / `getAfter(...)` on `get`/`create`/`delete` (verifying parent membership and participant UID parity) and O(1) `resource.data.participantOneUid == request.auth.uid || resource.data.participantTwoUid == request.auth.uid` on `list`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Payload 1 (Privilege Escalation / Self-Admin)**: `POST /users/attacker1` with `{ ..., "panelType": "ADMIN" }` without `/admins/attacker1` existing.
2. **Payload 2 (Forged Admin Secret Proof)**: `POST /admins/attacker1` with `{ "uid": "attacker1", "secretProofHash": "0000000000000000000000000000000000000000000000000000000000000000", ... }`.
3. **Payload 3 (Email Spoofing Attack)**: Unverified account (`email: "shamimrakib015@gmail.com"`, `email_verified: false`) attempting `GET /users/victim1` or `PUT /bloodStock/A_POS`.
4. **Payload 4 (PII Cross-User Read & Non-Participant Room Probe)**: Authenticated user `uid: "userA"` attempting `GET /users/userB` or `GET /directChats/userB__userC` (even when `resource == null`).
5. **Payload 5 (PII Collection Scraping)**: Authenticated user attempting `LIST /users` or unrestricted `LIST /directChats`.
6. **Payload 6 (Shadow / Ghost Field Injection)**: `POST /donors/donor1` or `POST /communityMessages/msg1` with valid fields plus `"isSuperVerified": true`.
7. **Payload 7 (Identity & Canonical Room ID Spoofing on Create)**: Authenticated `uid: "userA"` creating `/directChats/fakeRoomId` where `chatId != participantOneUid + '__' + participantTwoUid` or creating message with `"senderUid": "userB"`.
8. **Payload 8 (ID Poisoning / Denial of Wallet)**: Creating `/donors/../../bad$id` or 500-char ID.
9. **Payload 9 (Value Poisoning on Update)**: Updating whitelisted field `available` on `/donors/donor1` with string `"yes"` instead of `bool`.
10. **Payload 10 (Immortal Field & Peer Contact Tampering)**: Participant `userA` updating `participantTwoWhatsapp`, `participantOneUid`, or `createdAt` on `/directChats/userA__userB`.
11. **Payload 11 (Terminal State Re-opening)**: Author attempting to change `/requests/req1` from `status: "FULFILLED"` back to `"ACTIVE"`.
12. **Payload 12 (Client Timestamp Forgery)**: Creating `/communityMessages/msg2` with a past/future client `Timestamp` instead of `serverTimestamp()` (`request.time`).

## 3. Test Suite Reference
See `/firestore.rules.test.ts` for executable verification of all Dirty Dozen payloads.
