import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let firebaseProjectId = '';
let firebaseWebApiKey = '';
const appletCfgPath = path.join(rootDir, 'firebase-applet-config.json');
if (fs.existsSync(appletCfgPath)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(appletCfgPath, 'utf8'));
    if (typeof parsed.projectId === 'string') firebaseProjectId = parsed.projectId.trim();
    if (typeof parsed.apiKey === 'string') firebaseWebApiKey = parsed.apiKey.trim();
  } catch {
    // Ignore optional local config parse failure
  }
}

const bundleOutPath = path.join(rootDir, 'src', 'server', 'vercelAppBundle.mjs');
fs.mkdirSync(path.dirname(bundleOutPath), { recursive: true });

await build({
  stdin: {
    contents: `
import { createEmergencyApiApp } from './server.ts';
export { createEmergencyApiApp };
`,
    resolveDir: rootDir,
    sourcefile: 'vercel-bundle-entry.ts',
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  packages: 'external',
  outfile: bundleOutPath,
  sourcemap: false,
  minifySyntax: true,
  minifyWhitespace: true,
  legalComments: 'none',
  define: {
    'process.env.BLOODSEARCH_SERVERLESS_MODE': '"true"',
    'process.env.BLOODSEARCH_DISABLE_EMBEDDED_PG': '"true"',
  },
  banner: {
    js: [
      '// Auto-generated BloodSearch Vercel Serverless Express bundle (zero PGlite, zero Vite, zero sourcemaps)',
      firebaseProjectId
        ? `process.env.FIREBASE_PROJECT_ID ||= ${JSON.stringify(firebaseProjectId)};`
        : '',
      firebaseWebApiKey
        ? `process.env.FIREBASE_WEB_API_KEY ||= ${JSON.stringify(firebaseWebApiKey)};`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
  },
  plugins: [
    {
      name: 'externalize-bootstrap-sql',
      setup(b) {
        b.onResolve({ filter: /bootstrapSql\.mjs$/ }, () => ({
          path: '../db/bootstrapSql.mjs',
          external: true,
        }));
      },
    },
  ],
});

console.log('[build-vercel-api] Built src/server/vercelAppBundle.mjs cleanly');
