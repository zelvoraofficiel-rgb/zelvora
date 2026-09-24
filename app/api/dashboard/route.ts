import { currentUser } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { clientFor, fail, mapNotification, mapOrder, mapProduct, storeForUser } from '@/lib/supabase/data';
import { useSupabase } from '@/lib/supabase/config';
export async function GET() {
  const user = await currentUser(); if (!user) return Response.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
  if (useSupabase && user.accessToken) {
    const { organization, store } = await storeForUser({ ...user, accessToken: user.accessToken });
    if (!store) return Response.json({ user: { id: user.id, name: user.name, email: user.email }, store: null, metrics: null, orders: [], notifications: [] });
    const client = clientFor(user); const [productsResult, ordersResult, customerResult, notificationResult, creditsResult] = await Promise.all([
      client.from('products').select('*').eq('store_id', store.id).order('created_at', { ascending: false }),
      client.from('orders').select('*').eq('store_id', store.id).order('created_at', { ascending: false }),
      client.from('customers').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
      client.from('notifications').select('*').eq('store_id', store.id).order('created_at', { ascending: false }).limit(5),
      client.from('ai_credits').select('balance, monthly_limit').eq('organization_id', organization.id).maybeSingle()
    ]);
    for (const result of [productsResult, ordersResult, customerResult, notificationResult, creditsResult]) if (result.error) fail(result.error);
    const orders = (ordersResult.data || []).map(mapOrder); const products = (productsResult.data || []).map(mapProduct); const revenue = orders.filter((item) => item.status !== 'CANCELLED').reduce((sum, item) => sum + item.total, 0);
    return Response.json({ user: { id: user.id, name: user.name, email: user.email }, store, products, metrics: { revenue, orders: orders.length, customers: customerResult.count || 0, averageOrder: orders.length ? revenue / orders.length : 0 }, orders: orders.slice(0, 6), notifications: (notificationResult.data || []).map(mapNotification), aiCredits: { used: 0, limit: creditsResult.data?.monthly_limit || 5 } });
  }
  const db = await readDb(); const organization = db.organizations.find((item) => item.userId === user.id); const stores = organization ? db.stores.filter((item) => item.organizationId === organization.id) : []; const store = stores[0]; if (!store) return Response.json({ user, store: null, metrics: null, orders: [], notifications: [] }); const orders = db.orders.filter((item) => item.storeId === store.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); const products = db.products.filter((item) => item.storeId === store.id); const customers = db.customers.filter((item) => item.storeId === store.id); const notifications = db.notifications.filter((item) => item.storeId === store.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); return Response.json({ user, store, products, metrics: { revenue: orders.filter((item) => item.status !== 'CANCELLED').reduce((sum, item) => sum + item.total, 0), orders: orders.length, customers: customers.length, averageOrder: orders.length ? orders.reduce((sum, item) => sum + item.total, 0) / orders.length : 0 }, orders: orders.slice(0, 6), notifications: notifications.slice(0, 5), aiCredits: { used: 0, limit: 5 } });
}
