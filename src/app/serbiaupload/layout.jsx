import { redirect } from 'next/navigation';
import { getAuthPayload } from '../auth-session';
import TabSessionGuard from '../dashboard/TabSessionGuard';

export default async function SerbiaUploadLayout({ children }) {
  if (!(await getAuthPayload())) redirect('/login');
  return <TabSessionGuard>{children}</TabSessionGuard>;
}
