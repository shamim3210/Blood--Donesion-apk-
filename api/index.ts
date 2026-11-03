import type { IncomingMessage, ServerResponse } from 'node:http';
import { createEmergencyApiApp } from '../server';

process.env.BLOODSEARCH_SERVERLESS_MODE ||= 'true';
process.env.BLOODSEARCH_DISABLE_EMBEDDED_PG ||= 'true';

let cachedApp: ReturnType<typeof createEmergencyApiApp> | null = null;

function getApp() {
  if (!cachedApp) {
    cachedApp = createEmergencyApiApp();
  }
  return cachedApp;
}

function sendSafeJsonFallback(req: IncomingMessage, res: ServerResponse) {
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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const app = getApp();
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      res.once('finish', done);
      res.once('close', done);
      res.once('error', done);
      try {
        (app as unknown as (
          req: IncomingMessage,
          res: ServerResponse,
          next: (err?: unknown) => void
        ) => void)(req, res, (err) => {
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
