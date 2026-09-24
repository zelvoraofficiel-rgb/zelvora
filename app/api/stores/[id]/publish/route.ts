import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { mutateDb, now } from '@/lib/db';
import { apiError, assertSameOrigin } from '@/lib/security';
import { clientFor, fail, mapStore } from '@/lib/supabase/data';
import { useSupabase } from '@/lib/supabase/config';
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { assertSameOrigin(request); const user = await currentUser(); if (!user) throw new Error('Utilisateur non authentifié.'); const { id } = await params;
    if (useSupabase && user.accessToken) { const client = clientFor(user); const { data, error } = await client.from('stores').update({ status: 'PUBLISHED', published_at: new Date().toISOString() }).eq('id', id).select('*').single(); if (error) fail(error, 'Boutique introuvable ou non autorisée.'); return Response.json({ store: mapStore(data), publicUrl: `/store/${data.slug}` }); }
    const store = await mutateDb((db) => { const org = db.organizations.find((item) => item.userId === user.id); const store = db.stores.find((item) => item.id === id && item.organizationId === org?.id); if (!store) throw new Error('Boutique introuvable ou non autorisée.'); store.status = 'PUBLISHED'; store.publishedAt = now(); return store; }); return Response.json({ store, publicUrl: `/store/${store.slug}` });
  } catch (error) { return apiError(error); }
}
