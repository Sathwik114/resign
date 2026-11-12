'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';
import DashboardMenu from './DashboardMenu';

export default function DashboardNavbar({ empName, activePage, canManage = false }) {
  const pathname = usePathname() || '';

  const isResign = pathname.startsWith('/dashboard/resign') || activePage === 'resign';
  const isSerbia = pathname.startsWith('/serbiaupload') || activePage === 'serbia';

  return (
    <nav
      className="no-print dashboardNavbar"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        backgroundColor: '#102A43',
        color: '#ffffff',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(16, 42, 67, 0.2)',
      }}
    >
      <div className="dashboardNavbarBrand">
        <DashboardMenu activePage={activePage} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#ffffff' }}>
            Greentech Industries
          </span>
          <span style={{ fontSize: '11px', color: '#9FB3C8', letterSpacing: '0.2px' }}>
            {activePage === 'esi'
              ? 'ESI Applications Management System'
              : activePage === 'serbia'
                ? 'Officials Leave Management System'
                : 'Resign Forms Management System'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontSize: '13px', color: '#ffffff' }}>
          Welcome, <strong style={{ color: '#ffffff' }}>{empName}</strong>
        </span>
        {activePage === 'esi' && (
          <Link
            href="/dashboard/esi-applications"
            className={pathname.startsWith('/dashboard/esi-applications') ? 'nav-btn-active' : 'nav-btn-inactive'}
            aria-current={pathname.startsWith('/dashboard/esi-applications') ? 'page' : undefined}
          >
            Applications
          </Link>
        )}
        {activePage === 'esi' && canManage && (
          <Link
            href="/dashboard/settings"
            className={`esiFormSettingsIcon${pathname === '/dashboard/settings' ? ' isActive' : ' isInactive'}`}
            aria-label="Settings"
            aria-current={pathname === '/dashboard/settings' ? 'page' : undefined}
          >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.55 2.55l-.1-.1a1.8 1.8 0 0 0-3.07 1.27v.28a1.8 1.8 0 0 1-3.6 0v-.15a1.8 1.8 0 0 0-3.07-1.27l-.1.1a1.8 1.8 0 0 1-2.55-2.55l.1-.1a1.8 1.8 0 0 0-1.27-3.07H3.1a1.8 1.8 0 0 1 0-3.6h.15a1.8 1.8 0 0 0 1.27-3.07l-.1-.1a1.8 1.8 0 0 1 2.55-2.55l.1.1a1.8 1.8 0 0 0 3.07-1.27V3.1a1.8 1.8 0 0 1 3.6 0v.15a1.8 1.8 0 0 0 3.07 1.27l.1-.1a1.8 1.8 0 0 1 2.55 2.55l-.1.1a1.8 1.8 0 0 0 1.27 3.07h.28a1.8 1.8 0 0 1 0 3.6h-.15A1.8 1.8 0 0 0 19.4 15Z" />
              </svg>
          </Link>
        )}
        {activePage !== 'esi' && (
          <>
            <Link
              href="/dashboard/resign"
              className={isResign ? 'nav-btn-active' : 'nav-btn-inactive'}
            >
              🗐 Resign Forms
            </Link>
            <Link
              href="/serbiaupload"
              className={isSerbia ? 'nav-btn-active' : 'nav-btn-inactive'}
            >
              ⬆️ Upload Serbia Data
            </Link>
          </>
        )}
        <LogoutButton />
      </div>
    </nav>
  );
}
