import { redirect } from 'next/navigation';
import { getCurrentCompany } from '@/lib/auth';
import AdminCompaniesView from './AdminCompaniesView';

export default async function DashboardAdminPage() {
  const company = await getCurrentCompany();
  if (!company) redirect('/login');
  if (!company.is_platform_admin) redirect('/dashboard');

  return <AdminCompaniesView />;
}
