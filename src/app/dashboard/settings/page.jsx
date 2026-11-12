import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import '../page.css';
import DashboardNavbar from '../DashboardNavbar';
import DashboardFooter from '../DashboardFooter';
import { getEmployeeName, getUserPermissions } from '../employee';
import SettingsPanel from './settings-panel';

export default async function SettingsPage() {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) redirect('/login');

  let username;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    username = payload.username || payload.name;
  } catch {
    redirect('/login');
  }

  const permissions = await getUserPermissions(username);
  if (permissions.esiApplMnge !== 'Y') redirect('/dashboard');
  const empName = await getEmployeeName(username);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F0F7F8', color: '#183B4E' }}>
      <DashboardNavbar empName={empName} activePage="esi" canManage />
      <main className="settingsPage">
        <SettingsPanel />
      </main>
      <DashboardFooter />
    </div>
  );
}
