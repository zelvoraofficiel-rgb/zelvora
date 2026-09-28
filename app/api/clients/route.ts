import { currentUser } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { clientFor, fail, storeForUser } from '@/lib/supabase/data';
import { useSupabase } from '@/lib/supabase/config';

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
  if (useSupabase && user.accessToken) {
    const { store } = await storeForUser({ ...user, accessToken: user.accessToken });
    if (!store) return Response.json({ clients: [] });
    const { data, error } = await clientFor(user).from('customers').select('*').eq('store_id', store.id).order('last_order_at', { ascending: false });
    if (error) fail(error, 'Impossible de charger les clients.');
    return Response.json({ clients: (data || []).map((row: any) => ({ id: row.id, name: row.name, phone: row.phone, email: row.email, orderCount: row.order_count || 0, totalSpent: Number(row.total_spent || 0), lastOrderAt: row.last_order_at, createdAt: row.created_at })) });
  }
  const db = await readDb();
  const organization = db.organizations.find((item) => item.userId === user.id);
  const store = organization && db.stores.find((item) => item.organizationId === organization.id);
  return Response.json({ clients: store ? db.customers.filter((item) => item.storeId === store.id).sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt)) : [] });
}
