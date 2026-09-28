export type StoreStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED' | 'ARCHIVED';
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ProductType = 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';

export type UserRecord = {
  id: string; email: string; name: string; passwordHash: string; createdAt: string;
};
export type OrganizationRecord = { id: string; userId: string; name: string; slug: string; createdAt: string };
export type StoreRecord = {
  id: string; organizationId: string; ownerId: string; name: string; slug: string; tagline: string;
  status: StoreStatus; currency: string; countryCode: string; primaryColor: string; secondaryColor: string;
  createdAt: string; publishedAt?: string;
};
export type ProductRecord = {
  id: string; storeId: string; name: string; slug: string; description: string; price: number;
  type: ProductType; status: ProductStatus; imageUrl?: string; benefits: string[];
  specifications: Array<{ label: string; value: string; confidence: 'verified' | 'needs_review' }>;
  source: 'LINK' | 'IMAGE' | 'MANUAL'; sourceUrl?: string; createdAt: string;
  categoryId?: string; categoryName?: string; compareAtPrice?: number; stock?: number | null; sku?: string;
};
export type CategoryRecord = { id: string; storeId: string; name: string; slug: string; createdAt: string };
export type CustomerRecord = {
  id: string; storeId: string; name: string; phone: string; whatsapp?: string; email?: string;
  orderCount: number; totalSpent: number; lastOrderAt: string; createdAt: string;
};
export type OrderRecord = {
  id: string; storeId: string; customerId: string; number: string; status: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'; paymentMethod: 'CASH_ON_DELIVERY';
  currency: string; total: number; quantity: number; productId: string; productName: string;
  delivery: { country: string; city: string; district?: string; address?: string; notes?: string };
  createdAt: string;
};
export type NotificationRecord = { id: string; storeId: string; userId: string; title: string; body: string; read: boolean; createdAt: string };
export type LocalDb = {
  users: UserRecord[]; organizations: OrganizationRecord[]; stores: StoreRecord[]; products: ProductRecord[]; categories: CategoryRecord[];
  customers: CustomerRecord[]; orders: OrderRecord[]; notifications: NotificationRecord[];
};

export type ProductAnalysis = {
  name: string;
  commercialTitle: string;
  description: string;
  benefits: string[];
  category: string;
  faq: Array<{ question: string; answer: string; confidence: 'verified' | 'needs_review' }>;
  missingInformation: string[];
  notice: string;
};
