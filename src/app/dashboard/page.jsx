import { cookies } from 'next/headers';
import * as jose from 'jose';
import { getEmployeeName } from './employee';
import prisma from '@/lib/prisma';
import PortalClient from './PortalClient';

export default async function PortalPage() {
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

  const empName = username !== 'Member' ? await getEmployeeName(username) : username;

  // Read access flags from ResignLoginMast matching logged-in EmpCode
  let resignLog = 'N';
  let esiLog = 'N';

  if (username && username !== 'Member') {
    try {
      const rows = await prisma.$queryRaw`
        SELECT [ResLog], [ESILog]
        FROM [dbo].[ResignLoginMast]
        WHERE [EmpCode] = ${username.trim()}
      `;
      if (rows && rows.length > 0) {
        resignLog = (rows[0].ResLog  || 'N').toString().trim().toUpperCase();
        esiLog    = (rows[0].ESILog  || 'N').toString().trim().toUpperCase();
      }
    } catch (err) {
      console.error('Portal access query failed:', err);
    }
  }

  return (
    <PortalClient
      empName={empName}
      resignLog={resignLog}
      esiLog={esiLog}
    />
  );
}
