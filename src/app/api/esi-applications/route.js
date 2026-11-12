import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getEmployeeName, getUserPermissions } from '@/app/dashboard/employee';

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
const EDITABLE_IMAGES = {
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

const EDITABLE_TEXT_FIELDS = {
  EmpName: { maxLength: 200 },
  Gender: { maxLength: 20 },
  MobileNo: { maxLength: 10 },
  AadharNo: { maxLength: 12 },
  MaritalStatus: { maxLength: 20 },
  PrevESINo: { maxLength: 20, nullable: true },
  Address: { maxLength: 4000 },
  State: { maxLength: 100 },
  Pincode: { maxLength: 6 },
  FatherName: { maxLength: 200 },
  MotherName: { maxLength: 200 },
  SpouseName: { maxLength: 200, nullable: true },
  Child1Name: { maxLength: 200, nullable: true },
  Child2Name: { maxLength: 200, nullable: true },
  Child3Name: { maxLength: 200, nullable: true },
  Child4Name: { maxLength: 200, nullable: true },
  Child5Name: { maxLength: 200, nullable: true },
};
const EDITABLE_DATE_FIELDS = new Set([
  'DOJ', 'DOB', 'SpouseDOB', 'FatherDOB', 'MotherDOB',
  'Child1DOB', 'Child2DOB', 'Child3DOB', 'Child4DOB', 'Child5DOB',
]);
const NULLABLE_DATE_FIELDS = new Set([
  'SpouseDOB', 'FatherDOB', 'MotherDOB',
  'Child1DOB', 'Child2DOB', 'Child3DOB', 'Child4DOB', 'Child5DOB',
]);
const EDITABLE_BOOLEAN_FIELDS = new Set(['HasPrevESI', 'IncludeParents']);
const REQUIRED_TEXT_FIELDS = new Set([
  'EmpName', 'Gender', 'MobileNo', 'AadharNo', 'MaritalStatus',
  'Address', 'State', 'Pincode', 'FatherName', 'MotherName',
]);
const VALID_GENDERS = new Set(['Male', 'Female', 'Others']);
const EDITABLE_FIELDS = new Set([
  ...Object.keys(EDITABLE_TEXT_FIELDS),
  ...EDITABLE_DATE_FIELDS,
  ...EDITABLE_BOOLEAN_FIELDS,
  ...Object.keys(EDITABLE_IMAGES),
  'ChildCount',
]);

function buildSearchCondition(search) {
  if (!search) return Prisma.sql`1 = 1`;
  const conditions = SEARCHABLE_FIELDS.map((field) => (
    Prisma.sql`CHARINDEX(${search}, CONVERT(NVARCHAR(MAX), ${Prisma.raw(`[${field}]`)})) > 0`
  ));
  return Prisma.sql`(${Prisma.join(conditions, ' OR ')})`;
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

function buildCreatedDateCondition(searchParams) {
  const yearValue = searchParams.get('year');
  if (!yearValue) {
    return searchParams.has('dateMode')
      ? { error: 'Choose a year for the application date filter.' }
      : { condition: Prisma.sql`1 = 1` };
  }

  if (!/^\d{4}$/.test(yearValue) || Number(yearValue) < 1900 || Number(yearValue) > 9999) {
    return { error: 'Choose a valid year.' };
  }

  const year = Number(yearValue);
  const mode = searchParams.get('dateMode') || 'year';
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const nextYearStart = new Date(Date.UTC(year + 1, 0, 1));
  let start = yearStart;
  let end = nextYearStart;

  if (mode === 'date') {
    start = parseDate(searchParams.get('date'));
    if (!start || start.getUTCFullYear() !== year) return { error: 'Choose a valid date in the selected year.' };
    end = new Date(start.getTime() + 86400000);
  } else if (mode === 'month') {
    const monthValue = searchParams.get('month');
    if (!/^(0[1-9]|1[0-2])$/.test(monthValue || '')) return { error: 'Choose a valid month.' };
    start = new Date(Date.UTC(year, Number(monthValue) - 1, 1));
    end = new Date(Date.UTC(year, Number(monthValue), 1));
  } else if (mode === 'week') {
    const weekValue = searchParams.get('week');
    if (!/^\d{1,2}$/.test(weekValue || '')) return { error: 'Choose a valid week.' };
    const week = Number(weekValue);
    if (week < 1 || week > 53) return { error: 'Choose a valid week.' };

    const januaryFourth = new Date(Date.UTC(year, 0, 4));
    const mondayOffset = (januaryFourth.getUTCDay() + 6) % 7;
    const weekStart = new Date(Date.UTC(year, 0, 4 - mondayOffset + (week - 1) * 7));
    const thursday = new Date(weekStart.getTime() + 3 * 86400000);
    if (thursday.getUTCFullYear() !== year) return { error: 'Choose a valid week in the selected year.' };

    start = weekStart < yearStart ? yearStart : weekStart;
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    end = weekEnd > nextYearStart ? nextYearStart : weekEnd;
  } else if (mode === 'range') {
    const from = parseDate(searchParams.get('from'));
    const to = parseDate(searchParams.get('to'));
    if (!from || !to || from > to ||
      from.getUTCFullYear() !== year || to.getUTCFullYear() !== year) {
      return { error: 'Choose a valid date range within the selected year.' };
    }
    start = from;
    end = new Date(to.getTime() + 86400000);
  } else if (mode !== 'year') {
    return { error: 'Choose a valid application date filter.' };
  }

  return { condition: Prisma.sql`[CreatedAt] >= ${start} AND [CreatedAt] < ${end}` };
}

function describeCreatedDateFilter(searchParams) {
  const year = searchParams.get('year');
  if (!year) return 'All applications';

  const mode = searchParams.get('dateMode') || 'year';
  if (mode === 'date') return `Date: ${searchParams.get('date')}`;
  if (mode === 'month') return `Month: ${searchParams.get('month')}/${year}`;
  if (mode === 'week') return `Week ${searchParams.get('week')}, ${year}`;
  if (mode === 'range') return `${searchParams.get('from')} - ${searchParams.get('to')}`;
  return `Year: ${year}`;
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
  const loadAll = searchParams.get('all') === 'true';
  const includeColumns = searchParams.get('includeColumns') === 'true';
  const search = searchParams.get('search')?.trim() || '';
  if (search.length > 200) {
    return NextResponse.json({ error: 'Search must be 200 characters or fewer.' }, { status: 400 });
  }
  const searchCondition = buildSearchCondition(search);
  const { condition: createdDateCondition, error: dateFilterError } = buildCreatedDateCondition(searchParams);
  if (dateFilterError) {
    return NextResponse.json({ error: dateFilterError }, { status: 400 });
  }
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

      const record = { ...row };
      for (const [field, mimeTypeField] of Object.entries(IMAGE_FIELDS)) {
        const bytes = record[field];
        const mimeType = record[mimeTypeField];
        record[field] = bytes && mimeType
          ? `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`
          : null;
      }
      return NextResponse.json({ data: record });
    }

    const [countResult] = await prisma.$queryRaw`
      SELECT COUNT(*) AS [total]
      FROM [dbo].[EsiEmployee]
      WHERE ${searchCondition} AND ${createdDateCondition}
    `;
    const total = Number(countResult.total);
    const pageSize = loadAll && total > 0 ? total : PAGE_SIZE;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    if (requestedPage > pageCount) {
      return NextResponse.json({ error: 'Requested page is outside the available results.' }, { status: 400 });
    }

    const rows = await prisma.$queryRaw`
      SELECT *
      FROM [dbo].[EsiEmployee]
      WHERE ${searchCondition} AND ${createdDateCondition}
      ORDER BY [EmpID] ASC
      OFFSET ${(requestedPage - 1) * pageSize} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY
    `;

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
      pageSize,
      ...(columns ? { columns: columns.map(({ name }) => name) } : {}),
    });
  } catch (error) {
    console.error('Failed to load ESI applications:', error);
    return NextResponse.json({ error: 'Unable to load ESI applications.' }, { status: 500 });
  }
}

export async function DELETE(request) {
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
  if (!username || username === 'Member' || username.length > 50) {
    return NextResponse.json({ error: 'Unable to identify the user deleting these applications.' }, { status: 401 });
  }
  const permissions = await getUserPermissions(username);
  if (permissions.esiApplMnge !== 'Y') {
    return NextResponse.json({ error: "You don't have access to delete" }, { status: 403 });
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

  const filterParams = new URLSearchParams();
  for (const field of ['year', 'dateMode', 'date', 'month', 'week', 'from', 'to']) {
    const value = body?.filter?.[field];
    if (typeof value === 'string' || typeof value === 'number') {
      filterParams.set(field, String(value));
    }
  }
  const { error: filterError } = buildCreatedDateCondition(filterParams);
  if (filterError) {
    return NextResponse.json({ error: filterError }, { status: 400 });
  }
  const selectedRange = describeCreatedDateFilter(filterParams);
  if (selectedRange.length > 200) {
    return NextResponse.json({ error: 'The selected application date filter is too long.' }, { status: 400 });
  }

  try {
    const employeeName = (await getEmployeeName(username)).trim().slice(0, 200);
    const deletedCount = await prisma.$transaction(async (transaction) => {
      const count = await transaction.$executeRaw`
        DELETE FROM [dbo].[EsiEmployee]
        WHERE [EmpID] IN (${Prisma.join(employeeIds)})
      `;
      if (count > 0) {
        await transaction.$executeRaw`
          INSERT INTO [dbo].[DeletedDetl] ([EmpID], [EmpName], [Range], [DeletedAt], [ApplCount])
          VALUES (${username}, ${employeeName}, ${selectedRange}, SYSUTCDATETIME(), ${count})
        `;
      }
      return count;
    });
    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('Failed to delete ESI applications:', error);
    return NextResponse.json({ error: 'Unable to delete selected ESI applications.' }, { status: 500 });
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

  const username = typeof payload.username === 'string'
    ? payload.username.trim()
    : typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!username || username === 'Member') {
    return NextResponse.json({ error: 'Unable to identify the user saving this application.' }, { status: 401 });
  }

  const employeeId = new URL(request.url).searchParams.get('employeeId')?.trim();
  if (!employeeId) {
    return NextResponse.json({ error: 'Employee ID is required.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!body?.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
    return NextResponse.json({ error: 'Application details are required.' }, { status: 400 });
  }
  const entries = Object.entries(body.data);
  if (!entries.length || entries.some(([field]) => !EDITABLE_FIELDS.has(field))) {
    return NextResponse.json({ error: 'Application details contain unsupported fields.' }, { status: 400 });
  }

  const values = {};
  for (const [field, value] of entries) {
    if (Object.hasOwn(EDITABLE_IMAGES, field)) {
      const mimeTypeField = EDITABLE_IMAGES[field];
      if (value === null || value === '') {
        values[field] = null;
        values[mimeTypeField] = null;
        continue;
      }

      if (typeof value !== 'string') {
        return NextResponse.json({ error: `${field} must be a JPEG image.` }, { status: 400 });
      }
      const imageMatch = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/i.exec(value);
      if (!imageMatch) {
        return NextResponse.json({ error: `${field} must be a JPEG image.` }, { status: 400 });
      }
      const imageBuffer = Buffer.from(imageMatch[1], 'base64');
      if (imageBuffer.length >= 100 * 1024 || imageBuffer.toString('base64') !== imageMatch[1]) {
        return NextResponse.json({ error: `${field} must be smaller than 100 KB and use valid base64.` }, { status: 400 });
      }
      values[field] = imageBuffer;
      values[mimeTypeField] = 'image/jpeg';
      continue;
    }

    if (Object.hasOwn(EDITABLE_TEXT_FIELDS, field)) {
      const { maxLength, nullable = false } = EDITABLE_TEXT_FIELDS[field];
      if (value === null && nullable) {
        values[field] = null;
        continue;
      }
      if (typeof value !== 'string') {
        return NextResponse.json({ error: `${field} must be text.` }, { status: 400 });
      }
      const normalized = value.trim();
      if (normalized.length > maxLength || (REQUIRED_TEXT_FIELDS.has(field) && !normalized)) {
        return NextResponse.json({ error: `Enter a valid value for ${field}.` }, { status: 400 });
      }
      if (field === 'Gender' && !VALID_GENDERS.has(normalized)) {
        return NextResponse.json({ error: 'Gender must be Male, Female, or Others.' }, { status: 400 });
      }
      values[field] = normalized || (nullable ? null : normalized);
      continue;
    }

    if (EDITABLE_DATE_FIELDS.has(field)) {
      if ((value === null || value === '') && NULLABLE_DATE_FIELDS.has(field)) {
        values[field] = null;
        continue;
      }
      const date = parseDate(value);
      if (!date) {
        return NextResponse.json({ error: `Enter a valid date for ${field}.` }, { status: 400 });
      }
      values[field] = date;
      continue;
    }

    if (EDITABLE_BOOLEAN_FIELDS.has(field)) {
      if (typeof value !== 'boolean') {
        return NextResponse.json({ error: `${field} must be true or false.` }, { status: 400 });
      }
      values[field] = value;
      continue;
    }

    if (field === 'ChildCount') {
      if (!Number.isInteger(value) || value < 0 || value > 5) {
        return NextResponse.json({ error: 'Child count must be between 0 and 5.' }, { status: 400 });
      }
      values[field] = value;
    }
  }

  const childCount = values.ChildCount;
  if (!Number.isInteger(childCount) || childCount < 0 || childCount > 5) {
    return NextResponse.json({ error: 'Child count must be between 0 and 5.' }, { status: 400 });
  }
  for (let child = 1; child <= childCount; child++) {
    if (
      typeof values[`Child${child}Name`] !== 'string' ||
      !values[`Child${child}Name`].trim() ||
      !(values[`Child${child}DOB`] instanceof Date) ||
      !Buffer.isBuffer(values[`Child${child}Img`]) ||
      !values[`Child${child}Img`].length
    ) {
      return NextResponse.json({
        error: `Child ${child} must have a name, date of birth, and photograph before saving.`,
      }, { status: 400 });
    }
  }
  for (let child = childCount + 1; child <= 5; child++) {
    values[`Child${child}Name`] = null;
    values[`Child${child}DOB`] = null;
    values[`Child${child}Img`] = null;
    values[EDITABLE_IMAGES[`Child${child}Img`]] = null;
  }

  try {
    const updatedBy = (await getEmployeeName(username)).trim().slice(0, 200);
    const assignments = Object.entries(values).map(([field, value]) => {
      const column = Prisma.raw(`[${field}]`);
      if (value === null) return Prisma.sql`${column} = NULL`;
      if (EDITABLE_DATE_FIELDS.has(field)) {
        return Prisma.sql`${column} = CAST(${value} AS DATE)`;
      }
      if (Object.hasOwn(EDITABLE_IMAGES, field)) {
        return Prisma.sql`${column} = CAST(${value} AS VARBINARY(MAX))`;
      }
      return Prisma.sql`${column} = ${value}`;
    });
    assignments.push(
      Prisma.sql`[UptdBy] = ${updatedBy}`,
      Prisma.sql`[UptdAt] = SYSUTCDATETIME()`,
    );

    const updatedCount = await prisma.$executeRaw`
      UPDATE [dbo].[EsiEmployee]
      SET ${Prisma.join(assignments)}
      WHERE [EmpID] = ${employeeId}
    `;
    if (!updatedCount) {
      return NextResponse.json({ error: 'ESI application not found.' }, { status: 404 });
    }

    const [row] = await prisma.$queryRaw`
      SELECT *
      FROM [dbo].[EsiEmployee]
      WHERE [EmpID] = ${employeeId}
    `;
    const record = { ...row };
    for (const [field, mimeTypeField] of Object.entries(IMAGE_FIELDS)) {
      const bytes = record[field];
      const mimeType = record[mimeTypeField];
      record[field] = bytes && mimeType
        ? `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`
        : null;
    }
    return NextResponse.json({ data: record });
  } catch (error) {
    console.error('Failed to update ESI application:', error);
    return NextResponse.json({ error: 'Unable to update ESI application.' }, { status: 500 });
  }
}
