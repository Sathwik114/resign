import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getPool, sql } from "@/lib/db";

// The exact target columns in dbo.SerbiaEmpMast, and the header names
// we expect in the uploaded Excel sheet (must match, case-sensitive by default).
const COLUMNS = [
  "NewEmpCode",
  "TR",
  "EMPNAME",
  "TYPE",
  "DOJ",
  "DEPT",
  "Section",
  "Designation",
  "AGRPERIFROM",
  "AGRPERITO",
];

// Columns that should be parsed/inserted as dates rather than plain text.
const DATE_COLUMNS = new Set(["DOJ", "AGRPERIFROM", "AGRPERITO"]);

/**
 * Parses any incoming date representation (Excel serial number, DD/MM/YYYY text,
 * YYYY-MM-DD text, Date object) into a strictly timezone-neutral 'YYYY-MM-DD' string.
 */
function parseDateToYMD(val) {
  if (val === null || val === undefined || val === "") return null;

  // 1. Text strings
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null") return null;

    // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    const isoMatch = trimmed.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY or D/M/YYYY (Indian/European format e.g. 11/02/2024 or 2/1/2025)
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})/);
    if (dmyMatch) {
      const [, d, m, y] = dmyMatch;
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  // 2. Excel serial numbers (e.g. 45333 -> 2024-02-11)
  if (typeof val === "number") {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
  }

  // 3. Date objects (from SheetJS cellDates or JS Date)
  if (val instanceof Date && !isNaN(val.getTime())) {
    // Add 12 hours so that any local-timezone offset (like IST -5:30) falls squarely on the intended calendar day
    const midDay = new Date(val.getTime() + 12 * 3600 * 1000);
    const y = midDay.getUTCFullYear();
    const m = String(midDay.getUTCMonth() + 1).padStart(2, "0");
    const d = String(midDay.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Step 2: Confirm upload/save to database
      const body = await request.json();
      const { action, inserts, updates } = body;

      if (action !== "confirm") {
        return NextResponse.json({ error: "Invalid action." }, { status: 400 });
      }

      const pool = await getPool();
      let insertedCount = 0;
      let updatedCount = 0;
      const rowErrors = [];

      // Perform insertions
      for (const row of (inserts || [])) {
        try {
          const req = pool.request();
          for (const col of COLUMNS) {
            const rawValue = row[col];
            if (DATE_COLUMNS.has(col)) {
              const ymd = parseDateToYMD(rawValue);
              req.input(col, sql.VarChar(10), ymd);
            } else {
              req.input(col, sql.NVarChar, rawValue === null ? null : String(rawValue));
            }
          }

          await req.query(`
            INSERT INTO [SerbiaDetl].[dbo].[SerbiaEmpMast]
              (NewEmpCode, TR, EMPNAME, TYPE, DOJ, DEPT, Section, Designation, AGRPERIFROM, AGRPERITO)
            VALUES
              (@NewEmpCode, @TR, @EMPNAME, @TYPE, CAST(@DOJ AS DATETIME), @DEPT, @Section, @Designation, CAST(@AGRPERIFROM AS DATETIME), CAST(@AGRPERITO AS DATETIME))
          `);
          insertedCount++;
        } catch (err) {
          rowErrors.push(`Insert failed for code ${row.NewEmpCode ?? "?"}: ${err.message}`);
        }
      }

      // Perform updates
      for (const row of (updates || [])) {
        try {
          const req = pool.request();
          for (const col of COLUMNS) {
            const rawValue = row[col];
            if (DATE_COLUMNS.has(col)) {
              const ymd = parseDateToYMD(rawValue);
              req.input(col, sql.VarChar(10), ymd);
            } else {
              req.input(col, sql.NVarChar, rawValue === null ? null : String(rawValue));
            }
          }

          await req.query(`
            UPDATE [SerbiaDetl].[dbo].[SerbiaEmpMast]
            SET 
              TR = @TR,
              EMPNAME = @EMPNAME,
              TYPE = @TYPE,
              DOJ = CAST(@DOJ AS DATETIME),
              DEPT = @DEPT,
              Section = @Section,
              Designation = @Designation,
              AGRPERIFROM = CAST(@AGRPERIFROM AS DATETIME),
              AGRPERITO = CAST(@AGRPERITO AS DATETIME)
            WHERE NewEmpCode = @NewEmpCode
          `);
          updatedCount++;
        } catch (err) {
          rowErrors.push(`Update failed for code ${row.NewEmpCode ?? "?"}: ${err.message}`);
        }
      }

      return NextResponse.json({
        message: `Successfully processed. Inserts: ${insertedCount}, Updates: ${updatedCount}.`,
        insertedCount,
        updatedCount,
        errors: rowErrors,
      });

    } else {
      // Step 1: Preview file upload
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Parse Workbook (first sheet)
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return NextResponse.json({ error: "Workbook has no sheets." }, { status: 400 });
      }
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true });

      if (rows.length === 0) {
        return NextResponse.json({ error: "The sheet has no data rows." }, { status: 400 });
      }

      // Verify Headers
      const firstRowKeys = Object.keys(rows[0]);
      const missingHeaders = COLUMNS.filter((c) => !firstRowKeys.includes(c));
      if (missingHeaders.length > 0) {
        return NextResponse.json(
          {
            error:
              `Excel headers don't match expected columns. Missing: ${missingHeaders.join(", ")}. ` +
              `Found headers: ${firstRowKeys.join(", ")}`,
          },
          { status: 400 }
        );
      }

      // Query database for existing NewEmpCode records to identify inserts vs updates
      const pool = await getPool();
      const existingResult = await pool.request().query("SELECT NewEmpCode FROM [SerbiaDetl].[dbo].[SerbiaEmpMast]");
      const existingCodes = new Set(
        existingResult.recordset.map((r) => r.NewEmpCode?.toString().trim().toUpperCase())
      );

      const updates = [];
      const inserts = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rawCode = row.NewEmpCode;
        if (rawCode === null || rawCode === undefined || rawCode === "") continue;

        const code = rawCode.toString().trim().toUpperCase();

        // format date fields to readable string for preview
        const formattedRow = { ...row };
        for (const col of DATE_COLUMNS) {
          formattedRow[col] = parseDateToYMD(row[col]);
        }

        if (existingCodes.has(code)) {
          updates.push(formattedRow);
        } else {
          inserts.push(formattedRow);
        }
      }

      return NextResponse.json({
        preview: true,
        inserts,
        updates,
        totalRows: rows.length,
      });
    }
  } catch (err) {
    console.error("Upload handler error:", err);
    return NextResponse.json({ error: err.message || "Upload handler error." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT 
        RTRIM(LTRIM(NewEmpCode)) AS NewEmpCode,
        RTRIM(LTRIM(TR)) AS TR,
        RTRIM(LTRIM(EMPNAME)) AS EMPNAME,
        RTRIM(LTRIM(TYPE)) AS TYPE,
        CONVERT(VARCHAR(10), DOJ, 120) AS DOJ,
        RTRIM(LTRIM(DEPT)) AS DEPT,
        RTRIM(LTRIM(Section)) AS Section,
        RTRIM(LTRIM(Designation)) AS Designation,
        CONVERT(VARCHAR(10), AGRPERIFROM, 120) AS AGRPERIFROM,
        CONVERT(VARCHAR(10), AGRPERITO, 120) AS AGRPERITO
      FROM [SerbiaDetl].[dbo].[SerbiaEmpMast]
      ORDER BY NewEmpCode ASC
    `);

    const data = result.recordset.map((row) => ({
      ...row,
      DOJ: row.DOJ || null,
      AGRPERIFROM: row.AGRPERIFROM || null,
      AGRPERITO: row.AGRPERITO || null,
    }));

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (err) {
    console.error("Error fetching SerbiaEmpMast records:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch Serbia employee records." },
      { status: 500 }
    );
  }
}