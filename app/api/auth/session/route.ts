import { currentUser } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { storeForUser } from '@/lib/supabase/data';
import { useSupabase } from '@/lib/supabase/config';
export async function GET() {
  const user = await currentUser(); if (!user) return Response.json({ user: null }, { status: 401 });
  if (useSupabase && user.accessToken) { const { store } = await storeForUser({ ...user, accessToken: user.accessToken }); return Response.json({ user: { id: user.id, name: user.name, email: user.email }, stores: store ? [store] : [] }); }
  const db = await readDb(); const organization = db.organizations.find((item) => item.userId === user.id); const stores = organization ? db.stores.filter((item) => item.organizationId === organization.id) : []; return Response.json({ user, stores });
}
