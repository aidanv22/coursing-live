import { redirect } from 'next/navigation';
import { getCurrentCompany } from '@/lib/auth';
import TollFreeView from './TollFreeView';

export default async function TollFreeAdminPage() {
  const company = await getCurrentCompany();
  if (!company) redirect('/login');
  if (!company.is_platform_admin) redirect('/dashboard');

  return <TollFreeView />;
}
