import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import prisma from '@/lib/prisma';
import { getEsiFormEnabled } from '@/lib/esiFormSettings';
import { getUserPermissions } from '@/app/dashboard/employee';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const enabled = await getEsiFormEnabled();
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Failed to load ESI form setting:', error);
    return NextResponse.json({ error: 'Unable to load ESI form setting.' }, { status: 500 });
  }
}

export async function PATCH(request) {
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

  const username = typeof payload.username === 'string' ? payload.username : payload.name;
  if (typeof username !== 'string' || !username.trim() || username === 'Member') {
    return NextResponse.json({ error: 'Unable to identify the administrator.' }, { status: 401 });
  }

  const permissions = await getUserPermissions(username);
  if (permissions.esiApplMnge !== 'Y') {
    return NextResponse.json({ error: 'You do not have permission to change ESI form settings.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }
  if (typeof body?.enabled !== 'boolean') {
    return NextResponse.json({ error: 'The enabled value must be a boolean.' }, { status: 400 });
  }

  try {
    const updatedRows = await prisma.$executeRaw`
      UPDATE [dbo].[EsiFormSettings]
      SET [IsEnabled] = ${body.enabled}
      WHERE [SettingId] = 1
    `;
    if (updatedRows !== 1) {
      throw new Error('ESI form setting row is missing from the database.');
    }
    return NextResponse.json({ success: true, enabled: body.enabled });
  } catch (error) {
    console.error('Failed to update ESI form setting:', error);
    return NextResponse.json({ error: 'Unable to update ESI form setting.' }, { status: 500 });
  }
}
