import { NextRequest, NextResponse } from 'next/server';
import { expiredSessionCookie, expiredSupabaseSessionCookies } from '@/lib/auth';

import { useSupabase } from '@/lib/supabase/config';
import { apiError, assertSameOrigin } from '@/lib/security';
function clearSession(response: NextResponse) {
  if (useSupabase) { for (const cookie of expiredSupabaseSessionCookies()) response.cookies.set(cookie.name, cookie.value, cookie.options); }
  else { const cookie = expiredSessionCookie(); response.cookies.set(cookie.name, cookie.value, cookie.options); }
  return response;
}
export async function GET(request: NextRequest) {
  return clearSession(NextResponse.redirect(new URL('/login', request.url)));
}
export async function POST(request: NextRequest) {
  try { assertSameOrigin(request); return clearSession(NextResponse.json({ ok: true })); }
  catch (error) { return apiError(error); }
}
