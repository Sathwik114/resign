import { getPayPool, sql } from '@/lib/payDb';

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
