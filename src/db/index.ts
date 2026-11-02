import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import pg from 'pg';
import { buildNeonPoolConfig, redactDatabaseUrl, type ValidatedNeonConnectionInfo } from './neonConfig.ts';
import * as schema from './schema.ts';

if (typeof window !== 'undefined' || typeof document !== 'undefined') {
  throw new Error(
    'FATAL_SECURITY_VIOLATION: Database driver (src/db/index.ts) must never be imported in frontend code.'
  );
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const EMBEDDED_PG_DIR = path.join(ROOT_DIR, '.data', 'bloodsearch-main-pg');

export type BloodSearchDatabase = NodePgDatabase<typeof schema> | PgliteDatabase<typeof schema>;

let singletonPool: pg.Pool | null = null;
let singletonEmbeddedClient: PGlite | null = null;
let singletonDb: BloodSearchDatabase | null = null;
let singletonInfo: ValidatedNeonConnectionInfo | null = null;
let embeddedInitPromise: Promise<BloodSearchDatabase | null> | null = null;
let overrideDbForTesting: BloodSearchDatabase | null = null;

/**
 * Injects an isolated PostgreSQL instance (e.g., PGlite Postgres 16 in integration tests)
 * so routes and repositories execute against real PostgreSQL SQL without mocking queries.
 */
export function setDatabaseOverrideForTesting(db: BloodSearchDatabase | null): void {
  overrideDbForTesting = db;
}

export function createPgliteDrizzle(client: PGlite): PgliteDatabase<typeof schema> {
  return drizzlePglite(client, { schema });
}

function readCoreBootstrapSql(): string | null {
  try {
    const drizzleDir = path.join(ROOT_DIR, 'drizzle');
    if (!fs.existsSync(drizzleDir)) return null;
    const files = fs
      .readdirSync(drizzleDir)
      .filter((f) => f.endsWith('.sql') && f.startsWith('0000_') && !f.startsWith('rollback_'))
      .sort();
    if (files.length === 0) return null;
    return fs.readFileSync(path.join(drizzleDir, files[0]!), 'utf8');
  } catch {
    return null;
  }
}

/**
 * Ensures the server-side PostgreSQL main database is ready for `/api/v1/*` requests:
 *  - Primary: External Neon PostgreSQL over TLS (`DATABASE_URL`).
 *  - Automatic Server-Only Fallback: Persistent embedded PostgreSQL 16 (`PGlite` at `.data/bloodsearch-main-pg`)
 *    isolated strictly on the Express backend filesystem (unreachable from HTTP/browser/APK).
 */
export async function ensureMainPostgresReady(
  env: NodeJS.ProcessEnv = process.env
): Promise<{
  db: BloodSearchDatabase | null;
  pool: pg.Pool | null;
  info: ValidatedNeonConnectionInfo;
}> {
  const current = getNeonDatabase(env);
  if (current.db) {
    return current;
  }

  // Only auto-provision the server's persistent embedded PostgreSQL when using runtime process.env
  // (keeps explicit unit test calls like getNeonDatabase({ DATABASE_URL: '' }) deterministic).
  if (env !== process.env || env.BLOODSEARCH_DISABLE_EMBEDDED_PG === 'true') {
    return current;
  }

  if (!embeddedInitPromise) {
    embeddedInitPromise = (async () => {
      try {
        fs.mkdirSync(EMBEDDED_PG_DIR, { recursive: true, mode: 0o700 });
        const client = new PGlite(EMBEDDED_PG_DIR);
        await client.waitReady;

        const checkRes = await client.query<{ cnt: number }>(
          `SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'`
        );
        if (!checkRes.rows[0]?.cnt) {
          const ddl = readCoreBootstrapSql();
          if (ddl) {
            await client.exec(ddl.replace(/--> statement-breakpoint/g, '\n'));
          }
        }

        singletonEmbeddedClient = client;
        singletonDb = drizzlePglite(client, { schema });
        singletonInfo = {
          ...current.info,
          configured: true,
          host: 'server-isolated-postgres16',
          database: 'bloodsearch_main',
          sslMode: 'server-local-isolated',
          isPooledEndpoint: true,
          redactedUrl: 'postgres://[SERVER_ISOLATED_PG16]/bloodsearch_main',
        };
        return singletonDb;
      } catch (err) {
        embeddedInitPromise = null;
        const msg = err instanceof Error ? redactDatabaseUrl(err.message) : 'Embedded PG init error';
        console.error(`[MainPostgres] Embedded PostgreSQL fallback error: ${msg}`);
        return null;
      }
    })();
  }

  await embeddedInitPromise;
  return {
    db: singletonDb,
    pool: singletonPool,
    info: singletonInfo || current.info,
  };
}

/**
 * Lazily initializes and returns the singleton Neon PostgreSQL Drizzle instance.
 * Never opens eager background connections at import time and never logs raw credentials.
 */
export function getNeonDatabase(env: NodeJS.ProcessEnv = process.env): {
  db: BloodSearchDatabase | null;
  pool: pg.Pool | null;
  info: ValidatedNeonConnectionInfo;
} {
  if (overrideDbForTesting) {
    const { info } = buildNeonPoolConfig(env);
    return {
      db: overrideDbForTesting,
      pool: null,
      info: {
        ...info,
        configured: true,
        host: 'pglite-embedded-postgres16',
        database: 'bloodsearch_test',
        sslMode: 'local-memory',
      },
    };
  }

  // If caller passed an explicit custom env object for config validation testing, evaluate it directly
  if (env !== process.env) {
    const { info, poolConfig } = buildNeonPoolConfig(env);
    if (!poolConfig) {
      return { db: null, pool: null, info };
    }
  }

  if (singletonDb && singletonInfo) {
    return { db: singletonDb, pool: singletonPool, info: singletonInfo };
  }

  const { info, poolConfig } = buildNeonPoolConfig(env);
  if (!poolConfig) {
    return { db: null, pool: null, info };
  }

  singletonInfo = info;
  const pool = new pg.Pool(poolConfig);
  pool.on('error', (err) => {
    const safeMsg = err?.message ? redactDatabaseUrl(err.message) : 'Unknown pool error';
    console.error(`[NeonPool] Idle client error (${info.redactedUrl}): ${safeMsg}`);
  });

  singletonPool = pool;
  singletonDb = drizzle(pool, { schema });

  return { db: singletonDb, pool: singletonPool, info };
}

export async function closeNeonDatabase(): Promise<void> {
  if (singletonPool) {
    await singletonPool.end();
    singletonPool = null;
  }
  if (singletonEmbeddedClient) {
    await singletonEmbeddedClient.close();
    singletonEmbeddedClient = null;
  }
  singletonDb = null;
  singletonInfo = null;
  embeddedInitPromise = null;
}

export { schema };
