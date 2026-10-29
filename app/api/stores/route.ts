import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { id, mutateDb, now, slugify, uniqueSlug } from '@/lib/db';
import { apiError, assertSameOrigin } from '@/lib/security';
import { ensureOrganization, fail, mapProduct, mapStore } from '@/lib/supabase/data';
import { supabaseServiceRoleKey, supabaseUrl, useSupabase } from '@/lib/supabase/config';

const bodySchema = z.object({
  storeName: z.string().trim().min(2, 'Donnez un nom à votre boutique.').max(80), brandName:z.string().trim().max(80).optional(),businessCategory:z.string().trim().max(100).optional(),whatsapp:z.string().trim().max(30).optional(),countryCode:z.string().regex(/^[A-Z]{2}$/).default('NE'),currency:z.enum(['XOF','XAF','GNF','NGN','GHS','MAD','EUR','USD']).default('XOF'),themeStyle:z.enum(['SIGNATURE','MINIMAL']).default('SIGNATURE'), tagline: z.string().trim().max(160).default('Découvrez notre sélection.'), primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6557F5'),
  product: z.object({ name: z.string().trim().min(2).max(140), description: z.string().trim().min(1).max(3000), price: z.number().finite().min(0).max(100000000), type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']).default('PHYSICAL'), source: z.enum(['LINK', 'IMAGE', 'MANUAL']), sourceUrl: z.string().url().max(2048).optional(), benefits: z.array(z.string().trim().min(1).max(180)).max(6).default([]), imageUrl: z.string().max(2048).optional() }).optional()
});
function permittedImageUrl(url: string | undefined) {
  if (!url || url.startsWith('/uploads/')) return true;
  try {
    const candidate = new URL(url);
    const configured = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
    const correctStoragePath = candidate.pathname.startsWith('/storage/v1/object/public/store-assets/');
    if (!correctStoragePath || candidate.protocol !== 'https:') return false;
    // Prefer the configured project origin. The hostname fallback keeps onboarding
    // operational when Cloudflare injects NEXT_PUBLIC_* only at build time.
    if (configured) return candidate.origin === new URL(configured).origin;
    return candidate.hostname.endsWith('.supabase.co');
  } catch { return false; }
}
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); const user = await currentUser(); if (!user) throw new Error('Utilisateur non authentifié.'); const input = bodySchema.parse(await request.json()); if (input.product && !permittedImageUrl(input.product.imageUrl)) throw new Error('Image non autorisée. Téléversez-la depuis Zelvora.');
    if (useSupabase && user.accessToken) {
      const organization = await ensureOrganization({ ...user, accessToken: user.accessToken });
      const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl;
      if (!configuredUrl || !supabaseServiceRoleKey) throw new Error('Configuration serveur Supabase incomplète. Contactez l’administrateur.');
      // Authentication and organization ownership were established above with the
      // user's JWT. The service client makes the final two inserts reliable even
      // when a newly-created user's RLS/JWT state has not propagated yet.
      const service = createClient(configuredUrl, supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data: membership, error: membershipError } = await service.from('organization_members').select('organization_id').eq('organization_id', organization.id).eq('user_id', user.id).maybeSingle();
      if (membershipError || !membership) throw new Error('Vous n’êtes pas autorisé à créer cette boutique.');
      const { data: existing, error: existingError } = await service.from('stores').select('*').eq('organization_id', organization.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (existingError) fail(existingError, 'Impossible de vérifier votre boutique.');
      let storeRow = existing;
      let createdStore = false;
      if (!storeRow) {
        const timestampSlug = `${slugify(input.storeName)}-${crypto.randomUUID().slice(0, 7)}`;
        const { data, error: storeError } = await service.from('stores').insert({ organization_id: organization.id, owner_id: user.id, name: input.storeName,brand_name:input.brandName||null,business_category:input.businessCategory||null,whatsapp:input.whatsapp||null,onboarding_created:true,theme_style:input.themeStyle, slug: timestampSlug, tagline: input.tagline || 'Découvrez notre sélection.', status: 'DRAFT', currency: input.currency, country_code: input.countryCode, primary_color: input.primaryColor, secondary_color: '#B9F6D0' }).select('*').single();
        if (storeError || !data) fail(storeError, 'Impossible de créer la boutique.');
        storeRow = data; createdStore = true;
      }
      let product = null;
      if (input.product) {
        const { data: currentProduct, error: currentProductError } = await service.from('products').select('*').eq('store_id', storeRow.id).order('created_at', { ascending: true }).limit(1).maybeSingle();
        if (currentProductError) fail(currentProductError, 'Impossible de vérifier le produit.');
        if (currentProduct) product = mapProduct(currentProduct);
        else {
          const { data: productRow, error: productError } = await service.from('products').insert({ store_id: storeRow.id, name: input.product.name, slug: `${slugify(input.product.name)}-${crypto.randomUUID().slice(0, 5)}`, description: input.product.description, price: input.product.price, product_type: input.product.type, status: 'PUBLISHED', image_path: input.product.imageUrl || null, benefits: input.product.benefits, specifications: [], source_type: input.product.source, source_url: input.product.sourceUrl || null }).select('*').single();
          if (productError || !productRow) { if (createdStore) await service.from('stores').delete().eq('id', storeRow.id); fail(productError, 'Impossible de créer le produit.'); }
          product = mapProduct(productRow);
        }
      }
      // Completing onboarding means the merchant expects the imported product to be
      // immediately visible on the public store. Publishing here also repairs a
      // store left in DRAFT by an interrupted previous attempt.
      const publishedAt = new Date().toISOString();
      const { data: publishedStore, error: publishError } = await service.from('stores').update({ status: 'PUBLISHED', published_at: publishedAt, updated_at: publishedAt }).eq('id', storeRow.id).eq('owner_id', user.id).select('*').single();
      if (publishError || !publishedStore) fail(publishError, 'Boutique créée, mais sa publication a échoué.');
      storeRow = publishedStore;
      return Response.json({ store: mapStore(storeRow), product, publicUrl: `/store/${storeRow.slug}`, recovered: !createdStore }, { status: createdStore ? 201 : 200 });
    }
    const result = await mutateDb((db) => { const organization = db.organizations.find((item) => item.userId === user.id); if (!organization) throw new Error('Organisation introuvable.'); if (db.stores.filter((item) => item.organizationId === organization.id).length >= 1) throw new Error('La limite du plan gratuit est atteinte : une boutique.'); const createdAt = now(); const storeSlug = uniqueSlug(db.stores.map((item) => item.slug), input.storeName); const store = { id: id(), organizationId: organization.id, ownerId: user.id, name: input.storeName, slug: storeSlug, tagline: input.tagline || 'Découvrez notre sélection.', status: 'DRAFT' as const, currency: 'XOF', countryCode: 'NE', primaryColor: input.primaryColor, secondaryColor: '#B9F6D0', createdAt }; let product;db.stores.push(store);if(input.product){product={ id: id(), storeId: store.id, name: input.product.name, slug: uniqueSlug([], input.product.name), description: input.product.description, price: input.product.price, type: input.product.type, status: 'PUBLISHED' as const, imageUrl: input.product.imageUrl, benefits: input.product.benefits, specifications: [], source: input.product.source, sourceUrl: input.product.sourceUrl, createdAt };db.products.push(product)}return { store, product }; });
    return Response.json({ store: result.store, product: result.product, publicUrl: `/store/${result.store.slug}` }, { status: 201 });
  } catch (error) { return apiError(error); }
}
