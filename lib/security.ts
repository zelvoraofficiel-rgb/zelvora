import { NextRequest } from 'next/server';

const attempts = new Map<string, { count: number; reset: number }>();

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host) {
    try { if (new URL(origin).host !== host) throw new Error('forbidden'); }
    catch { throw new Error('Requête inter-origine refusée.'); }
  }
}

export function rateLimit(request: NextRequest, scope: string, max = 8, windowMs = 60_000) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || 'local';
  const key = `${scope}:${ip}`;
  const time = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.reset < time) { attempts.set(key, { count: 1, reset: time + windowMs }); return; }
  entry.count += 1;
  if (entry.count > max) throw new Error('Trop de tentatives. Réessayez dans une minute.');
}

export function apiError(error: unknown, fallback = 'Une erreur est survenue.') {
  const message = error instanceof Error ? error.message : fallback;
  const status = /non authentifié/i.test(message) ? 401 : /refusée|autorisé/i.test(message) ? 403 : /trop de/i.test(message) ? 429 : 400;
  return Response.json({ error: message || fallback }, { status });
}
