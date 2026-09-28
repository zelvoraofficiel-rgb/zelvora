import { NextRequest } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { id, mutateDb, now, slugify } from '@/lib/db';
import { apiError, assertSameOrigin } from '@/lib/security';
import { clientFor, fail, mapProduct, storeForUser } from '@/lib/supabase/data';
import { supabaseUrl, useSupabase } from '@/lib/supabase/config';
import type { CategoryRecord, ProductRecord } from '@/lib/types';

const productSchema = z.object({
  name: z.string().trim().min(2, 'Indiquez le nom du produit.').max(140),
  description: z.string().trim().min(1, 'Ajoutez une description.').max(3000),
  price: z.number().finite().min(0, 'Le prix ne peut pas être négatif.').max(100000000),
  compareAtPrice: z.number().finite().min(0).max(100000000).nullable().optional(),
  stock: z.number().int().min(0).max(100000000).nullable().optional(),
  sku: z.string().trim().max(80).optional(),
  categoryName: z.string().trim().min(2).max(80).optional().or(z.literal('')),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SERVICE']).default('PHYSICAL'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('PUBLISHED'),
  source: z.enum(['LINK', 'IMAGE', 'MANUAL']),
  sourceUrl: z.string().url().max(2048).optional(),
  benefits: z.array(z.string().trim().min(1).max(180)).max(6).default([]),
  imageUrl: z.string().max(2048).optional()
});

function permittedImageUrl(url: string | undefined) { return !url || url.startsWith('/uploads/') || Boolean(supabaseUrl && url.startsWith(`${supabaseUrl}/storage/v1/object/public/store-assets/`)); }
async function productLimit(client: ReturnType<typeof clientFor>, organizationId: string) {
  const { data, error } = await client.from('subscriptions').select('plans(max_products)').eq('organization_id', organizationId).in('status', ['TRIAL', 'ACTIVE', 'PAST_DUE']).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) fail(error, 'Impossible de vérifier votre plan.');
  const plan = data?.plans as unknown as { max_products?: number | null } | null;
  return plan?.max_products ?? null;
}
async function categoryForSupabase(client: ReturnType<typeof clientFor>, storeId: string, categoryName: string | undefined) {
  const name = categoryName?.trim(); if (!name) return null;
  const slug = slugify(name);
  const { data, error } = await client.from('categories').upsert({ store_id: storeId, name, slug }, { onConflict: 'store_id,slug' }).select('id,name').single();
  if (error) fail(error, 'Impossible d’enregistrer la catégorie.');
  return data;
}
function localCategory(db: { categories: CategoryRecord[] }, storeId: string, categoryName: string | undefined) {
  const name = categoryName?.trim(); if (!name) return undefined;
  const slug = slugify(name); let category = db.categories.find((item) => item.storeId === storeId && item.slug === slug);
  if (!category) { category = { id: id(), storeId, name, slug, createdAt: now() }; db.categories.push(category); }
  return category;
}

export async function GET() {
  try {
    const user = await currentUser(); if (!user) throw new Error('Utilisateur non authentifié.');
    if (useSupabase && user.accessToken) {
      const { organization, store } = await storeForUser({ ...user, accessToken: user.accessToken });
      if (!store) return Response.json({ store: null, products: [], categories: [], limit: null });
      const client = clientFor(user);
      const [productsResult, categoriesResult, limit] = await Promise.all([
        client.from('products').select('*,categories(name)').eq('store_id', store.id).order('created_at', { ascending: false }),
        client.from('categories').select('id,name,slug').eq('store_id', store.id).order('name'), productLimit(client, organization.id)
      ]);
      if (productsResult.error) fail(productsResult.error, 'Impossible de lire le catalogue.'); if (categoriesResult.error) fail(categoriesResult.error, 'Impossible de lire les catégories.');
      return Response.json({ store, products: (productsResult.data || []).map(mapProduct), categories: categoriesResult.data || [], limit });
    }
    const db = await (await import('@/lib/db')).readDb(); const organization = db.organizations.find((item) => item.userId === user.id); const store = organization ? db.stores.find((item) => item.organizationId === organization.id) : undefined;
    const categories = store ? db.categories.filter((item) => item.storeId === store.id) : [];
    const products = store ? db.products.filter((item) => item.storeId === store.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((product) => ({ ...product, categoryName: categories.find((item) => item.id === product.categoryId)?.name || product.categoryName })) : [];
    return Response.json({ store: store || null, products, categories, limit: 6 });
  } catch (error) { return apiError(error); }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request); const user = await currentUser(); if (!user) throw new Error('Utilisateur non authentifié.'); const input = productSchema.parse(await request.json());
    if (!permittedImageUrl(input.imageUrl)) throw new Error('Image non autorisée. Téléversez-la depuis Zelvora.');
    if (input.compareAtPrice !== null && input.compareAtPrice !== undefined && input.compareAtPrice < input.price) throw new Error('Le prix comparé doit être supérieur ou égal au prix de vente.');
    if (useSupabase && user.accessToken) {
      const { organization, store } = await storeForUser({ ...user, accessToken: user.accessToken }); if (!store) throw new Error('Créez votre boutique avant d’ajouter un produit.'); const client = clientFor(user);
      const [{ count, error: countError }, limit] = await Promise.all([client.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id), productLimit(client, organization.id)]);
      if (countError) fail(countError, 'Impossible de vérifier votre catalogue.'); if (limit !== null && (count || 0) >= limit) throw new Error(`La limite de votre plan est atteinte : ${limit} produits maximum.`);
      const category = await categoryForSupabase(client, store.id, input.categoryName);
      const { data, error } = await client.from('products').insert({ store_id: store.id, category_id: category?.id || null, name: input.name, slug: `${slugify(input.name)}-${crypto.randomUUID().slice(0, 7)}`, description: input.description, price: input.price, compare_at_price: input.compareAtPrice ?? null, stock: input.stock ?? null, sku: input.sku || null, product_type: input.type, status: input.status, image_path: input.imageUrl || null, benefits: input.benefits, specifications: [], source_type: input.source, source_url: input.sourceUrl || null }).select('*,categories(name)').single();
      if (error) fail(error, 'Impossible d’ajouter le produit.'); return Response.json({ product: mapProduct(data), limit }, { status: 201 });
    }
    const result = await mutateDb((db) => { const organization = db.organizations.find((item) => item.userId === user.id); const store = organization ? db.stores.find((item) => item.organizationId === organization.id) : undefined; if (!store) throw new Error('Créez votre boutique avant d’ajouter un produit.'); const products = db.products.filter((item) => item.storeId === store.id); if (products.length >= 6) throw new Error('La limite du plan gratuit est atteinte : 6 produits maximum.'); const category = localCategory(db, store.id, input.categoryName); const product: ProductRecord = { id: id(), storeId: store.id, name: input.name, slug: `${slugify(input.name)}-${id().slice(0, 6)}`, description: input.description, price: input.price, compareAtPrice: input.compareAtPrice ?? undefined, stock: input.stock ?? null, sku: input.sku || undefined, categoryId: category?.id, categoryName: category?.name, type: input.type, status: input.status, imageUrl: input.imageUrl, benefits: input.benefits, specifications: [], source: input.source, sourceUrl: input.sourceUrl, createdAt: now() }; db.products.push(product); return product; });
    return Response.json({ product: result, limit: 6 }, { status: 201 });
  } catch (error) { return apiError(error); }
}
