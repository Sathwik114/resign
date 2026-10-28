'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DashboardMenu() {
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
          <Link href="/dashboard/esi-applications" onClick={() => setOpen(false)}>
            ESI application forms
          </Link>
        </nav>
      )}
    </div>
  );
}
