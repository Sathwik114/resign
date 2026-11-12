import '../page.css';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import DashboardNavbar from '../DashboardNavbar';
import DashboardFooter from '../DashboardFooter';
import { getEmployeeName, getUserPermissions } from '../employee';
import EsiApplicationsTable from './table';

export default async function EsiApplicationsPage() {
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
  const permissions = token ? await getUserPermissions(username) : { esiApplMnge: 'N' };
  const canManage = permissions.esiApplMnge === 'Y';

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F0F7F8', color: '#183B4E', overflow: 'hidden' }}>
      <DashboardNavbar empName={empName} activePage="esi" canManage={canManage} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <EsiApplicationsTable canManage={canManage} />
      </div>
      <DashboardFooter />
    </div>
  );
}
