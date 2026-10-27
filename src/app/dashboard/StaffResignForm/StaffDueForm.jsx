import React, { useState } from "react";

/*
  Employee No Dues Form — exact-format replica of the original
  scanned/printed document (Greentech Industries (India) Pvt. Ltd.)

  CHANGE: "Signature of HOS/HOD" column is now ONE merged cell per
  department section (not one box per line item). The HOD signs once
  per section instead of once per row.
*/

const SECTIONS = [
  {
    key: "general",
    title: "GENERAL AFFAIRS:",
    items: [
      "Uniform",
      "PPE's",
      "Cloack Room Keys",
      "Dormitory Clearance",
      "Mobile Deductions / SIM card",
      "Others",
    ],
  },
  {
    key: "it",
    title: "IT DEPARTMENT:",
    items: [
      "Laptop /Desktop",
      "PEN/USB Drive/Wifi / Server permission",
      "ERP account / OA /Internet access",
      "E-mail ID (Internal / External)",
      "Any other (Please Specify)",
    ],
  },
  {
    key: "security",
    title: "SECURITY OFFICE",
    items: ["Security Clearance"],
  },
  {
    key: "hse",
    title: "HSE DEPARTMENT:",
    items: ["HSE Deductions", "Any other (Please Specify)"],
  },
  {
    key: "hr",
    title: "HR DEPARTMENT:",
    items: [
      "Agreement/Bond (Serbia/Abroad/Other)",
      "I.D Cards, Business Cards & SEZ I.D Card",
      "Any Other Recovery or Pay",
    ],
  },
  {
    key: "finance",
    title: "FINANCE DEPARTMENT:",
    items: [
      "Imprest Amount",
      "Travel / Other Advances /Perosal Loans",
      "Notice Pay Recovery",
      "Any other (Please Specify)",
    ],
  },
];

function makeInitialRows() {
  const rows = {};
  SECTIONS.forEach((sec) => {
    rows[sec.key] = sec.items.map(() => ({ status: "" }));
  });
  return rows;
}

function makeInitialSigs() {
  const sigs = {};
  SECTIONS.forEach((sec) => {
    sigs[sec.key] = "";
  });
  return sigs;
}

function formatDate(dateVal) {
  if (!dateVal) return "";
  const clean = String(dateVal).split("T")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    if (y && m && d) return `${d}/${m}/${y}`;
  }
  return clean;
}

function getTodayFormatted() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = String(today.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function HeaderField({ label, value, onChange }) {
  return (
    <div className="ndf-hf">
      <span className="ndf-hf-label">{label}</span>
      <input
        className="ndf-hf-input"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function StaffDueForm({
  employee,
  savedData,
  onFormChange,
  onClose,
  isPrintable = false,
}) {
  const [header, setHeader] = useState(() => ({
    employeeName: savedData?.header?.employeeName ?? (employee?.EMPNAME || ""),
    employeeId: savedData?.header?.employeeId ?? (employee?.EMPCODE || ""),
    doj: savedData?.header?.doj ?? formatDate(employee?.JOINDATE),
    designation: savedData?.header?.designation ?? (employee?.DESIGNAME || employee?.DESIG || ""),
    dor: savedData?.header?.dor ?? formatDate(employee?.DOL),
    department: savedData?.header?.department ?? (employee?.DEPTNAME || employee?.DEPTCODE || ""),
    doRelieving: savedData?.header?.doRelieving ?? formatDate(employee?.LASTWRKDAY || employee?.DOL),
    section: savedData?.header?.section ?? (employee?.NSECTION || employee?.NSECCODE || ""),
  }));

  const [accept, setAccept] = useState(() => ({
    name: savedData?.accept?.name ?? (employee?.EMPNAME || ""),
    relievingDate: savedData?.accept?.relievingDate ?? formatDate(employee?.LASTWRKDAY || employee?.DOL),
    date: savedData?.accept?.date ?? (formatDate(employee?.DOL) || getTodayFormatted()),
    hodSig: savedData?.accept?.hodSig ?? "",
  }));

  const [rows, setRows] = useState(() => savedData?.rows ?? makeInitialRows());
  // One signature per SECTION now, instead of one per row.
  const [sectionSigs, setSectionSigs] = useState(
    () => savedData?.sectionSigs ?? makeInitialSigs()
  );
  const [headHrSig, setHeadHrSig] = useState(() => savedData?.headHrSig ?? "");

  const triggerFormChange = (newHeader, newAccept, newRows, newSectionSigs, newHeadHrSig) => {
    if (onFormChange && employee?.EMPCODE) {
      onFormChange(employee.EMPCODE, {
        header: newHeader,
        accept: newAccept,
        rows: newRows,
        sectionSigs: newSectionSigs,
        headHrSig: newHeadHrSig,
      });
    }
  };

  const updateHeader = (f) => (v) => {
    const next = { ...header, [f]: v };
    setHeader(next);
    triggerFormChange(next, accept, rows, sectionSigs, headHrSig);
  };

  const updateAccept = (f) => (v) => {
    const next = { ...accept, [f]: v };
    setAccept(next);
    triggerFormChange(header, next, rows, sectionSigs, headHrSig);
  };

  const updateRow = (secKey, idx, field, value) => {
    const next = { ...rows };
    const list = [...next[secKey]];
    list[idx] = { ...list[idx], [field]: value };
    next[secKey] = list;
    setRows(next);
    triggerFormChange(header, accept, next, sectionSigs, headHrSig);
  };

  const updateSectionSig = (secKey, value) => {
    const next = { ...sectionSigs, [secKey]: value };
    setSectionSigs(next);
    triggerFormChange(header, accept, rows, next, headHrSig);
  };

  const updateHeadHr = (v) => {
    setHeadHrSig(v);
    triggerFormChange(header, accept, rows, sectionSigs, v);
  };

  const handlePrint = () => window.print();

  return (
    <div className={`ndf-page ${isPrintable ? "ndf-printable" : ""}`}>
      <style>{`
        .ndf-page {
          font-family: Arial, Helvetica, sans-serif;
          background: #e9e9e9;
          padding: 30px 16px 60px;
          color: #000;
        }
        .ndf-page.ndf-printable {
          background: #ffffff !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .ndf-page * { box-sizing: border-box; }

        .ndf-sheet {
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
          background: #fff;
          border: none;
          padding: 14px 18px 18px;
          position: relative;
        }
        .ndf-printable .ndf-sheet {
          width: 760px !important;
          max-width: 760px !important;
          border: none !important;
          padding: 12px 12px !important;
          margin: 0 auto !important;
        }

        .ndf-title {
          text-align: center;
          font-size: 19px;
          font-weight: bold;
          letter-spacing: 0.3px;
          margin: 4px 0 2px;
        }
        .ndf-document-code {
          position: absolute;
          bottom: 0;
          right: 0;
          font-size: 11px;
          font-weight: normal;
        }
        .ndf-subtitle {
          text-align: center;
          font-size: 11px;
          font-style: italic;
          margin: 0 0 10px;
        }

        table.ndf-meta {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          border: 1px solid #000;
          margin-bottom: 0;
        }
        table.ndf-meta td {
          display: table-cell !important;
          border: 1px solid #000;
          padding: 4px 8px;
          font-size: 12.5px;
          width: 50% !important;
          vertical-align: middle;
        }
        .ndf-hf { display: table; width: 100%; }
        .ndf-hf-label { display: table-cell; width: 1%; padding-right: 6px; white-space: nowrap; vertical-align: baseline; }
        .ndf-hf-input {
          display: table-cell;
          border: none;
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12.5px;
          font-weight: bold;
          padding: 1px 2px;
          width: 100%;
        }
        .ndf-hf-input:focus { outline: none; background: #fafafa; }

        .ndf-dept-accept {
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          border-bottom: 1px solid #000;
        }
        .ndf-dept-accept-title {
          text-align: center;
          font-weight: bold;
          font-size: 13px;
          letter-spacing: 0.3px;
          margin: 0;
          padding: 5px 8px;
          border-bottom: 1px solid #000;
        }
        .ndf-dept-text {
          font-size: 12.5px;
          line-height: 2;
          margin: 0;
          padding: 8px 10px 10px;
          width: 100%;
        }
        .ndf-inline-input {
          border: none;
          border-bottom: 1px solid #666;
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12.5px;
          line-height: inherit;
          padding: 0 2px;
          margin: 0;
          vertical-align: baseline;
          min-width: 160px;
        }
        .ndf-inline-input:focus { outline: none; border-bottom: 1px solid #000; }
        .ndf-inline-input.short { min-width: 110px; }
        .ndf-inline-input.relieving-date { width: 78px; min-width: 0; }

        .ndf-accept-row {
          display: table;
          width: 100%;
          padding: 0 10px 10px;
        }
        .ndf-date-field { display: table-cell; width: 50%; font-size: 12.5px; vertical-align: bottom; }
        .ndf-date-field span { padding-right: 6px; }
        .ndf-date-input {
          border: none;
          border-bottom: 1px solid #666;
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12.5px;
          width: 120px;
          padding: 1px 2px;
        }
        .ndf-date-input:focus { outline: none; border-bottom: 1px solid #000; }
        .ndf-hod-sig { display: table-cell; width: 50%; text-align: right; vertical-align: bottom; }
        .ndf-hod-sig input {
          display: block;
          border: none;
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12.5px;
          width: 200px;
          text-align: center;
          padding: 2px 2px;
        }
        .ndf-hod-sig input:focus { outline: none; }
        .ndf-hod-sig-label { font-weight: bold; font-size: 12px; margin-top: 3px; }

        .ndf-listheader {
          text-align: center;
          font-weight: bold;
          font-size: 13.5px;
          background: #d9d9d9;
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          padding: 5px;
        }

        table.ndf-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          font-size: 12.5px;
        }
        table.ndf-table td, table.ndf-table th {
          border: 1px solid #000;
          padding: 3px 5px;
          line-height: 1.15;
          vertical-align: middle;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        .ndf-section-row td {
          font-weight: bold;
          background: #ececec;
          padding: 5px 8px;
        }
        .ndf-section-row td.ndf-col-sig {
          background: #fff;
          font-weight: normal;
          padding: 3px 5px;
        }
        .ndf-colhead-row th {
          font-weight: bold;
          text-align: left;
          background: #fff;
          padding: 4px 5px;
        }
        .ndf-col-no { width: 8%; text-align: center; }
        .ndf-col-item { width: 36%; }
        .ndf-col-status { width: 28%; }
        .ndf-col-sig { width: 28%; text-align: center; vertical-align: middle; }
        .ndf-single-line-item { white-space: nowrap; }

        .ndf-sig-input, .ndf-status-input {
          width: 100%;
          border: none;
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12.5px;
          line-height: 1.15;
          padding: 1px 2px;
        }
        .ndf-sig-input {
          height: 100%;
          min-height: 34px;
          text-align: center;
        }
        .ndf-sig-input:focus, .ndf-status-input:focus { outline: none; background: #fafafa; }

        .ndf-headhr-row {
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          border-bottom: 1px solid #000;
          min-height: 65px;
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          padding: 6px 14px 6px;
        }
        .ndf-headhr-inner { text-align: center; }
        .ndf-headhr-inner input {
          display: block;
          border: none;
          background: transparent;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12.5px;
          width: 180px;
          height: 38px;
          text-align: center;
          padding: 2px;
        }
        .ndf-headhr-inner input:focus { outline: none; }
        .ndf-headhr-caption { font-weight: bold; font-size: 13px; margin-top: 2px; }

        .ndf-footer {
          margin: 2px 0 0;
          position: relative;
          text-align: center;
          font-size: 11px;
          line-height: 1.2;
          font-style: italic;
          white-space: nowrap;
        }
        .ndf-footer .ndf-document-code {
          font-size: inherit;
          line-height: inherit;
        }

        .ndf-actionbar {
          max-width: 820px;
          margin: 14px auto 0;
          display: flex;
          justify-content: flex-end;
        }
        .ndf-btn {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
          padding: 7px 14px;
          border: 1px solid #000;
          background: #fff;
          cursor: pointer;
        }
        .ndf-btn:hover { background: #f0f0f0; }

        .ndf-scroll-wrap {
          width: 100%;
          overflow-x: auto;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }
          .ndf-actionbar { display: none; }
          .ndf-page {
            background: #fff;
            padding: 0;
            width: 194mm;
            max-width: 194mm;
            margin: 0 auto;
          }
          .ndf-sheet {
            width: 100% !important;
            max-width: 100% !important;
            min-height: 281mm !important;
            border: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            padding: 4mm !important;
            overflow: visible !important;
          }
          .ndf-printable .ndf-sheet {
            width: 100% !important;
            max-width: 100% !important;
            padding: 4mm !important;
          }
          .ndf-title {
            margin-top: 0 !important;
            padding-top: 2mm;
          }
          table.ndf-meta td,
          table.ndf-table td,
          table.ndf-table th {
            padding-left: 3px;
            padding-right: 3px;
          }
          table.ndf-meta,
          table.ndf-table,
          .ndf-listheader,
          .ndf-dept-accept,
          .ndf-headhr-row,
          .ndf-footer {
            width: 100% !important;
            max-width: 100% !important;
          }
          table.ndf-table td,
          table.ndf-table th {
            height: 3.3mm;
          }
          .ndf-section-row td {
            height: 3.8mm;
            padding-top: 1px;
            padding-bottom: 1px;
          }
          .ndf-colhead-row th {
            height: 4.5mm;
          }
          .ndf-single-line-item {
            white-space: nowrap;
            font-size: 10px;
          }
          .ndf-headhr-row {
            min-height: 42px;
            padding-top: 4px;
            padding-bottom: 4px;
          }
          .ndf-headhr-inner input {
            height: 24px;
          }
          .ndf-footer {
            position: relative;
            margin: 0.5mm 0 1.5mm;
            text-align: center;
            font-size: 10px;
            line-height: 1.2;
            white-space: nowrap;
          }
          .ndf-inline-input,
          .ndf-inline-input.short {
            min-width: 0;
            max-width: 100%;
          }
          .ndf-hod-sig input,
          .ndf-headhr-inner input {
            max-width: 100%;
          }
          table.ndf-meta,
          .ndf-dept-accept,
          .ndf-headhr-row,
          .ndf-footer {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .ndf-listheader {
            page-break-after: avoid;
            break-after: avoid;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          table.ndf-table {
            page-break-before: auto;
          }
          table.ndf-table thead {
            display: table-header-group;
          }
          .ndf-scroll-wrap {
            overflow: visible !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .ndf-section-row {
            page-break-after: avoid;
            break-after: avoid;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="ndf-sheet">
        <div className="ndf-title">EMPLOYEE NO DUES FORM</div>
        <div className="ndf-subtitle">
          We are following &quot;IATF16949 CAPD method 10.3 Continuous Improvement Spirit&quot; to improve our GTI
        </div>

        <div className="ndf-scroll-wrap">
        <table className="ndf-meta">
          <tbody>
            <tr>
              <td><HeaderField label="Employee Name:" value={header.employeeName} onChange={updateHeader("employeeName")} /></td>
              <td><HeaderField label="Employee ID No:" value={header.employeeId} onChange={updateHeader("employeeId")} /></td>
            </tr>
            <tr>
              <td><HeaderField label="Date of Joining:" value={header.doj} onChange={updateHeader("doj")} /></td>
              <td><HeaderField label="Designation" value={header.designation} onChange={updateHeader("designation")} /></td>
            </tr>
            <tr>
              <td><HeaderField label="Date of Resignation:" value={header.dor} onChange={updateHeader("dor")} /></td>
              <td><HeaderField label="Department:" value={header.department} onChange={updateHeader("department")} /></td>
            </tr>
            <tr>
              <td><HeaderField label="Date of Relieving:" value={header.doRelieving} onChange={updateHeader("doRelieving")} /></td>
              <td><HeaderField label="Section:" value={header.section} onChange={updateHeader("section")} /></td>
            </tr>
          </tbody>
        </table>
        </div>

        <div className="ndf-dept-accept">
          <div className="ndf-dept-accept-title">DEPARTMENT ACCEPTANCE</div>
          <p className="ndf-dept-text">
            Mr/Ms.{" "}
            <input
              className="ndf-inline-input"
              style={{ width: `${Math.max(18, accept.name.length + 2)}ch` }}
              value={accept.name}
              onChange={(e) => updateAccept("name")(e.target.value)}
            />{" "}
            submitted his/her Resignation and the same has been approved. There is
            no objection to me to Relieve him/her on{" "}
            <input
              className="ndf-inline-input relieving-date"
              value={accept.relievingDate}
              onChange={(e) => updateAccept("relievingDate")(e.target.value)}
            />{" "}
            date subjected to Rules and Regulations of the Company.
          </p>

          <div className="ndf-accept-row">
            <div className="ndf-date-field">
              <span>Date:</span>
              <input
                className="ndf-date-input"
                value={accept.date}
                onChange={(e) => updateAccept("date")(e.target.value)}
              />
            </div>
            <div className="ndf-hod-sig">
              <input
                value={accept.hodSig}
                onChange={(e) => updateAccept("hodSig")(e.target.value)}
              />
              <div className="ndf-hod-sig-label">Signature of the HOD</div>
            </div>
          </div>
        </div>

        <div className="ndf-listheader">List Of Documents/ Assets To Hand Over</div>

        <div className="ndf-scroll-wrap">
        <table className="ndf-table">
          <thead>
            <tr className="ndf-colhead-row">
              <th className="ndf-col-no">S No</th>
              <th className="ndf-col-item">Documents/Assets</th>
              <th className="ndf-col-status">Returned/Deactivated</th>
              <th className="ndf-col-sig">Signature of HOS/HOD</th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((sec) => (
              <React.Fragment key={sec.key}>
                <tr className="ndf-section-row">
                  <td colSpan={4}>{sec.title}</td>
                </tr>
                {sec.items.map((item, idx) => {
                  const row = rows[sec.key]?.[idx] || { status: "" };
                  const isSingleLineItem =
                    item === "PEN/USB Drive/Wifi / Server permission" ||
                    item === "Agreement/Bond (Serbia/Abroad/Other)";
                  return (
                    <tr key={item}>
                      <td className="ndf-col-no">{idx + 1}</td>
                      <td className={`ndf-col-item ${isSingleLineItem ? "ndf-single-line-item" : ""}`}>{item}</td>
                      <td className="ndf-col-status">
                        <input
                          className="ndf-status-input"
                          value={row.status}
                          onChange={(e) =>
                            updateRow(sec.key, idx, "status", e.target.value)
                          }
                        />
                      </td>
                      {idx === 0 && (
                        <td className="ndf-col-sig" rowSpan={sec.items.length}>
                          <input
                            className="ndf-sig-input"
                            value={sectionSigs[sec.key] || ""}
                            onChange={(e) => updateSectionSig(sec.key, e.target.value)}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        </div>

        <div className="ndf-headhr-row">
          <div className="ndf-headhr-inner">
            <input
              value={headHrSig}
              onChange={(e) => updateHeadHr(e.target.value)}
            />
            <div className="ndf-headhr-caption">HEAD-HR</div>
          </div>
        </div>

        <div className="ndf-footer">
          Greentech Industries(India) Pvt. Ltd.@ HR 09.06.2025 by Rambabu J
          <span className="ndf-document-code">HR-009-6</span>
        </div>
      </div>

      {!isPrintable && !onClose && (
        <div className="ndf-actionbar no-print">
          <button className="ndf-btn" onClick={handlePrint}>Print / Save as PDF</button>
        </div>
      )}
    </div>
  );
}