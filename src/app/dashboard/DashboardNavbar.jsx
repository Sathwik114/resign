import Link from 'next/link';
import LogoutButton from './LogoutButton';
import DashboardMenu from './DashboardMenu';

export default function DashboardNavbar({ empName, activePage }) {
  return (
    <nav className="no-print dashboardNavbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #cccccc', backgroundColor: '#f8f9fa', flexShrink: 0 }}>
      <div className="dashboardNavbarBrand">
        <DashboardMenu activePage={activePage} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Greentech Industries</span>
          <span style={{ fontSize: '11px', color: '#666666' }}>
            {activePage === 'esi'
              ? 'ESI Applications Management System'
              : activePage === 'serbia'
                ? 'Officials Leave Management System'
                : 'Resign Forms Management System'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontSize: '13px' }}>
          Welcome, <strong>{empName}</strong>
        </span>
        {activePage === 'esi' && (
          <>
            <Link href="/dashboard/esi-applications" className="nav-btn-inactive">
              New Applications
            </Link>
            <Link href="/dashboard/esi-applications/verified" className="nav-btn-inactive">
              Verified Applications
            </Link>
            <Link href="/dashboard/manage-applications" className="nav-btn-inactive">
              Manage Applications
            </Link>
          </>
        )}
        {activePage !== 'esi' && (
          <>
            <Link href="/dashboard" className={activePage === 'resign' ? 'nav-btn-active' : 'nav-btn-inactive'}>
              🗐 Resign Forms
            </Link>
            <Link href="/serbiaupload" className={activePage === 'serbia' ? 'nav-btn-active' : 'nav-btn-inactive'}>
              ⬆️ Upload Serbia Data
            </Link>
          </>
        )}
        <LogoutButton />
      </div>
    </nav>
  );
}
