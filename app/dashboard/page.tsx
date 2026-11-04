import { DashboardClient } from '@/components/dashboard-client';
import { MerchantShell } from '@/components/merchant-shell';
import { WhatsAppHelp } from '@/components/whatsapp-help';
export default function DashboardPage() { return <MerchantShell active="dashboard"><WhatsAppHelp/><DashboardClient /></MerchantShell>; }
