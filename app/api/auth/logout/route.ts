import { NextRequest, NextResponse } from 'next/server';
import { expiredSessionCookie, expiredSupabaseSessionCookies } from '@/lib/auth';

import { useSupabase } from '@/lib/supabase/config';
import { apiError, assertSameOrigin } from '@/lib/security';
export async function POST(request: NextRequest) {
  try { assertSameOrigin(request); const response = NextResponse.json({ ok: true });
    if (useSupabase) { for (const cookie of expiredSupabaseSessionCookies()) response.cookies.set(cookie.name, cookie.value, cookie.options); }
    else { const cookie = expiredSessionCookie(); response.cookies.set(cookie.name, cookie.value, cookie.options); }
    return response;
  } catch (error) { return apiError(error); }
}
