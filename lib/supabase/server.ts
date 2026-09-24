import { createClient } from '@supabase/supabase-js';
import { hasSupabaseConfig, supabasePublishableKey, supabaseUrl } from '@/lib/supabase/config';

/**
 * Creates a user-scoped Supabase client. The accessToken callback is required so
 * PostgREST evaluates RLS with the merchant JWT rather than with the anon key.
 * Never substitute a service-role key here.
 */
export function createSupabaseUserClient(accessToken: string) {
  if (!hasSupabaseConfig || !supabaseUrl || !supabasePublishableKey) throw new Error('Supabase n’est pas configuré.');
  return createClient(supabaseUrl, supabasePublishableKey, {
    accessToken: async () => accessToken,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

/** Anonymous client for public reads and the create_public_order RPC only. */
export function createSupabasePublicClient() {
  if (!hasSupabaseConfig || !supabaseUrl || !supabasePublishableKey) throw new Error('Supabase n’est pas configuré.');
  return createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
