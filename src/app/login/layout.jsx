import { redirect } from 'next/navigation';
import { getAuthPayload } from '../auth-session';

export default async function LoginLayout({ children }) {
  if (await getAuthPayload()) redirect('/dashboard');
  return children;
}
