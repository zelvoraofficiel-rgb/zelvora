import { createSupabaseUserClient } from '@/lib/supabase/server';
import type { StoreRecord, ProductRecord, OrderRecord, CustomerRecord, NotificationRecord } from '@/lib/types';

export type SupabaseAppUser = { id: string; email: string; name: string; accessToken: string };
export type Organization = { id: string; name: string; slug: string };

export function fail(error: { message?: string } | null, fallback = 'Opération Supabase impossible.'): never {
  throw new Error(error?.message || fallback);
}

export function clientFor(user: { accessToken?: string }) {
  if (!user.accessToken) throw new Error('Session Supabase introuvable.');
  return createSupabaseUserClient(user.accessToken);
}

export async function ensureOrganization(user: SupabaseAppUser): Promise<Organization> {
  const client = clientFor(user);
  const { data, error } = await client.rpc('bootstrap_current_organization');
  if (error) fail(error, 'Impossible d’initialiser votre organisation.');
  const organization = Array.isArray(data) ? data[0] : data;
  if (!organization?.organization_id) throw new Error('Organisation introuvable après initialisation.');
  return { id: organization.organization_id, name: organization.organization_name, slug: organization.organization_slug };
}

export function mapStore(row: any): StoreRecord {
  return { id: row.id, organizationId: row.organization_id, ownerId: row.owner_id, name: row.name, slug: row.slug, tagline: row.tagline,
    status: row.status, currency: row.currency, countryCode: row.country_code, primaryColor: row.primary_color, secondaryColor: row.secondary_color,
    createdAt: row.created_at, publishedAt: row.published_at || undefined };
}
export function mapProduct(row: any): ProductRecord {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return { id: row.id, storeId: row.store_id, name: row.name, slug: row.slug, description: row.description, price: Number(row.price),
    type: row.product_type, status: row.status, imageUrl: row.image_path || undefined, benefits: row.benefits || [], specifications: row.specifications || [],
    source: row.source_type, sourceUrl: row.source_url || undefined, createdAt: row.created_at, categoryId: row.category_id || undefined,
    categoryName: category?.name, compareAtPrice: row.compare_at_price === null || row.compare_at_price === undefined ? undefined : Number(row.compare_at_price),
    stock: row.stock === null || row.stock === undefined ? null : Number(row.stock), sku: row.sku || undefined };
}
export function mapCustomer(row: any): CustomerRecord {
  return { id: row.id, storeId: row.store_id, name: row.name, phone: row.phone, whatsapp: row.whatsapp || undefined, email: row.email || undefined,
    orderCount: row.order_count, totalSpent: Number(row.total_spent), lastOrderAt: row.last_order_at, createdAt: row.created_at };
}
export function mapOrder(row: any): OrderRecord {
  return { id: row.id, storeId: row.store_id, customerId: row.customer_id, number: row.number, status: row.status, paymentStatus: row.payment_status,
    paymentMethod: row.payment_method, currency: row.currency, total: Number(row.total), quantity: row.quantity, productId: row.product_id,
    productName: row.product_name, delivery: row.delivery || {}, createdAt: row.created_at };
}
export function mapNotification(row: any): NotificationRecord {
  return { id: row.id, storeId: row.store_id, userId: row.user_id, title: row.title, body: row.body || '', read: Boolean(row.read_at), createdAt: row.created_at };
}

export async function storeForUser(user: SupabaseAppUser) {
  const organization = await ensureOrganization(user); const client = clientFor(user);
  const { data, error } = await client.from('stores').select('*').eq('organization_id', organization.id).order('created_at', { ascending: true }).limit(1);
  if (error) fail(error, 'Impossible de lire votre boutique.');
  return { organization, store: data?.[0] ? mapStore(data[0]) : null };
}
