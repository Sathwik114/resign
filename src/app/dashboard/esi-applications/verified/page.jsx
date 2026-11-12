import { redirect } from 'next/navigation';

export default async function VerifiedEsiApplicationsPage() {
  redirect('/dashboard/esi-applications');
}
