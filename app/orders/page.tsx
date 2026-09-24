import { AppNav } from '@/components/app-nav';
import { OrdersClient } from '@/components/orders-client';
export default function OrdersPage(){return <main className="min-h-screen bg-[#F7F7FB]"><AppNav active="orders" /><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><OrdersClient /></div></main>;}
