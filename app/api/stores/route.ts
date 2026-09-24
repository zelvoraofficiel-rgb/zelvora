import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { id, mutateDb, now, slugify, uniqueSlug } from '@/lib/db';
import { apiError, assertSameOrigin } from '@/lib/security';
import { clientFor, ensureOrganization, fail, mapProduct, mapStore } from '@/lib/supabase/data';
import { supabaseUrl, useSupabase } from '@/lib/supabase/config';

const bodySchema = z.object({
  storeName: z.string().trim().min(2, 'Donnez un nom à votre boutique.').max(80), tagline: z.string().trim().max(160).default('Découvrez notre sélection.'), primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6557F5'),
  product: z.object({ name: z.string().trim().min(2).max(140), description: z.string().trim().min(1).max(3000), price: z.number().finite().min(0).max(100000000), type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']).default('PHYSICAL'), source: z.enum(['LINK', 'IMAGE', 'MANUAL']), sourceUrl: z.string().url().max(2048).optional(), benefits: z.array(z.string().trim().min(1).max(180)).max(6).default([]), imageUrl: z.string().max(2048).optional() })
});
function permittedImageUrl(url: string | undefined) { return !url || url.startsWith('/uploads/') || Boolean(supabaseUrl && url.startsWith(`${supabaseUrl}/storage/v1/object/public/store-assets/`)); }
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); const user = await currentUser(); if (!user) throw new Error('Utilisateur non authentifié.'); const input = bodySchema.parse(await request.json()); if (!permittedImageUrl(input.product.imageUrl)) throw new Error('Image non autorisée. Téléversez-la depuis Zelvora.');
    if (useSupabase && user.accessToken) {
      const organization = await ensureOrganization({ ...user, accessToken: user.accessToken }); const client = clientFor(user);
      const { count, error: countError } = await client.from('stores').select('id', { count: 'exact', head: true }).eq('organization_id', organization.id); if (countError) fail(countError); if ((count || 0) >= 1) throw new Error('La limite du plan gratuit est atteinte : une boutique.');
      const timestampSlug = `${slugify(input.storeName)}-${crypto.randomUUID().slice(0, 7)}`;
      const { data: storeRow, error: storeError } = await client.from('stores').insert({ organization_id: organization.id, owner_id: user.id, name: input.storeName, slug: timestampSlug, tagline: input.tagline || 'Découvrez notre sélection.', status: 'DRAFT', currency: 'XOF', country_code: 'NE', primary_color: input.primaryColor, secondary_color: '#B9F6D0' }).select('*').single();
      if (storeError) fail(storeError, 'Impossible de créer la boutique.');
      const { data: productRow, error: productError } = await client.from('products').insert({ store_id: storeRow.id, name: input.product.name, slug: `${slugify(input.product.name)}-${crypto.randomUUID().slice(0, 5)}`, description: input.product.description, price: input.product.price, product_type: input.product.type, status: 'PUBLISHED', image_path: input.product.imageUrl || null, benefits: input.product.benefits, specifications: [], source_type: input.product.source, source_url: input.product.sourceUrl || null }).select('*').single();
      if (productError) { await client.from('stores').delete().eq('id', storeRow.id); fail(productError, 'Impossible de créer le produit.'); }
      return Response.json({ store: mapStore(storeRow), product: mapProduct(productRow), publicUrl: `/store/${storeRow.slug}` }, { status: 201 });
    }
    const result = await mutateDb((db) => { const organization = db.organizations.find((item) => item.userId === user.id); if (!organization) throw new Error('Organisation introuvable.'); if (db.stores.filter((item) => item.organizationId === organization.id).length >= 1) throw new Error('La limite du plan gratuit est atteinte : une boutique.'); const createdAt = now(); const storeSlug = uniqueSlug(db.stores.map((item) => item.slug), input.storeName); const store = { id: id(), organizationId: organization.id, ownerId: user.id, name: input.storeName, slug: storeSlug, tagline: input.tagline || 'Découvrez notre sélection.', status: 'DRAFT' as const, currency: 'XOF', countryCode: 'NE', primaryColor: input.primaryColor, secondaryColor: '#B9F6D0', createdAt }; const product = { id: id(), storeId: store.id, name: input.product.name, slug: uniqueSlug([], input.product.name), description: input.product.description, price: input.product.price, type: input.product.type, status: 'PUBLISHED' as const, imageUrl: input.product.imageUrl, benefits: input.product.benefits, specifications: [], source: input.product.source, sourceUrl: input.product.sourceUrl, createdAt }; db.stores.push(store); db.products.push(product); return { store, product }; });
    return Response.json({ store: result.store, product: result.product, publicUrl: `/store/${result.store.slug}` }, { status: 201 });
  } catch (error) { return apiError(error); }
}
