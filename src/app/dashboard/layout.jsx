import { redirect } from 'next/navigation';
import { getAuthPayload } from '../auth-session';
import TabSessionGuard from './TabSessionGuard';

export default async function DashboardLayout({ children }) {
  if (!(await getAuthPayload())) redirect('/login');
  return <TabSessionGuard>{children}</TabSessionGuard>;
}
