import { AppNav } from '@/components/app-nav';
import { ProductsClient } from '@/components/products-client';
export default function ProductsPage() { return <main className="min-h-screen bg-[#F7F7FB]"><AppNav active="products" /><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><ProductsClient /></div></main>; }
