'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DashboardMenu({ activePage }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dashboardMenu">
      <button
        type="button"
        className="dashboardMenuButton"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        aria-controls="dashboard-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>
      {open && (
        <nav className="dashboardMenuPanel" id="dashboard-navigation" aria-label="Dashboard navigation">
          {activePage === 'esi' ? (
            <>
              <Link href="/dashboard/esi-applications/verified" onClick={() => setOpen(false)}>
                Verified Applications
              </Link>
              <Link href="/dashboard/manage-applications" onClick={() => setOpen(false)}>
                Manage Applications
              </Link>
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </Link>
            </>
          ) : (
            <Link href="/dashboard/esi-applications/verified" onClick={() => setOpen(false)}>
              ESI Forms
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
