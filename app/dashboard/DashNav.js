'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/promotions', label: 'Promotions' },
  { href: '/dashboard/customers', label: 'Customers' },
  { href: '/dashboard/campaigns', label: 'Campaigns' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default function DashNav({ companyName, isPlatformAdmin }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="dash-sidebar">
      <div className="dash-logo">Coursing</div>
      <nav className="dash-nav">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? 'active' : ''}
          >
            {link.label}
          </Link>
        ))}
        {isPlatformAdmin && (
          <Link
            href="/dashboard/admin"
            className={pathname === '/dashboard/admin' ? 'active' : ''}
            style={{ borderTop: '1px solid rgba(241, 237, 225, 0.15)', marginTop: 6, paddingTop: 16 }}
          >
            Admin
          </Link>
        )}
      </nav>
      <button className="dash-signout" onClick={handleSignOut}>
        Sign out{companyName ? ` (${companyName})` : ''}
      </button>
    </aside>
  );
}
