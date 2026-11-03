// Vercel Node 20 ESM Serverless Entrypoint — Fail-Safe Express & Neon Bridge
import 'dotenv';
import 'drizzle-orm';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'express';
import 'firebase-admin/app';
import 'firebase-admin/auth';
import 'pg';
import '../src/db/bootstrapSql.mjs';

process.env.BLOODSEARCH_SERVERLESS_MODE ||= 'true';
process.env.BLOODSEARCH_DISABLE_EMBEDDED_PG ||= 'true';

let cachedExpressApp = null;
let bundleLoadFailedAtMs = 0;

async function getExpressApp() {
  if (cachedExpressApp) return cachedExpressApp;
  if (Date.now() - bundleLoadFailedAtMs < 5_000) return null;

  try {
    const bundleUrl = new URL('../src/server/vercelAppBundle.mjs', import.meta.url).href;
    const mod = await import(bundleUrl);
    if (typeof mod?.createEmergencyApiApp === 'function') {
      cachedExpressApp = mod.createEmergencyApiApp();
      return cachedExpressApp;
    }
  } catch (err) {
    bundleLoadFailedAtMs = Date.now();
    console.error(
      '[VercelApi] Express bundle initialization warning:',
      err instanceof Error ? err.name : 'UnknownError'
    );
  }
  return null;
}

function sendSafeJsonFallback(req, res) {
  if (res.headersSent) return;
  const rawUrl = String(req.url || '/');
  const pathname = rawUrl.split('?')[0] || '/';

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (pathname.endsWith('/donors/search')) {
    res.end(
      JSON.stringify({
        ok: true,
        dbConfigured: false,
        items: [],
        pagination: {
          page: 1,
          limit: 50,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        geoStrategy: 'NONE',
      })
    );
    return;
  }

  if (pathname.endsWith('/opted-in-contact') || pathname.endsWith('/contact')) {
    res.end(
      JSON.stringify({
        ok: false,
        dbConfigured: false,
        found: false,
        contact: null,
      })
    );
    return;
  }

  if (pathname.endsWith('/app-version')) {
    res.end(
      JSON.stringify({
        ok: true,
        version: '2.5.0',
        buildId: '2.5.0-serverless',
      })
    );
    return;
  }

  if (pathname.endsWith('/db/health')) {
    res.end(
      JSON.stringify({
        ok: false,
        status: 'UNCONFIGURED',
        configured: false,
        cutoverMode: 'FIRESTORE_PRIMARY',
      })
    );
    return;
  }

  res.statusCode = 503;
  res.end(
    JSON.stringify({
      ok: false,
      code: 'SERVICE_UNAVAILABLE',
      message: 'API service is temporarily unavailable.',
    })
  );
}

export default async function handler(req, res) {
  try {
    const app = await getExpressApp();
    if (!app) {
      sendSafeJsonFallback(req, res);
      return;
    }

    await new Promise((resolve) => {
      const done = () => resolve(undefined);
      res.once('finish', done);
      res.once('close', done);
      res.once('error', done);
      try {
        app(req, res, (err) => {
          if (err && !res.headersSent) {
            sendSafeJsonFallback(req, res);
          }
          done();
        });
      } catch {
        sendSafeJsonFallback(req, res);
        done();
      }
    });
  } catch {
    sendSafeJsonFallback(req, res);
  }
}
