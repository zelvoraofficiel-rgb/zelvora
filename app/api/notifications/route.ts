import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { mutateDb, readDb } from '@/lib/db';
import { apiError, assertSameOrigin } from '@/lib/security';
import { clientFor, fail, mapNotification, storeForUser } from '@/lib/supabase/data';
import { useSupabase } from '@/lib/supabase/config';

export async function GET() {
  const user = await currentUser(); if (!user) return Response.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
  if (useSupabase && user.accessToken) { const { store } = await storeForUser({ ...user, accessToken: user.accessToken }); if (!store) return Response.json({ notifications: [] }); const { data, error } = await clientFor(user).from('notifications').select('*').eq('store_id', store.id).order('created_at', { ascending: false }).limit(100); if (error) fail(error); return Response.json({ notifications: (data || []).map(mapNotification) }); }
  const db = await readDb(); const org = db.organizations.find((item) => item.userId === user.id); const store = org && db.stores.find((item) => item.organizationId === org.id); return Response.json({ notifications: store ? db.notifications.filter((item) => item.storeId === store.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)) : [] });
}
export async function PATCH(request: NextRequest) { try { assertSameOrigin(request); const user = await currentUser(); if (!user) throw new Error('Utilisateur non authentifié.'); const { id } = z.object({ id: z.string().uuid() }).parse(await request.json()); if (useSupabase && user.accessToken) { const { data, error } = await clientFor(user).from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).select('*').single(); if (error) fail(error, 'Notification introuvable.'); return Response.json({ notification: mapNotification(data) }); } const notification = await mutateDb((db) => { const target = db.notifications.find((item) => item.id === id && item.userId === user.id); if (!target) throw new Error('Notification introuvable.'); target.read = true; return target; }); return Response.json({ notification }); } catch (error) { return apiError(error); } }
