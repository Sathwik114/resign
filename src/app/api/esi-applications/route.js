import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getEmployeeName } from '@/app/dashboard/employee';

export const runtime = 'nodejs';

const PAGE_SIZE = 10;
const IMAGE_FIELDS = {
  EmpImg: 'PhotographMimeType',
  SpouseImg: 'SpousePhotoMimeType',
  Child1Img: 'Child1PhotoMimeType',
  Child2Img: 'Child2PhotoMimeType',
  Child3Img: 'Child3PhotoMimeType',
  Child4Img: 'Child4PhotoMimeType',
  Child5Img: 'Child5PhotoMimeType',
  FatherImg: 'FatherPhotoMimeType',
  MotherImg: 'MotherPhotoMimeType',
};

const SEARCHABLE_FIELDS = [
  'ESIID', 'EmpID', 'EmpName', 'MobileNo', 'AadharNo', 'FatherName',
];

function buildSearchCondition(search) {
  if (!search) return Prisma.sql`1 = 1`;
  const conditions = SEARCHABLE_FIELDS.map((field) => (
    Prisma.sql`CHARINDEX(${search}, CONVERT(NVARCHAR(MAX), ${Prisma.raw(`[${field}]`)})) > 0`
  ));
  return Prisma.sql`(${Prisma.join(conditions, ' OR ')})`;
}

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

  const searchParams = new URL(request.url).searchParams;
  const requestedPage = Number(searchParams.get('page') || 1);
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
  const summaryOnly = searchParams.get('summary') === 'true';
  const includeColumns = searchParams.get('includeColumns') === 'true';
  const search = searchParams.get('search')?.trim() || '';
  const createdFrom = searchParams.get('createdFrom');
  const createdTo = searchParams.get('createdTo');
  const verifiedFrom = searchParams.get('verifiedFrom');
  const verifiedTo = searchParams.get('verifiedTo');
  if (search.length > 200) {
    return NextResponse.json({ error: 'Search must be 200 characters or fewer.' }, { status: 400 });
  }
  const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if ((createdFrom || createdTo) && (!verifiedOnly || !createdFrom || !createdTo ||
    !isValidDate(createdFrom) || !isValidDate(createdTo) || createdFrom > createdTo)) {
    return NextResponse.json({ error: 'Provide a valid created-date range for verified applications.' }, { status: 400 });
  }
  if ((verifiedFrom || verifiedTo) && (!verifiedOnly || !verifiedFrom || !verifiedTo ||
    !isValidDate(verifiedFrom) || !isValidDate(verifiedTo) || verifiedFrom > verifiedTo)) {
    return NextResponse.json({ error: 'Provide a valid verified-date range for verified applications.' }, { status: 400 });
  }
  if (summaryOnly && !verifiedOnly) {
    return NextResponse.json({ error: 'Summary results are only available for verified applications.' }, { status: 400 });
  }
  if (includeColumns && !verifiedOnly) {
    return NextResponse.json({ error: 'Database columns are only available for verified applications.' }, { status: 400 });
  }
  const searchCondition = buildSearchCondition(search);
  const createdDateCondition = createdFrom
    ? Prisma.sql`[CreatedAt] >= ${new Date(`${createdFrom}T00:00:00.000Z`)}
        AND [CreatedAt] < ${new Date(new Date(`${createdTo}T00:00:00.000Z`).getTime() + 86400000)}`
    : Prisma.sql`1 = 1`;
  const verifiedDateCondition = verifiedFrom
    ? Prisma.sql`[VerifiedAt] >= ${new Date(`${verifiedFrom}T00:00:00.000Z`)}
        AND [VerifiedAt] < ${new Date(new Date(`${verifiedTo}T00:00:00.000Z`).getTime() + 86400000)}`
    : Prisma.sql`1 = 1`;
  if (!Number.isInteger(requestedPage) || requestedPage < 1) {
    return NextResponse.json({ error: 'Page must be a positive integer.' }, { status: 400 });
  }

  try {
    const employeeId = new URL(request.url).searchParams.get('employeeId');
    if (employeeId) {
      const [row] = await prisma.$queryRaw`
        SELECT *
        FROM [dbo].[EsiEmployee]
        WHERE [EmpID] = ${employeeId}
      `;
      if (!row) {
        return NextResponse.json({ error: 'ESI application not found.' }, { status: 404 });
      }

      const record = { ...row, Verification: row.Verification || 'Not Verified' };
      for (const [field, mimeTypeField] of Object.entries(IMAGE_FIELDS)) {
        const bytes = record[field];
        const mimeType = record[mimeTypeField];
        record[field] = bytes && mimeType
          ? `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`
          : null;
      }
      return NextResponse.json({ data: record });
    }

    let total;
    let rows;
    if (verifiedOnly) {
      const [countResult] = await prisma.$queryRaw`
        SELECT COUNT(*) AS [total]
        FROM [dbo].[EsiEmployee]
        WHERE [Verification] = 'V' AND ${searchCondition}
          AND ${createdDateCondition} AND ${verifiedDateCondition}
      `;
      total = Number(countResult.total);
      const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (requestedPage > pageCount) {
        return NextResponse.json({ error: 'Requested page is outside the available results.' }, { status: 400 });
      }

      const pageRows = await prisma.$queryRaw`
        SELECT ${summaryOnly
          ? Prisma.raw('[EmpID], [ESIID], [EmpName], [CreatedAt], [VerifiedAt], [VerifiedBy]')
          : Prisma.raw('*')}
        FROM [dbo].[EsiEmployee]
        WHERE [Verification] = 'V' AND ${searchCondition}
          AND ${createdDateCondition} AND ${verifiedDateCondition}
        ORDER BY [EmpID] ASC
        OFFSET ${(requestedPage - 1) * PAGE_SIZE} ROWS
        FETCH NEXT ${PAGE_SIZE} ROWS ONLY
      `;
      rows = pageRows;
      if (summaryOnly) {
        return NextResponse.json({ data: rows, total, page: requestedPage, pageSize: PAGE_SIZE });
      }
    } else {
      const [countResult] = await prisma.$queryRaw`
        SELECT COUNT(*) AS [total]
        FROM [dbo].[EsiEmployee]
        WHERE ([Verification] IS NULL OR [Verification] <> 'V')
          AND ${searchCondition}
      `;
      total = Number(countResult.total);
      const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (requestedPage > pageCount) {
        return NextResponse.json({ error: 'Requested page is outside the available results.' }, { status: 400 });
      }

      rows = await prisma.$queryRaw`
        SELECT *
        FROM [dbo].[EsiEmployee]
        WHERE ([Verification] IS NULL OR [Verification] <> 'V')
          AND ${searchCondition}
        ORDER BY [EmpID] ASC
        OFFSET ${(requestedPage - 1) * PAGE_SIZE} ROWS
        FETCH NEXT ${PAGE_SIZE} ROWS ONLY
      `;
    }

    const data = rows.map((row) => {
      const record = {
        ...row,
        Verification: row.Verification || 'Not Verified',
      };
      for (const [field, mimeTypeField] of Object.entries(IMAGE_FIELDS)) {
        const bytes = record[field];
        const mimeType = record[mimeTypeField];
        record[field] = bytes && mimeType
          ? `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`
          : null;
      }
      return record;
    });

    const columns = includeColumns
      ? await prisma.$queryRaw`
        SELECT [name]
        FROM sys.columns
        WHERE [object_id] = OBJECT_ID(N'dbo.EsiEmployee')
        ORDER BY [column_id] ASC
      `
      : null;
    if (includeColumns && !columns.length) {
      throw new Error('Unable to read ESI application database columns.');
    }

    return NextResponse.json({
      data,
      total,
      page: requestedPage,
      pageSize: PAGE_SIZE,
      ...(columns ? { columns: columns.map(({ name }) => name) } : {}),
    });
  } catch (error) {
    console.error('Failed to load ESI applications:', error);
    return NextResponse.json({ error: 'Unable to load ESI applications.' }, { status: 500 });
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
    return NextResponse.json({ error: 'Unable to identify the verifying user.' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const isBulkRequest = Array.isArray(body?.employeeIds);
  const employeeIds = isBulkRequest
    ? [...new Set(body.employeeIds.filter((id) => typeof id === 'string').map((id) => id.trim()).filter(Boolean))]
    : typeof body?.employeeId === 'string' && body.employeeId.trim()
      ? [body.employeeId.trim()]
      : [];
  if (!employeeIds.length || (isBulkRequest && employeeIds.length !== body.employeeIds.length) ||
    (isBulkRequest && employeeIds.length > 100)) {
    return NextResponse.json({ error: 'Provide between 1 and 100 valid employee IDs.' }, { status: 400 });
  }

  try {
    const verifiedBy = await getEmployeeName(username.trim());
    const updatedRows = await prisma.$executeRaw`
      UPDATE [dbo].[EsiEmployee]
      SET [Verification] = 'V', [VerifiedBy] = ${verifiedBy}, [VerifiedAt] = SYSUTCDATETIME()
      WHERE [EmpID] IN (${Prisma.join(employeeIds)})
        AND ([Verification] IS NULL OR [Verification] <> 'V')
    `;

    if (updatedRows === 0 && !isBulkRequest) {
      return NextResponse.json({ error: 'ESI application not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      verification: 'V',
      verifiedBy,
      updatedCount: updatedRows,
    });
  } catch (error) {
    console.error('Failed to verify ESI application:', error);
    return NextResponse.json({ error: 'Unable to verify the ESI application.' }, { status: 500 });
  }
}

export async function DELETE(request) {
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const employeeIds = Array.isArray(body?.employeeIds)
    ? [...new Set(body.employeeIds.filter((id) => typeof id === 'string').map((id) => id.trim()).filter(Boolean))]
    : [];
  if (!employeeIds.length || employeeIds.length !== body.employeeIds.length || employeeIds.length > 100) {
    return NextResponse.json({ error: 'Provide between 1 and 100 valid employee IDs.' }, { status: 400 });
  }

  if (body?.verifiedOnly !== undefined && typeof body.verifiedOnly !== 'boolean') {
    return NextResponse.json({ error: 'Verification filter must be a boolean.' }, { status: 400 });
  }
  const deleteVerifiedOnly = body?.verifiedOnly === true;

  try {
    const verificationCondition = deleteVerifiedOnly
      ? Prisma.sql`[Verification] = 'V'`
      : Prisma.sql`([Verification] IS NULL OR [Verification] <> 'V')`;
    const deletedCount = await prisma.$executeRaw`
      DELETE FROM [dbo].[EsiEmployee]
      WHERE [EmpID] IN (${Prisma.join(employeeIds)})
        AND ${verificationCondition}
    `;
    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Failed to delete ESI applications:', error);
    return NextResponse.json({ error: 'Unable to delete selected ESI applications.' }, { status: 500 });
  }
}
