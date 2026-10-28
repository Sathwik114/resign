import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

const PAGE_SIZE = 10;
const IMAGE_FIELDS = {
  Photograph: 'PhotographMimeType',
  SpousePhotograph: 'SpousePhotoMimeType',
  Child1Photograph: 'Child1PhotoMimeType',
  Child2Photograph: 'Child2PhotoMimeType',
  Child3Photograph: 'Child3PhotoMimeType',
  Child4Photograph: 'Child4PhotoMimeType',
  Child5Photograph: 'Child5PhotoMimeType',
  FatherPhotograph: 'FatherPhotoMimeType',
  MotherPhotograph: 'MotherPhotoMimeType',
};

export async function GET(request) {
  const token = (await cookies()).get('auth_token')?.value;
  const jwtSecret = process.env.JWT_SECRET;
  if (!token || !jwtSecret) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    await jose.jwtVerify(token, new TextEncoder().encode(jwtSecret));
  } catch {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const requestedPage = Number(new URL(request.url).searchParams.get('page') || 1);
  if (!Number.isInteger(requestedPage) || requestedPage < 1) {
    return NextResponse.json({ error: 'Page must be a positive integer.' }, { status: 400 });
  }

  try {
    const total = await prisma.esiEmployee.count();
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (requestedPage > pageCount) {
      return NextResponse.json({ error: 'Requested page is outside the available results.' }, { status: 400 });
    }

    const rows = await prisma.esiEmployee.findMany({
      skip: (requestedPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { EmployeeId: 'asc' },
    });

    const data = rows.map((row) => {
      const record = { ...row };
      for (const [field, mimeTypeField] of Object.entries(IMAGE_FIELDS)) {
        const bytes = record[field];
        const mimeType = record[mimeTypeField];
        record[field] = bytes && mimeType
          ? `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`
          : null;
      }
      return record;
    });

    return NextResponse.json({ data, total, page: requestedPage, pageSize: PAGE_SIZE });
  } catch (error) {
    console.error('Failed to load ESI applications:', error);
    return NextResponse.json({ error: 'Unable to load ESI applications.' }, { status: 500 });
  }
}
