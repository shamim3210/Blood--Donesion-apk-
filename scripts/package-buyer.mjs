import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'buyer-release');

function parseArg(flag, fallback) {
  const prefix = `--${flag}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : fallback;
}

const buyerAdminEmail = parseArg('admin', 'admin@buyerdomain.com');
const buyerBrandName = parseArg('brand', 'BloodSearch');
const buyerOrgName = parseArg('org', 'Emergency Blood Network');

const EXCLUDED_NAMES = new Set([
  'node_modules',
  'dist',
  'dev-dist',
  'buyer-release',
  '.git',
  '.aistudio',
  '.firebase',
  '.vercel',
  '.env',
  '.env.local',
  '.env.production',
  'firebase-applet-config.json',
  '.firebaserc',
]);

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (EXCLUDED_NAMES.has(entry)) continue;
      if (entry.endsWith('.zip') || entry.endsWith('.log')) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.copyFileSync(src, dest);
}

if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const entry of fs.readdirSync(ROOT_DIR)) {
  if (EXCLUDED_NAMES.has(entry)) continue;
  if (entry.endsWith('.zip') || entry.endsWith('.log')) continue;
  copyRecursive(path.join(ROOT_DIR, entry), path.join(OUTPUT_DIR, entry));
}

// 1. Write clean placeholder firebase-applet-config.json for the buyer
const exampleConfigPath = path.join(ROOT_DIR, 'firebase-applet-config.example.json');
if (fs.existsSync(exampleConfigPath)) {
  fs.copyFileSync(
    exampleConfigPath,
    path.join(OUTPUT_DIR, 'firebase-applet-config.json')
  );
}

// 2. Write clean .firebaserc placeholder
fs.writeFileSync(
  path.join(OUTPUT_DIR, '.firebaserc'),
  JSON.stringify({ projects: { default: 'YOUR_FIREBASE_PROJECT_ID' } }, null, 2) + '\n',
  'utf8'
);

// 3. Substitute seller's email in buyer-release/firestore.rules & src/firebase.ts
const rulesOutPath = path.join(OUTPUT_DIR, 'firestore.rules');
if (fs.existsSync(rulesOutPath)) {
  const rawRules = fs.readFileSync(rulesOutPath, 'utf8');
  const updatedRules = rawRules.replace(/shamimrakib015@gmail\.com/g, buyerAdminEmail);
  fs.writeFileSync(rulesOutPath, updatedRules, 'utf8');
}

const firebaseTsOutPath = path.join(OUTPUT_DIR, 'src', 'firebase.ts');
if (fs.existsSync(firebaseTsOutPath)) {
  const rawFb = fs.readFileSync(firebaseTsOutPath, 'utf8');
  const updatedFb = rawFb.replace(/shamimrakib015@gmail\.com/g, buyerAdminEmail);
  fs.writeFileSync(firebaseTsOutPath, updatedFb, 'utf8');
}

const brandCfgOutPath = path.join(OUTPUT_DIR, 'src', 'config', 'brandConfig.ts');
if (fs.existsSync(brandCfgOutPath)) {
  const rawBrand = fs.readFileSync(brandCfgOutPath, 'utf8');
  const updatedBrand = rawBrand.replace(/shamimrakib015@gmail\.com/g, buyerAdminEmail);
  fs.writeFileSync(brandCfgOutPath, updatedBrand, 'utf8');
}

// 4. Pre-fill .env.example with buyer's white-label details
const envOutPath = path.join(OUTPUT_DIR, '.env.example');
const buyerEnvTemplate = `# White-Label Brand & Ownership Configuration
VITE_BRAND_NAME="${buyerBrandName}"
VITE_BRAND_TAGLINE="FIND BLOOD. SAVE LIFE."
VITE_ORG_NAME="${buyerOrgName}"
VITE_SUPPORT_PHONE="16263"
VITE_SUPPORT_EMAIL="support@yourdomain.com"
VITE_SUPER_ADMIN_EMAIL="${buyerAdminEmail}"
VITE_DEFAULT_REAL_ONLY_MODE="true"

# Optional Production Gateways (Server-Side Secrets)
APP_URL="https://yourdomain.com"
VITE_RECAPTCHA_V3_SITE_KEY=""
VITE_FIREBASE_VAPID_KEY=""
FCM_SERVER_KEY=""
SMS_PROVIDER="NONE"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_FROM_NUMBER=""
SMS_WEBHOOK_URL=""
SMS_WEBHOOK_API_KEY=""
`;
fs.writeFileSync(envOutPath, buyerEnvTemplate, 'utf8');

console.log('✓ Clean commercial buyer package created at: ./buyer-release');
console.log(`  • Brand Name        : ${buyerBrandName}`);
console.log(`  • Super Admin Email : ${buyerAdminEmail}`);
console.log('  • Seller secrets, .env, .git, node_modules, and live Firebase keys excluded.');
