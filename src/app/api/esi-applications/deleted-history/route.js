import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import prisma from '@/lib/prisma';
import { getUserPermissions } from '@/app/dashboard/employee';

export const runtime = 'nodejs';

export async function GET() {
  const token = (await cookies()).get('auth_token')?.value;
  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let payload;
  try {
    ({ payload } = await jose.jwtVerify(token, new TextEncoder().encode(jwtSecret)));
  } catch {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const username = typeof payload.username === 'string'
    ? payload.username.trim()
    : typeof payload.name === 'string' ? payload.name.trim() : '';
  const permissions = await getUserPermissions(username);
  if (permissions.esiApplMnge !== 'Y') {
    return NextResponse.json({ error: 'You do not have permission to view deletion history.' }, { status: 403 });
  }

  try {
    const entries = await prisma.$queryRaw`
      SELECT TOP (100) [EmpID], [EmpName], [Range], [DeletedAt], [ApplCount]
      FROM [dbo].[DeletedDetl]
      ORDER BY [DeletedAt] DESC, [EmpID] ASC
    `;
    return NextResponse.json({ data: entries });
  } catch (error) {
    console.error('Failed to load ESI deletion history:', error);
    return NextResponse.json({ error: 'Unable to load ESI deletion history.' }, { status: 500 });
  }
}
