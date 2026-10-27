# BloodSearch Bangladesh — Zero-Trust Firestore Security Specification

## 1. Data Invariants & Master Sources of Truth
1. **Global Default-Deny**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Gate**: All writes require an authenticated user (`request.auth != null`) who is verified either via verified email (`request.auth.token.email_verified == true`) or verified SIM SMS OTP (`request.auth.token.firebase.sign_in_provider == 'phone'`).
3. **Exclusive Bootstrapped Super Owner & Cloud-Vaulted Admin Gate**:
   - Runtime owner `shamimrakib015@gmail.com` is the ONLY bootstrapped Super Admin, recognized strictly when `request.auth.token.email == 'shamimrakib015@gmail.com' && request.auth.token.email_verified == true` (prevents email spoofing).
   - Zero static admin secret codes or hashes exist in the client bundle or `firestore.rules`. Creating `/admins/{userId}` requires either `isBootstrappedSuperAdmin()` OR an active server-side `/adminInviteLocks/$(incoming().secretProofHash)` document (`active == true`) created exclusively by `shamimrakib015@gmail.com`.
4. **Anti-Self-Escalation (Atomic Role Sync)**:
   - A user creating `/users/{userId}` or `/donors/{donorId}` with `panelType == 'ADMIN'` MUST either already satisfy `isAdmin()` OR atomically create `/admins/$(request.auth.uid)` in the same batch (`existsAfter(/databases/$(database)/documents/admins/$(request.auth.uid))`).
5. **PII Split-Collection Isolation & Explicit Donor Contact Consent**:
   - Raw `email`, `phone`, `whatsappPhone`, and `facebookUrl` live strictly in `/users/{userId}` with `allow get: if isOwner(userId) || isAdmin()` and `allow list: if false`.
   - `/donors/{donorId}` contains only non-PII public fields (`maskedPhone` guaranteed to contain `**`), plus non-PII availability & consent flags (`availabilityStatus`, `availabilityConfirmedAt`, `shareDirectContact`, `contactVisibility`, `allowCall`, `allowWhatsApp`, `allowSms`, `emergencyAlertsOptIn`, `alertsPaused`).
   - `/donorDirectContacts/{donorId}` isolates opted-in direct contact phone/WhatsApp in a separate non-listable (`allow list: if false`) collection! Single-document `get` is permitted ONLY when:
     - `isOwner(donorId)` or `isAdmin()`, OR
     - `existing().shareDirectContact == true && existing().availabilityStatus != 'DND'` AND (`existing().contactVisibility == 'PUBLIC_OPT_IN'` OR (`existing().contactVisibility == 'VERIFIED_SEEKERS' && isVerifiedUser()`)).
     - If a donor switches to `REQUEST_ONLY`, `shareDirectContact == false`, or `DND`, non-owner `get` access is immediately denied by Firestore.
6. **Consent Contact Requests (`/contactRequests/{contactReqId}`)**:
   - Deterministic ID `seekerUid + '__' + donorUid` prevents duplicate spam.
   - Readable/listable strictly by `seekerUid == request.auth.uid || donorUid == request.auth.uid`.
   - Only `donorUid` can approve (`status == 'APPROVED'`) and attach `approvedPhone`/`approvedWhatsApp`.
7. **Concurrent Emergency Broadcast Alerts (`/requestAlerts/{alertId}`)**:
   - Deterministic ID `requestId + '__' + donorUid` guarantees zero duplicate spam per request/donor pair.
   - Created strictly by verified `authorUid` when parent `/requests/$(requestId)` exists, belongs to `authorUid`, and has `status == 'ACTIVE'`.
   - Readable/listable strictly via O(1) Query Enforcer `donorUid == request.auth.uid || authorUid == request.auth.uid` (zero `get()` inside `allow list`).
   - Terminal lock: once `deliveryState == 'STOPPED_RESOLVED'`, no further client mutations are allowed.
8. **Terminal State Locking**:
   - Once `/requests/{requestId}` reaches `status in ['FULFILLED', 'CANCELLED', 'EXPIRED']`, non-admin users cannot mutate it further.
9. **Temporal & Immutable Integrity**:
   - `createdAt == request.time` on `create`; `updatedAt == request.time` on `update`; `uid`, `ownerUid`, `authorUid`, `seekerUid`, `donorUid`, `participantOneUid`, `participantTwoUid`, and `createdAt` are immutable on `update`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Payload 1 (Privilege Escalation / Self-Admin)**: `POST /users/attacker1` with `{ ..., "panelType": "ADMIN" }` without `/admins/attacker1` existing.
2. **Payload 2 (Forged Admin Secret Proof)**: `POST /admins/attacker1` with `{ "uid": "attacker1", "secretProofHash": "0000...0000" }`.
3. **Payload 3 (Email Spoofing Attack)**: Unverified account (`email: "shamimrakib015@gmail.com"`, `email_verified: false`) attempting `GET /users/victim1`.
4. **Payload 4 (PII Cross-User Read & Non-Opted-In Donor Contact Read)**: Authenticated user `uid: "userA"` attempting `GET /users/userB` or `GET /donorDirectContacts/privateDonor` where `shareDirectContact == false` or `contactVisibility == 'REQUEST_ONLY'` or `availabilityStatus == 'DND'`.
5. **Payload 5 (PII Collection Scraping)**: Authenticated user attempting `LIST /users` or `LIST /donorDirectContacts`.
6. **Payload 6 (Shadow / Ghost Field Injection)**: `POST /donors/donor1` or `POST /requestAlerts/req1__donor1` with valid fields plus `"isSuperVerified": true`.
7. **Payload 7 (Identity & Canonical ID Spoofing on Create)**: Authenticated `uid: "userA"` creating `/contactRequests/fakeId` or `/requestAlerts/fakeId` not matching canonical `uidA__uidB` / `reqId__donorUid`.
8. **Payload 8 (ID Poisoning / Denial of Wallet)**: Creating `/donors/../../bad$id` or 500-char ID.
9. **Payload 9 (Value Poisoning on Update)**: Updating whitelisted field `available` on `/donors/donor1` with string `"yes"` instead of `bool`.
10. **Payload 10 (Self-Approving Contact Consent Request)**: Seeker `userA` attempting to update `/contactRequests/userA__donorB` to `status: "APPROVED"`.
11. **Payload 11 (Terminal State Re-opening)**: Author attempting to change `/requests/req1` from `status: "FULFILLED"` or `"CANCELLED"` back to `"ACTIVE"`.
12. **Payload 12 (Client Timestamp Forgery)**: Creating `/requestAlerts/req1__donor1` with a client `Timestamp` instead of `serverTimestamp()` (`request.time`).

## 3. Test Suite Reference
See `/firestore.rules.test.ts` and `/tests/emergencyContactSystem.test.ts` for executable verification.
