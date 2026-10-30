import '../page.css';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import DashboardNavbar from '../DashboardNavbar';
import { getEmployeeName } from '../employee';
import ManageApplicationsTable from './table';

export default async function ManageApplicationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let username = 'Member';

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      username = payload.username || payload.name || 'Member';
    } catch (error) {
      console.error('Failed to decrypt auth token:', error);
    }
  }
  const empName = token ? await getEmployeeName(username) : username;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', color: '#333333', overflow: 'hidden' }}>
      <DashboardNavbar empName={empName} activePage="esi" />
      <div style={{ flex: 1, minHeight: 0 }}>
        <ManageApplicationsTable />
      </div>
    </div>
  );
}
