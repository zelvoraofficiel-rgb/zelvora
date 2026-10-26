import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { mapStore, storeForUser } from '@/lib/supabase/data';
import { supabaseServiceRoleKey, supabaseUrl, useSupabase } from '@/lib/supabase/config';
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ user: null }, { status: 401 });
  if (useSupabase && user.accessToken) {
    // During the first seconds after signup, a fresh JWT/RLS view can lag behind
    // the server-side onboarding insert. Querying strictly by the verified owner
    // id prevents the user being sent back into onboarding after creation.
    const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
    if (configuredUrl && supabaseServiceRoleKey) {
      const service = createClient(configuredUrl, supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await service.from('stores').select('*').eq('owner_id', user.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (!error) {
        let store = data;
        // Repair only interrupted onboarding stores: a DRAFT store that already
        // owns a published product was meant to go live at the final step.
        if (store?.status === 'DRAFT' && !store.published_at) {
          const { data: firstProduct } = await service.from('products').select('id').eq('store_id', store.id).eq('status', 'PUBLISHED').limit(1).maybeSingle();
          if (firstProduct) {
            const publishedAt = new Date().toISOString();
            const repaired = await service.from('stores').update({ status: 'PUBLISHED', published_at: publishedAt, updated_at: publishedAt }).eq('id', store.id).eq('owner_id', user.id).select('*').single();
            if (!repaired.error && repaired.data) store = repaired.data;
          }
        }
        return Response.json({ user: { id: user.id, name: user.name, email: user.email }, stores: store ? [mapStore(store)] : [] });
      }
    }
    const { store } = await storeForUser({ ...user, accessToken: user.accessToken });
    return Response.json({ user: { id: user.id, name: user.name, email: user.email }, stores: store ? [store] : [] });
  }
  const db = await readDb();
  const organization = db.organizations.find((item) => item.userId === user.id);
  const stores = organization ? db.stores.filter((item) => item.organizationId === organization.id) : [];
  return Response.json({ user, stores });
}
