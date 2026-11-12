import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let username;
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      username = payload.username || payload.name;
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (!username) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    let row = null;
    try {
      const rows = await prisma.$queryRaw`
        SELECT [ResLog], [ESILog], [ESIApplMnge]
        FROM [dbo].[ResignLoginMast]
        WHERE [EmpCode] = ${username.trim()}
      `;
      if (rows && rows.length > 0) row = rows[0];
    } catch {
      try {
        const rows = await prisma.$queryRaw`
          SELECT *
          FROM [dbo].[ResignLoginMast]
          WHERE [EmpCode] = ${username.trim()}
        `;
        if (rows && rows.length > 0) row = rows[0];
      } catch {}
    }

    if (!row) {
      return NextResponse.json({ resignLog: 'N', esiLog: 'N', esiApplMnge: 'N' });
    }

    return NextResponse.json({
      resignLog:   (row.ResLog      || 'N').trim().toUpperCase(),
      esiLog:      (row.ESILog      || 'N').trim().toUpperCase(),
      esiApplMnge: (row.ESIApplMnge || 'N').trim().toUpperCase(),
    });
  } catch (error) {
    console.error('Portal access check failed:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
