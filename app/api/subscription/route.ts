import { currentUser } from '@/lib/auth';
import { clientFor, fail, storeForUser } from '@/lib/supabase/data';
import { useSupabase } from '@/lib/supabase/config';

export async function GET() {
  const user = await currentUser(); if (!user) return Response.json({ error: 'Utilisateur non authentifié.' }, { status: 401 });
  if (!useSupabase || !user.accessToken) return Response.json({ subscription: null, providerConfigured: false });
  const { organization } = await storeForUser({ ...user, accessToken: user.accessToken });
  if (!organization) return Response.json({ subscription: null, providerConfigured: false });
  const { data, error } = await clientFor(user).from('subscriptions').select('id,status,current_period_end,created_at,plans(name,slug,price_monthly,currency,max_products,max_orders,max_customers,max_ai_generations,max_stores,features)').eq('organization_id', organization.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) fail(error, 'Impossible de charger votre abonnement.');
  return Response.json({ subscription: data, providerConfigured: Boolean(data && (data as any).provider) });
}
