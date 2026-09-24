import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sessionCookie, supabaseSessionCookies, verifyPassword } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { apiError, assertSameOrigin, rateLimit } from '@/lib/security';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { ensureOrganization } from '@/lib/supabase/data';
import { useSupabase } from '@/lib/supabase/config';
const bodySchema = z.object({ email: z.string().email(), password: z.string().min(1).max(128) });
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); rateLimit(request, 'login', 8); const input = bodySchema.parse(await request.json());
    if (useSupabase) {
      const { data, error } = await createSupabasePublicClient().auth.signInWithPassword({ email: input.email.toLowerCase(), password: input.password });
      if (error || !data.user || !data.session) throw new Error(error?.message || 'Email ou mot de passe incorrect.');
      const name = (data.user.user_metadata?.name as string | undefined) || 'Marchand'; await ensureOrganization({ id: data.user.id, email: data.user.email || input.email, name, accessToken: data.session.access_token });
      const response = NextResponse.json({ user: { id: data.user.id, name, email: data.user.email } }); for (const cookie of supabaseSessionCookies(data.session)) response.cookies.set(cookie.name, cookie.value, cookie.options); return response;
    }
    const db = await readDb(); const user = db.users.find((item) => item.email === input.email.toLowerCase()); if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new Error('Email ou mot de passe incorrect.');
    const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }); const cookie = sessionCookie(user.id); response.cookies.set(cookie.name, cookie.value, cookie.options); return response;
  } catch (error) { return apiError(error); }
}
