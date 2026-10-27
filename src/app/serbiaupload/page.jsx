import '../dashboard/page.css';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import Link from 'next/link';
import LogoutButton from '../dashboard/LogoutButton';
import SerbiaUploadClient from './SerbiaUploadClient';
import { getPayPool, sql } from '@/lib/payDb';

async function getEmployeeName(empcode) {
  if (!empcode || empcode === 'Member') return empcode;
  try {
    const pool = await getPayPool();
    const result = await pool.request()
      .input('empcode', sql.VarChar, empcode)
      .query('SELECT EMPNAME FROM payroll.dbo.EMPMAST WHERE EMPCODE = @empcode');
    
    if (result.recordset && result.recordset.length > 0) {
      return result.recordset[0].EMPNAME?.trim() || empcode;
    }
  } catch (err) {
    console.error('Error fetching employee name:', err);
  }
  return empcode;
}

export default async function SerbiaUploadPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let user = { name: 'Member', email: 'Not available', username: 'Member' };

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      user = {
        ...payload,
        name: payload.name || payload.username || 'Member',
        username: payload.username || payload.name || 'Member',
        email: payload.email || 'Not available',
      };
    } catch (error) {
      console.error('Failed to decrypt auth token:', error);
    }
  }

  let empName = user.username;
  if (token && user.username && user.username !== 'Member') {
    empName = await getEmployeeName(user.username);
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', color: '#333333', overflow: 'hidden' }}>
      
      {/* Normal Navbar */}
      <nav className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #cccccc', backgroundColor: '#f8f9fa', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Greentech Industries</span>
          <span style={{ fontSize: '11px', color: '#666666' }}>Officials Leave Management System</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '13px' }}>
            Welcome, <strong>{empName}</strong>
          </span>
          <Link href="/dashboard" className="nav-btn-inactive">
            🗐 Resign Forms
          </Link>
          <Link href="/serbiaupload" className="nav-btn-active">
            ⬆️ Upload Serbia Data
          </Link>
          <LogoutButton />
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 20px', minHeight: 0, overflow: 'hidden' }}>
        <SerbiaUploadClient />
      </main>
      
    </div>
  );
}