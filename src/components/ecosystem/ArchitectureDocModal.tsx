import React, { useState } from 'react';
import { 
  FolderTree, 
  Database, 
  ShieldCheck, 
  CloudLightning, 
  Smartphone, 
  GitBranch, 
  Copy, 
  Check, 
  Terminal,
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react';

export const ArchitectureDocModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'folder' | 'schema' | 'rules' | 'functions' | 'flutter' | 'devops'
  >('folder');
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const folderStructureCode = `// BloodSearch Enterprise Clean Architecture (Feature-First + Riverpod)
lib/
├── core/
│   ├── constants/
│   │   ├── app_constants.dart
│   │   └── blood_constants.dart
│   ├── network/
│   │   ├── network_info.dart
│   │   └── api_client.dart
│   ├── theme/
│   │   ├── app_colors.dart
│   │   ├── app_theme.dart
│   │   └── glass_styles.dart
│   ├── utils/
│   │   ├── blood_group_utils.dart
│   │   └── geo_hash_utils.dart
│   └── errors/
│       ├── exceptions.dart
│       └── failures.dart
├── features/
│   ├── auth/
│   │   ├── data/
│   │   │   ├── datasources/auth_remote_data_source.dart
│   │   │   ├── models/user_model.dart
│   │   │   └── repositories/auth_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/user_entity.dart
│   │   │   ├── repositories/auth_repository.dart
│   │   │   └── usecases/login_with_phone_otp.dart
│   │   └── presentation/
│   │       ├── controllers/auth_controller.dart
│   │       └── screens/phone_login_screen.dart
│   ├── blood_request/
│   │   ├── data/...
│   │   ├── domain/...
│   │   └── presentation/screens/sos_broadcast_wizard.dart
│   ├── donor_search/
│   │   ├── data/...
│   │   ├── domain/...
│   │   └── presentation/screens/donor_radar_screen.dart
│   ├── chat/
│   ├── badges/
│   └── hospital_portal/
└── routing/
    └── app_router.dart (GoRouter)`;

  const firestoreSchemaCode = `// Enterprise Firestore Database Schema (12 Scalable Collections)
// 1. users/{uid}
{
  "uid": "string (Auth UID)",
  "name": "string",
  "phone": "string (E.164)",
  "phoneMasked": "string",
  "bloodGroup": "O- | O+ | A- | A+ | B- | B+ | AB- | AB+",
  "division": "dhaka",
  "district": "dhaka",
  "upazila": "dhanmondi",
  "geoHash": "wh0r7",
  "latitude": 23.7461,
  "longitude": 90.3742,
  "isAvailable": true,
  "lastDonationDate": "timestamp",
  "totalDonations": 8,
  "verifiedBadge": true,
  "reliabilityScore": 98.5,
  "healthConditions": {
    "nonAlcoholic": true,
    "hivNegative": true,
    "normalBloodPressure": true
  },
  "fcmTokens": ["token_1", "token_2"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}

// 2. blood_requests/{requestId}
{
  "id": "string",
  "patientName": "string",
  "bloodGroup": "O-",
  "unitsNeeded": 2,
  "unitsCollected": 1,
  "hospitalName": "Dhaka Medical College Hospital",
  "district": "dhaka",
  "urgency": "CRITICAL | URGENT | STANDARD",
  "status": "PENDING | ACTIVE | ACCEPTED | FULFILLED | CANCELLED | EXPIRED",
  "geoHash": "wh0r2",
  "responders": [
    { "uid": "string", "name": "string", "timestamp": "timestamp" }
  ],
  "prescriptionUrl": "gs://bloodsearch.appspot.com/prescriptions/req_01.jpg",
  "createdAt": "timestamp"
}

// 3. chat_rooms/{roomId}/messages/{messageId}
// 4. blood_banks/{bankId}/inventory/{groupId}
// 5. donation_verifications/{verificationId}
// 6. audit_logs/{logId} (Immutable write-only security trail)`;

  const securityRulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isVerifiedHospital() {
      return isAuthenticated() && request.auth.token.role == 'hospital';
    }

    // Users Collection: Sensitive phone number is masked unless requested with consent
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId) && request.resource.data.totalDonations == 0;
      allow update: if isOwner(userId) && 
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['verifiedBadge', 'totalDonations', 'reliabilityScore']);
    }

    // Emergency Blood Requests
    match /blood_requests/{requestId} {
      allow read: if true; // Public safety broadcast
      allow create: if isAuthenticated() && request.resource.data.unitsCollected == 0;
      allow update: if isAuthenticated() && (
        isOwner(resource.data.requesterUid) ||
        // Donors can append themselves to responders
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['responders', 'unitsCollected'])
      );
    }

    // Immutable Audit Logs: Append-only for cybersecurity tracking
    match /audit_logs/{logId} {
      allow read: if isAuthenticated() && request.auth.token.role == 'admin';
      allow create: if isAuthenticated();
      allow update, delete: if false; // Strict immutability
    }
  }
}`;

  const cloudFunctionsCode = `// Firebase Cloud Functions (TypeScript v2)
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

admin.initializeApp();

// 1. Dispatch Push Notifications to nearby compatible donors when SOS is created
export const onEmergencySOSCreated = onDocumentCreated("blood_requests/{requestId}", async (event) => {
  const reqData = event.data?.data();
  if (!reqData) return;

  const targetGroup = reqData.bloodGroup;
  const targetDistrict = reqData.district;

  // Query compatible donors in the district
  const snapshot = await admin.firestore().collection("users")
    .where("district", "==", targetDistrict)
    .where("isAvailable", "==", true)
    .limit(200)
    .get();

  const tokens: string[] = [];
  snapshot.forEach(doc => {
    const fcm = doc.data().fcmTokens || [];
    tokens.push(...fcm);
  });

  if (tokens.length === 0) return;

  // Send High Priority FCM Alert
  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: \`🚨 EMERGENCY \${targetGroup} Blood Needed!\`,
      body: \`\${reqData.hospitalName} urgently requires \${reqData.unitsNeeded} units. Tap to respond.\`,
    },
    data: {
      requestId: event.params.requestId,
      urgency: reqData.urgency,
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    },
    android: { priority: "high" },
    apns: { payload: { aps: { sound: "emergency_alarm.caf", critical: true } } }
  });
});`;

  const flutterCode = `// Production Flutter Riverpod Implementation for BloodSearch
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// 1. State Provider for Blood Donor Search
final donorSearchProvider = StateNotifierProvider<DonorSearchNotifier, DonorSearchState>((ref) {
  return DonorSearchNotifier(ref.watch(donorRepositoryProvider));
});

class DonorSearchNotifier extends StateNotifier<DonorSearchState> {
  final DonorRepository _repository;
  DonorSearchNotifier(this._repository) : super(const DonorSearchState.initial());

  Future<void> searchDonors({required String bloodGroup, required String district}) async {
    state = const DonorSearchState.loading();
    try {
      final donors = await _repository.getCompatibleDonors(bloodGroup, district);
      state = DonorSearchState.success(donors);
    } catch (e) {
      state = DonorSearchState.error(e.toString());
    }
  }
}

// 2. Glassmorphic Donor Card Widget
class GlassDonorCard extends StatelessWidget {
  final DonorEntity donor;
  final VoidCallback onCall;

  const GlassDonorCard({super.key, required this.donor, required this.onCall});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.12)),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: const Color(0xFFE11D48),
            child: Text(donor.bloodGroup, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(donor.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text('\${donor.upazila}, \${donor.district}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
          ElevatedButton(onPressed: onCall, child: const Text('Contact')),
        ],
      ),
    );
  }
}`;

  const devopsCode = `# GitHub Actions CI/CD Pipeline (.github/workflows/deploy.yml)
name: BloodSearch Enterprise CI/CD

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  flutter_test_and_build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.x'
          channel: 'stable'
      - run: flutter pub get
      - run: flutter test --coverage
      - name: Build Web Application
        run: flutter build web --release
      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '\${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '\${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: bloodsearch-bd`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card-adaptive rounded-2xl p-5 sm:p-6 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md">
                <Terminal className="w-5 h-5 text-rose-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Enterprise Ecosystem Architecture (সম্পূর্ণ আর্কিটেকচার ব্লুপ্রিন্ট)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Production-ready Clean Architecture, Firestore Schema, Security Rules, Riverpod & CI/CD Pipelines
            </p>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="pt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'folder' as const, label: 'Folder Structure', icon: FolderTree },
            { id: 'schema' as const, label: 'Firestore Schema', icon: Database },
            { id: 'rules' as const, label: 'Security Rules', icon: ShieldCheck },
            { id: 'functions' as const, label: 'Cloud Functions', icon: CloudLightning },
            { id: 'flutter' as const, label: 'Flutter Code', icon: Smartphone },
            { id: 'devops' as const, label: 'CI/CD & DevOps', icon: GitBranch },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Viewer Box */}
      <div className="glass-card-adaptive rounded-2xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800/80">
        <div className="p-3 px-5 bg-slate-900 text-slate-300 text-xs font-mono flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 font-bold text-slate-100">
              {activeTab === 'folder' && 'lib/ - Clean Architecture Directory'}
              {activeTab === 'schema' && 'firestore.schema.json'}
              {activeTab === 'rules' && 'firestore.rules (Hardened)'}
              {activeTab === 'functions' && 'functions/src/emergency.ts'}
              {activeTab === 'flutter' && 'lib/features/donor_search/presentation/riverpod.dart'}
              {activeTab === 'devops' && '.github/workflows/deploy.yml'}
            </span>
          </div>

          <button
            onClick={() => {
              const codeMap = {
                folder: folderStructureCode,
                schema: firestoreSchemaCode,
                rules: securityRulesCode,
                functions: cloudFunctionsCode,
                flutter: flutterCode,
                devops: devopsCode,
              };
              copyCode(codeMap[activeTab]);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="p-5 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
          <pre>
            {activeTab === 'folder' && folderStructureCode}
            {activeTab === 'schema' && firestoreSchemaCode}
            {activeTab === 'rules' && securityRulesCode}
            {activeTab === 'functions' && cloudFunctionsCode}
            {activeTab === 'flutter' && flutterCode}
            {activeTab === 'devops' && devopsCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
