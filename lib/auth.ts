import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { readDb } from '@/lib/db';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { useSupabase } from '@/lib/supabase/config';

const scrypt = promisify(scryptCallback);
const COOKIE_NAME = 'zelvora_session';
const SUPABASE_ACCESS_COOKIE = 'zelvora_sb_access';
const SUPABASE_REFRESH_COOKIE = 'zelvora_sb_refresh';
const secret = () => process.env.AUTH_SECRET || 'development-only-secret-change-before-production';
type Session = { userId: string; exp: number };
export type CurrentUser = { id: string; email: string; name: string; accessToken?: string };

export async function hashPassword(password: string) { const salt = randomBytes(16).toString('hex'); const derived = await scrypt(password, salt, 64) as Buffer; return `scrypt$${salt}$${derived.toString('hex')}`; }
export async function verifyPassword(password: string, stored: string) { const [algorithm, salt, hash] = stored.split('$'); if (algorithm !== 'scrypt' || !salt || !hash) return false; const derived = await scrypt(password, salt, 64) as Buffer; const expected = Buffer.from(hash, 'hex'); return expected.length === derived.length && timingSafeEqual(expected, derived); }
function encode(session: Session) { const body = Buffer.from(JSON.stringify(session)).toString('base64url'); const signature = createHmac('sha256', secret()).update(body).digest('base64url'); return `${body}.${signature}`; }
function decode(value: string): Session | null { const [body, signature] = value.split('.'); if (!body || !signature) return null; const expected = createHmac('sha256', secret()).update(body).digest('base64url'); const a = Buffer.from(signature); const b = Buffer.from(expected); if (a.length !== b.length || !timingSafeEqual(a, b)) return null; try { const session = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session; return session.exp > Date.now() ? session : null; } catch { return null; } }

function commonCookie() {
  // Arena renders the live preview in a cross-site iframe. Supabase sessions must use
  // SameSite=None + Secure there; the production site also remains HTTPS-only.
  const crossSitePreview = useSupabase;
  return { httpOnly: true, sameSite: crossSitePreview ? 'none' as const : 'lax' as const, secure: crossSitePreview || process.env.NODE_ENV === 'production', path: '/' };
}
export function sessionCookie(userId: string) { return { name: COOKIE_NAME, value: encode({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }), options: { ...commonCookie(), maxAge: 7 * 24 * 60 * 60 } }; }
export function supabaseSessionCookies(session: { access_token: string; refresh_token: string; expires_in?: number }) {
  return [
    { name: SUPABASE_ACCESS_COOKIE, value: session.access_token, options: { ...commonCookie(), maxAge: Math.max(60, session.expires_in || 3600) } },
    { name: SUPABASE_REFRESH_COOKIE, value: session.refresh_token, options: { ...commonCookie(), maxAge: 30 * 24 * 60 * 60 } }
  ];
}
export function expiredSessionCookie() { return { name: COOKIE_NAME, value: '', options: { ...commonCookie(), maxAge: 0 } }; }
export function expiredSupabaseSessionCookies() { return [{ name: SUPABASE_ACCESS_COOKIE, value: '', options: { ...commonCookie(), maxAge: 0 } }, { name: SUPABASE_REFRESH_COOKIE, value: '', options: { ...commonCookie(), maxAge: 0 } }]; }

export async function currentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  if (useSupabase) {
    const accessToken = cookieStore.get(SUPABASE_ACCESS_COOKIE)?.value; if (!accessToken) return null;
    const client = createSupabasePublicClient(); const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user?.email) return null;
    return { id: data.user.id, email: data.user.email, name: (data.user.user_metadata?.name as string | undefined) || 'Marchand', accessToken };
  }
  const raw = cookieStore.get(COOKIE_NAME)?.value; const session = raw ? decode(raw) : null; if (!session) return null;
  const db = await readDb(); const user = db.users.find((item) => item.id === session.userId); return user ? { id: user.id, email: user.email, name: user.name } : null;
}
