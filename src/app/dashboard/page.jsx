import './page.css';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import DashboardNavbar from './DashboardNavbar';
import EmployeeTable from './EmployeeTable';
import { getEmployeeName } from './employee';

export default async function Dashboard() {
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
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', color: '#333333', overflow: 'hidden' }}>
      
      <DashboardNavbar empName={empName} activePage="resign" />

      {/* Main Container */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 20px 0 20px', minHeight: 0 }}>
        <EmployeeTable />
      </main>
      
    </div>
  );
}