import { MerchantShell } from '@/components/merchant-shell';
import { ProductEditorClient } from '@/components/product-editor-client';
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <MerchantShell active="products"><ProductEditorClient productId={id} /></MerchantShell>; }
