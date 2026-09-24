import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { id, mutateDb, now, slugify } from '@/lib/db';
import { apiError, assertSameOrigin } from '@/lib/security';
import { clientFor, fail, mapProduct, storeForUser } from '@/lib/supabase/data';
import { supabaseUrl, useSupabase } from '@/lib/supabase/config';
import type { ProductRecord } from '@/lib/types';

const productSchema = z.object({
  name: z.string().trim().min(2, 'Indiquez le nom du produit.').max(140),
  description: z.string().trim().min(1, 'Ajoutez une description.').max(3000),
  price: z.number().finite().min(0, 'Le prix ne peut pas être négatif.').max(100000000),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']).default('PHYSICAL'),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
  source: z.enum(['LINK', 'IMAGE', 'MANUAL']),
  sourceUrl: z.string().url().max(2048).optional(),
  benefits: z.array(z.string().trim().min(1).max(180)).max(6).default([]),
  imageUrl: z.string().max(2048).optional()
});

function permittedImageUrl(url: string | undefined) {
  return !url || url.startsWith('/uploads/') || Boolean(supabaseUrl && url.startsWith(`${supabaseUrl}/storage/v1/object/public/store-assets/`));
}

async function productLimit(client: ReturnType<typeof clientFor>, organizationId: string) {
  const { data, error } = await client.from('subscriptions').select('plans(max_products)').eq('organization_id', organizationId).in('status', ['TRIAL', 'ACTIVE', 'PAST_DUE']).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) fail(error, 'Impossible de vérifier votre plan.');
  const plan = data?.plans as unknown as { max_products?: number | null } | null;
  return plan?.max_products ?? null;
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) throw new Error('Utilisateur non authentifié.');
    if (useSupabase && user.accessToken) {
      const { organization, store } = await storeForUser({ ...user, accessToken: user.accessToken });
      if (!store) return Response.json({ store: null, products: [], limit: null });
      const client = clientFor(user);
      const [{ data, error }, limit] = await Promise.all([
        client.from('products').select('*').eq('store_id', store.id).order('created_at', { ascending: false }),
        productLimit(client, organization.id)
      ]);
      if (error) fail(error, 'Impossible de lire le catalogue.');
      return Response.json({ store, products: (data || []).map(mapProduct), limit });
    }
    const db = await (await import('@/lib/db')).readDb();
    const organization = db.organizations.find((item) => item.userId === user.id);
    const store = organization ? db.stores.find((item) => item.organizationId === organization.id) : undefined;
    return Response.json({ store: store || null, products: store ? db.products.filter((item) => item.storeId === store.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [], limit: 6 });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await currentUser();
    if (!user) throw new Error('Utilisateur non authentifié.');
    const input = productSchema.parse(await request.json());
    if (!permittedImageUrl(input.imageUrl)) throw new Error('Image non autorisée. Téléversez-la depuis Zelvora.');
    if (useSupabase && user.accessToken) {
      const { organization, store } = await storeForUser({ ...user, accessToken: user.accessToken });
      if (!store) throw new Error('Créez votre boutique avant d’ajouter un produit.');
      const client = clientFor(user);
      const [{ count, error: countError }, limit] = await Promise.all([
        client.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
        productLimit(client, organization.id)
      ]);
      if (countError) fail(countError, 'Impossible de vérifier votre catalogue.');
      if (limit !== null && (count || 0) >= limit) throw new Error(`La limite de votre plan est atteinte : ${limit} produits maximum.`);
      const { data, error } = await client.from('products').insert({
        store_id: store.id, name: input.name, slug: `${slugify(input.name)}-${crypto.randomUUID().slice(0, 7)}`,
        description: input.description, price: input.price, product_type: input.type, status: input.status,
        image_path: input.imageUrl || null, benefits: input.benefits, specifications: [], source_type: input.source, source_url: input.sourceUrl || null
      }).select('*').single();
      if (error) fail(error, 'Impossible d’ajouter le produit.');
      return Response.json({ product: mapProduct(data), limit }, { status: 201 });
    }
    const result = await mutateDb((db) => {
      const organization = db.organizations.find((item) => item.userId === user.id);
      const store = organization ? db.stores.find((item) => item.organizationId === organization.id) : undefined;
      if (!store) throw new Error('Créez votre boutique avant d’ajouter un produit.');
      const products = db.products.filter((item) => item.storeId === store.id);
      if (products.length >= 6) throw new Error('La limite du plan gratuit est atteinte : 6 produits maximum.');
      const product: ProductRecord = { id: id(), storeId: store.id, name: input.name, slug: `${slugify(input.name)}-${id().slice(0, 6)}`, description: input.description, price: input.price, type: input.type, status: input.status, imageUrl: input.imageUrl, benefits: input.benefits, specifications: [], source: input.source, sourceUrl: input.sourceUrl, createdAt: now() };
      db.products.push(product);
      return product;
    });
    return Response.json({ product: result, limit: 6 }, { status: 201 });
  } catch (error) { return apiError(error); }
}
