import { getPayPool, sql } from '@/lib/payDb';
import prisma from '@/lib/prisma';

export async function getEmployeeName(empcode) {
  if (!empcode || empcode === 'Member') return empcode;
  try {
    const pool = await getPayPool();
    const result = await pool.request()
      .input('empcode', sql.VarChar, empcode)
      .query('SELECT EMPNAME FROM payroll.dbo.EMPMAST WHERE EMPCODE = @empcode');

    if (result.recordset && result.recordset.length > 0) {
      return result.recordset[0].EMPNAME?.trim() || empcode;
    }
  } catch (error) {
    console.error('Error fetching employee name:', error);
  }
  return empcode;
}

export async function getUserPermissions(empcode) {
  if (!empcode || empcode === 'Member') {
    return { resLog: 'N', esiLog: 'N', esiApplMnge: 'N' };
  }
  try {
    const rows = await prisma.$queryRaw`
      SELECT [ResLog], [ESILog], [ESIApplMnge]
      FROM [dbo].[ResignLoginMast]
      WHERE [EmpCode] = ${empcode.trim()}
    `;
    if (rows && rows.length > 0) {
      const row = rows[0];
      return {
        resLog: (row.ResLog || 'N').toString().trim().toUpperCase(),
        esiLog: (row.ESILog || 'N').toString().trim().toUpperCase(),
        esiApplMnge: (row.ESIApplMnge || 'N').toString().trim().toUpperCase(),
      };
    }
  } catch {
    try {
      const fallbackRows = await prisma.$queryRaw`
        SELECT *
        FROM [dbo].[ResignLoginMast]
        WHERE [EmpCode] = ${empcode.trim()}
      `;
      if (fallbackRows && fallbackRows.length > 0) {
        const row = fallbackRows[0];
        return {
          resLog: (row.ResLog || 'N').toString().trim().toUpperCase(),
          esiLog: (row.ESILog || 'N').toString().trim().toUpperCase(),
          esiApplMnge: (row.ESIApplMnge || 'N').toString().trim().toUpperCase(),
        };
      }
    } catch (err) {
      console.error('Error fetching user permissions:', err);
    }
  }
  return { resLog: 'N', esiLog: 'N', esiApplMnge: 'N' };
}
