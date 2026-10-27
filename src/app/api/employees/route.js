import { NextResponse } from 'next/server';
import { getPayPool, sql } from '@/lib/payDb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse year, month, active, and worker type parameters
    const currentDate = new Date();
    const defaultYear = currentDate.getFullYear();
    const defaultMonth = currentDate.getMonth() + 1; // 1-12
    
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');
    const activeParam = searchParams.get('active') || 'N'; // Default to N (resigned)
    const typeParam = searchParams.get('type') || 'TEMP'; // TEMP, REG, or STUDENT
    
    const year = yearParam ? parseInt(yearParam, 10) : defaultYear;
    const month = monthParam ? parseInt(monthParam, 10) : defaultMonth;

    if (isNaN(year) || isNaN(month)) {
      return NextResponse.json({ error: 'Invalid year or month parameter' }, { status: 400 });
    }

    const pool = await getPayPool();
    const dbRequest = pool.request();
    
    dbRequest.input('year', sql.Int, year);
    dbRequest.input('month', sql.Int, month);

    const isReg = typeParam === 'REG';
    const isStudent = typeParam === 'STUDENT';
    const isStaff = typeParam === 'STAFF';
    if (!['REG', 'TEMP', 'STUDENT', 'STAFF'].includes(typeParam)) {
      return NextResponse.json({ error: 'Invalid worker type' }, { status: 400 });
    }

    if (isStudent) {
      const studentRequest = pool.request();
      studentRequest.input('year', sql.Int, year);
      studentRequest.input('month', sql.Int, month);
      const activeFilter = activeParam === 'Y'
        ? "E.ACTIVE = 'Y'"
        : "(E.ACTIVE = 'N' OR E.ACTIVE IS NULL OR E.ACTIVE = ' ')";
      const dolFilter = activeParam === 'Y'
        ? ''
        : 'AND E.DOL IS NOT NULL AND YEAR(E.DOL) = @year AND MONTH(E.DOL) = @month';

      const result = await studentRequest.query(`
        SELECT
          E.EMPCODE,
          E.EMPNAME,
          G.DESIGNAME,
          D.DEPTNAME,
          N.NSECTION,
          E.JOINDATE,
          E.DOL,
          E.LASTWRKDAY,
          E.REASON,
          E.ACTIVE
        FROM [PAYROLLITI].[dbo].[EMPMAST] E
        LEFT JOIN [PAYROLLITI].[dbo].[DEPTMAST] D
          ON E.DEPTCODE = D.DEPTCODE
        LEFT JOIN [PAYROLLITI].[dbo].[DESIGMAST] G
          ON E.DESIG = G.DESIGCODE
        LEFT JOIN [PAYROLLITI].[dbo].[NSECMast] N
          ON E.NSECCODE = N.NSECCODE
        WHERE ${activeFilter}
          ${dolFilter}
        ORDER BY E.EMPNAME ASC
      `);

      const formattedRows = result.recordset.map(row => ({
        ...row,
        JOINDATE: row.JOINDATE ? new Date(row.JOINDATE).toISOString().split('T')[0] : null,
        DOL: row.DOL ? new Date(row.DOL).toISOString().split('T')[0] : null,
        LASTWRKDAY: row.LASTWRKDAY ? new Date(row.LASTWRKDAY).toISOString().split('T')[0] : null,
        REASON: row.REASON ? row.REASON.trim() : '',
      }));

      return NextResponse.json({
        data: formattedRows,
        count: formattedRows.length,
        filter: { year, month, active: activeParam, type: typeParam },
      });
    }

    const isPayrollDb = isReg || isStaff;
    const empTable = isPayrollDb ? 'payroll.dbo.EMPMAST' : 'EMPMAST';
    const deptTable = isPayrollDb ? 'payroll.dbo.DEPTMAST' : 'DEPTMAST';
    const desigTable = isPayrollDb ? 'payroll.dbo.DESIGMAST' : 'DESIGMAST';
    const nsecTable = isPayrollDb ? 'payroll.dbo.NSECMast' : 'NSECMast';
    let categoryFilter = '';
    if (isReg) {
      categoryFilter = "AND E.EMPCATEGORY = 'W'";
    } else if (isStaff) {
      categoryFilter = "AND E.EMPCATEGORY = 'S'";
    }

    let query = '';
    
    if (activeParam === 'Y') {
      // Get all active employees without date filter
      query = `
        SELECT 
          E.EMPCODE, 
          E.EMPNAME, 
          G.DESIGNAME, 
          D.DEPTNAME, 
          N.NSECTION, 
          E.JOINDATE, 
          E.DOL, 
          E.LASTWRKDAY, 
          E.REASON,
          S.NewEmpCode AS SERBIA_EMPCODE,
          S.AGRPERIFROM,
          S.AGRPERITO
        FROM ${empTable} E
        LEFT JOIN ${deptTable} D
            ON E.DEPTCODE = D.DEPTCODE
        LEFT JOIN ${desigTable} G
            ON E.DESIG = G.DESIGCODE
        LEFT JOIN ${nsecTable} N
            ON E.NSECCODE = N.NSECCODE
        LEFT JOIN (
            SELECT NewEmpCode, AGRPERIFROM, AGRPERITO,
                   ROW_NUMBER() OVER (PARTITION BY NewEmpCode ORDER BY AGRPERITO DESC) as rn
            FROM [SerbiaDetl].[dbo].[SerbiaEmpMast]
        ) S ON E.EMPCODE = S.NewEmpCode COLLATE DATABASE_DEFAULT AND S.rn = 1
        WHERE E.ACTIVE = 'Y' ${categoryFilter}
        ORDER BY E.EMPNAME ASC
      `;
    } else {
      // Get inactive/resigned employees based on DOL month/year
      query = `
        SELECT 
          E.EMPCODE, 
          E.EMPNAME, 
          G.DESIGNAME, 
          D.DEPTNAME, 
          N.NSECTION, 
          E.JOINDATE, 
          E.DOL, 
          E.LASTWRKDAY, 
          E.REASON,
          S.NewEmpCode AS SERBIA_EMPCODE,
          S.AGRPERIFROM,
          S.AGRPERITO
        FROM ${empTable} E
        LEFT JOIN ${deptTable} D
            ON E.DEPTCODE = D.DEPTCODE
        LEFT JOIN ${desigTable} G
            ON E.DESIG = G.DESIGCODE
        LEFT JOIN ${nsecTable} N
            ON E.NSECCODE = N.NSECCODE
        LEFT JOIN (
            SELECT NewEmpCode, AGRPERIFROM, AGRPERITO,
                   ROW_NUMBER() OVER (PARTITION BY NewEmpCode ORDER BY AGRPERITO DESC) as rn
            FROM [SerbiaDetl].[dbo].[SerbiaEmpMast]
        ) S ON E.EMPCODE = S.NewEmpCode COLLATE DATABASE_DEFAULT AND S.rn = 1
        WHERE (E.ACTIVE = 'N' OR E.ACTIVE IS NULL OR E.ACTIVE = ' ')
          AND E.DOL IS NOT NULL
          AND YEAR(E.DOL) = @year 
          AND MONTH(E.DOL) = @month
          ${categoryFilter}
        ORDER BY E.DOL DESC, E.EMPNAME ASC
      `;
    }

    const result = await dbRequest.query(query);
    
    // Format dates nicely for client display
    const formattedRows = result.recordset.map(row => ({
      ...row,
      JOINDATE: row.JOINDATE ? new Date(row.JOINDATE).toISOString().split('T')[0] : null,
      DOL: row.DOL ? new Date(row.DOL).toISOString().split('T')[0] : null,
      LASTWRKDAY: row.LASTWRKDAY ? new Date(row.LASTWRKDAY).toISOString().split('T')[0] : null,
      REASON: row.REASON ? row.REASON.trim() : '',
      SERBIA_EMPCODE: row.SERBIA_EMPCODE || null,
      AGRPERIFROM: row.AGRPERIFROM ? new Date(row.AGRPERIFROM).toISOString().split('T')[0] : null,
      AGRPERITO: row.AGRPERITO ? new Date(row.AGRPERITO).toISOString().split('T')[0] : null,
    }));

    return NextResponse.json({
      data: formattedRows,
      count: formattedRows.length,
      filter: { year, month, active: activeParam, type: typeParam }
    });

  } catch (error) {
    console.error('API Error in /api/employees:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve employee data: ' + error.message 
    }, { status: 500 });
  }
}
