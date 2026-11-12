import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    let username = null;
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        username = payload.username || payload.name;
      } catch (e) {
        return NextResponse.json({ error: 'JWT decode failed', detail: e.message });
      }
    } else {
      return NextResponse.json({ error: 'No auth_token cookie found' });
    }

    // Try fetching all columns for this user
    let rawRow = null;
    let queryError = null;
    try {
      const rows = await prisma.$queryRaw`
        SELECT * FROM [dbo].[ResignLoginMast]
        WHERE [EmpCode] = ${username.trim()}
      `;
      rawRow = rows?.[0] ?? null;
    } catch (e) {
      queryError = e.message;
    }

    // Check which columns exist in the table
    let columns = null;
    let colError = null;
    try {
      const cols = await prisma.$queryRaw`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'ResignLoginMast'
        ORDER BY ORDINAL_POSITION
      `;
      columns = cols;
    } catch (e) {
      colError = e.message;
    }

    return NextResponse.json({
      username,
      rawRow,
      queryError,
      tableColumns: columns,
      colError,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error', detail: err.message }, { status: 500 });
  }
}
