import { DashboardClient } from '@/components/dashboard-client';
import { AppNav } from '@/components/app-nav';
export default function DashboardPage() { return <main className="min-h-screen bg-[#F7F7FB]"><AppNav active="dashboard" /><div className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><DashboardClient /></div></main>; }
