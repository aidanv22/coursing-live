import { redirect } from 'next/navigation';
import { getCurrentCompany } from '@/lib/auth';
import DashNav from './DashNav';

export default async function DashboardLayout({ children }) {
  const company = await getCurrentCompany();
  if (!company) redirect('/login');

  return (
    <div className="dash-shell">
      <DashNav companyName={company.name} />
      <main className="dash-main">{children}</main>
    </div>
  );
}
