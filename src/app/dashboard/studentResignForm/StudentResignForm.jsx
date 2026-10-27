'use client';

import React, { useState } from "react";

const Checkbox = ({ label, checked, onChange }) => (
  <label className="rf-checkbox-label">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="rf-checkbox-input"
    />
    <span>{label}</span>
  </label>
);

function getDateValue(value) {
  if (!value) return "";
  const datePart = String(value).split("T")[0];
  const [year, month, day] = datePart.split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return datePart;
}

function getTodayValue() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${today.getFullYear()}`;
}

function getHeaderValueStyle(value, baseSize = 10) {
  const length = String(value || "").length;
  const fontSize = length > 22 ? Math.max(7, baseSize * (22 / length)) : baseSize;
  return { fontSize: `${fontSize}px` };
}

const SectionHeaderRow = ({ children }) => (
  <tr className="rf-section-header-row">
    <td colSpan={100} className="rf-section-title">
      {children}
    </td>
  </tr>
);

const AssetRow = ({ no, label, value, onChange }) => (
  <tr className="rf-asset-row">
    <td colSpan={8} className="rf-cell rf-center rf-bold">{no}</td>
    <td colSpan={32} className="rf-cell rf-asset-name">{label}</td>
    <td colSpan={30} className="rf-cell rf-input-cell">
      <input
        value={value?.returned || ""}
        onChange={(e) => onChange({ ...(value || {}), returned: e.target.value })}
        className="rf-plain-input rf-center"
      />
    </td>
    <td colSpan={30} className="rf-cell rf-input-cell">
      <input
        value={value?.signature || ""}
        onChange={(e) => onChange({ ...(value || {}), signature: e.target.value })}
        className="rf-plain-input rf-center"
      />
    </td>
  </tr>
);

function getTextValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const normalized = typeof value === 'string' ? value.trim() : String(value).trim();
    if (normalized) return normalized;
  }
  return "";
}

function getHeaderFromEmployee(employee) {
  return {
    studentName: getTextValue(employee?.EMPNAME),
    studentId: getTextValue(employee?.EMPCODE),
    designation: getTextValue(employee?.DESIGNAME, employee?.DESIG, employee?.DESIGNATION),
    section: getTextValue(employee?.NSECTION, employee?.NSECCODE, employee?.SECTION),
    department: getTextValue(employee?.DEPTNAME, employee?.DEPTCODE, employee?.DEPARTMENT),
    dateJoining: getDateValue(employee?.JOINDATE ?? employee?.DOJ),
    dateLeaving: getDateValue(employee?.DOL ?? employee?.DATE_OF_LEAVING),
    appDate: getTodayValue(),
  };
}

function getReasonsFromEmployee(employee) {
  const norm = (employee?.REASON || "").toUpperCase().trim();
  const isTraining = norm.includes("TRAIN");
  const isHealth = norm.includes("HEALTH") || norm.includes("ILL") || norm.includes("MEDIC");
  const isFamily = norm.includes("FAMILY") || norm.includes("FAM");
  const hasMatched = isTraining || isHealth || isFamily;
  const isOthers = Boolean(!hasMatched && norm);

  return {
    reasons: {
      training: isTraining,
      health: isHealth,
      family: isFamily,
      others: isOthers,
    },
    reasonDetails: isOthers ? (employee?.REASON || "").trim() : "",
  };
}

function ResignationForm({
  header,
  setHeader,
  reasons,
  setReasons,
  reasonDetails,
  setReasonDetails,
  signatures,
  setSignatures,
  generalAffairs,
  setGeneralAffairs,
  hrDept,
  setHrDept,
  hrHeadSignature,
  setHrHeadSignature,
}) {
  const updateHeader = (key) => (val) => setHeader((h) => ({ ...h, [key]: val }));
  const toggleReason = (key) => () => setReasons((r) => ({ ...r, [key]: !r[key] }));

  return (
    <div className="rf-scope">
      <div className="rf-heading">
        <div className="rf-title">
          Resignation Application Form – Students (Trainees)
        </div>
        <div className="rf-subtitle">
          We are following &quot;IATF-16949 CAPD method 10.3 Continuous Improvement Spirit&quot; to improve our GTI
        </div>
      </div>

      <div className="rf-table-container">
        <table className="rf-table">
          <colgroup>
            {Array.from({ length: 100 }).map((_, idx) => (
              <col key={idx} style={{ width: "1%" }} />
            ))}
          </colgroup>
          <tbody>
            <tr className="rf-header-row">
              <td colSpan={25} className="rf-header-cell">
                <div className="rf-header-label">Student Name</div>
                <input
                  value={header.studentName}
                  onChange={(e) => updateHeader("studentName")(e.target.value)}
                  className="rf-plain-input rf-header-value rf-bold"
                  style={getHeaderValueStyle(header.studentName, 11)}
                />
              </td>
              <td colSpan={15} className="rf-header-cell">
                <div className="rf-header-label">Student ID No.</div>
                <input
                  value={header.studentId}
                  onChange={(e) => updateHeader("studentId")(e.target.value)}
                  className="rf-plain-input rf-center rf-bold"
                  style={getHeaderValueStyle(header.studentId, 11)}
                />
              </td>
              <td colSpan={20} className="rf-header-cell">
                <div className="rf-header-label">Designation</div>
                <input
                  value={header.designation}
                  onChange={(e) => updateHeader("designation")(e.target.value)}
                  className="rf-plain-input rf-header-value"
                  style={getHeaderValueStyle(header.designation, 11)}
                />
              </td>
              <td colSpan={20} className="rf-header-cell">
                <div className="rf-header-label">Section</div>
                <input
                  value={header.section}
                  onChange={(e) => updateHeader("section")(e.target.value)}
                  className="rf-plain-input rf-header-value"
                  style={getHeaderValueStyle(header.section, 11)}
                />
              </td>
              <td colSpan={20} className="rf-header-cell">
                <div className="rf-header-label">Department</div>
                <input
                  value={header.department}
                  onChange={(e) => updateHeader("department")(e.target.value)}
                  className="rf-plain-input rf-header-value"
                  style={getHeaderValueStyle(header.department, 11)}
                />
              </td>
            </tr>

            <tr className="rf-date-row">
              <td colSpan={34} className="rf-date-cell">
                <span className="rf-date-label">Date of Joining: </span>
                <input
                  type="text"
                  value={header.dateJoining}
                  onChange={(e) => updateHeader("dateJoining")(e.target.value)}
                  className="rf-date-input"
                />
              </td>
              <td colSpan={33} className="rf-date-cell">
                <span className="rf-date-label">Date of Leaving: </span>
                <input
                  type="text"
                  value={header.dateLeaving}
                  onChange={(e) => updateHeader("dateLeaving")(e.target.value)}
                  className="rf-date-input"
                />
              </td>
              <td colSpan={33} className="rf-date-cell">
                <span className="rf-date-label">Application Date: </span>
                <input
                  type="text"
                  value={header.appDate}
                  onChange={(e) => updateHeader("appDate")(e.target.value)}
                  className="rf-date-input"
                />
              </td>
            </tr>

            <tr className="rf-reasons-row">
              <td colSpan={20} className="rf-cell rf-reasons-label-cell">
                Reasons for Resignation
              </td>
              <td colSpan={80} className="rf-cell rf-reasons-content-cell">
                <div className="rf-reasons-wrapper">
                  <div className="rf-checkbox-group">
                    <Checkbox label="Training Completed" checked={reasons.training} onChange={toggleReason("training")} />
                    <Checkbox label="Health" checked={reasons.health} onChange={toggleReason("health")} />
                    <Checkbox label="Family Responsibility" checked={reasons.family} onChange={toggleReason("family")} />
                    <Checkbox label="Others" checked={reasons.others} onChange={toggleReason("others")} />
                  </div>
                  <input
                    value={reasonDetails}
                    onChange={(e) => {
                      const value = e.target.value;
                      setReasonDetails(value);
                      setReasons((previous) => ({ ...previous, others: value.trim().length > 0 }));
                    }}
                    placeholder=" "
                    className="rf-underline-input"
                  />
                </div>
              </td>
            </tr>

            <tr className="rf-sig-row">
              <td colSpan={34} className="rf-sig-cell">
                <div className="rf-sig-box">
                  <input
                    value={signatures.applicant}
                    onChange={(e) => setSignatures((s) => ({ ...s, applicant: e.target.value }))}
                    className="rf-sig-input"
                    placeholder=" "
                  />
                  <div className="rf-sig-caption">Applicant&apos;s Signature</div>
                </div>
              </td>
              <td colSpan={33} className="rf-sig-cell">
                <div className="rf-sig-box">
                  <input
                    value={signatures.hos}
                    onChange={(e) => setSignatures((s) => ({ ...s, hos: e.target.value }))}
                    className="rf-sig-input"
                    placeholder=" "
                  />
                  <div className="rf-sig-caption">HOS</div>
                </div>
              </td>
              <td colSpan={33} className="rf-sig-cell">
                <div className="rf-sig-box">
                  <input
                    value={signatures.hod}
                    onChange={(e) => setSignatures((s) => ({ ...s, hod: e.target.value }))}
                    className="rf-sig-input"
                    placeholder=" "
                  />
                  <div className="rf-sig-caption">HOD</div>
                </div>
              </td>
            </tr>

            <tr className="rf-title-row">
              <td colSpan={100} className="rf-cell rf-center rf-bold rf-handover-title">
                List Of Documents/ Assets To Hand Over
              </td>
            </tr>

            <SectionHeaderRow>General Affairs</SectionHeaderRow>

            <tr className="rf-doc-header">
              <td colSpan={8} className="rf-center rf-bold">S.No</td>
              <td colSpan={32} className="rf-bold" style={{ paddingLeft: "6px" }}>Documents / Assets</td>
              <td colSpan={30} className="rf-center rf-bold">Returned / Deactivated</td>
              <td colSpan={30} className="rf-center rf-bold">Signature of HOS / HOD</td>
            </tr>

            <AssetRow
              no={1}
              label="Uniform / Mesh Vest / PPEs"
              value={generalAffairs.uniform}
              onChange={(v) => setGeneralAffairs((g) => ({ ...g, uniform: v }))}
            />
            <AssetRow
              no={2}
              label="Dormitory Clearance"
              value={generalAffairs.dormitory}
              onChange={(v) => setGeneralAffairs((g) => ({ ...g, dormitory: v }))}
            />
            <AssetRow
              no={3}
              label="Any other Recovery or Pay"
              value={generalAffairs.other}
              onChange={(v) => setGeneralAffairs((g) => ({ ...g, other: v }))}
            />

            <SectionHeaderRow>HR Department</SectionHeaderRow>

            <AssetRow
              no={1}
              label="I.D Card, Business Cards"
              value={hrDept.id}
              onChange={(v) => setHrDept((h) => ({ ...h, id: v }))}
            />
            <AssetRow
              no={2}
              label="Others"
              value={hrDept.others}
              onChange={(v) => setHrDept((h) => ({ ...h, others: v }))}
            />

            <tr className="rf-hrhead-tr">
              <td colSpan={100} className="rf-hrhead-cell">
                <div className="rf-hrhead-row">
                  <input
                    value={hrHeadSignature}
                    onChange={(e) => setHrHeadSignature(e.target.value)}
                    className="rf-hrhead-input"
                  />
                  <span className="rf-hrhead-caption">HR Head Signature</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rf-footer">
        <div className="rf-footer-company">Greentech Industries(India) Pvt. Ltd.@HR 04.03.2024 by Rambabu</div>
        <div className="rf-footer-code">HR-055-1</div>
      </div>
    </div>
  );
}

/**
 * Two resignation forms on a single A4 sheet.
 * Takes the entire A4 page with equal halves (148mm top half, 148mm bottom half)
 * separated by a central dashed cut line.
 */
export default function TwoResignationForms({ employee, employee1, employee2 }) {
  const emp1 = employee1 || employee;
  const emp2 = employee2 || employee;

  // Shared state for the single-employee case so edits update both identical copies
  const [header1, setHeader1] = useState(() => getHeaderFromEmployee(emp1));
  const [reasons1, setReasons1] = useState(() => getReasonsFromEmployee(emp1).reasons);
  const [reasonDetails1, setReasonDetails1] = useState(() => getReasonsFromEmployee(emp1).reasonDetails);
  const [signatures1, setSignatures1] = useState({ applicant: "", hos: "", hod: "" });
  const [generalAffairs1, setGeneralAffairs1] = useState({
    uniform: { returned: "", signature: "" },
    dormitory: { returned: "", signature: "" },
    other: { returned: "", signature: "" },
  });
  const [hrDept1, setHrDept1] = useState({
    id: { returned: "", signature: "" },
    others: { returned: "", signature: "" },
  });
  const [hrHeadSignature1, setHrHeadSignature1] = useState("");

  const isShared = !employee1 && !employee2;

  // If separate employees were provided, maintain distinct state for copy 2
  const [header2, setHeader2] = useState(() => getHeaderFromEmployee(emp2));
  const [reasons2, setReasons2] = useState(() => getReasonsFromEmployee(emp2).reasons);
  const [reasonDetails2, setReasonDetails2] = useState(() => getReasonsFromEmployee(emp2).reasonDetails);
  const [signatures2, setSignatures2] = useState({ applicant: "", hos: "", hod: "" });
  const [generalAffairs2, setGeneralAffairs2] = useState({
    uniform: { returned: "", signature: "" },
    dormitory: { returned: "", signature: "" },
    other: { returned: "", signature: "" },
  });
  const [hrDept2, setHrDept2] = useState({
    id: { returned: "", signature: "" },
    others: { returned: "", signature: "" },
  });
  const [hrHeadSignature2, setHrHeadSignature2] = useState("");

  return (
    <div className="rf-page">
      <style>{`
        /* ======================== SCREEN & BASE STYLES ======================== */
        .rf-page {
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          background: transparent;
          padding: 12px 0;
          display: flex;
          justify-content: center;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Exactly one A4 sheet: 210mm x 297mm on desktop, fluid on small screens */
        .rf-sheet {
          width: 210mm;
          max-width: 100%;
          min-width: 0;
          height: auto;
          min-height: auto;
          max-height: none;
          margin: 0 auto;
          background: #fff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          border: 1px solid #d1d5db;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          overflow: visible;
          position: relative;
        }

        /* Equal halves (responsive on screen, exactly 148mm in print) */
        .rf-half {
          width: 100%;
          max-width: 100%;
          height: auto;
          min-height: auto;
          max-height: none;
          flex: 0 0 auto;
          box-sizing: border-box;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: visible;
        }

        /* Dashed cut divider sitting exactly in the middle between both halves */
        .rf-cut-divider {
          width: 100%;
          max-width: 100%;
          height: auto;
          min-height: 16px;
          max-height: none;
          flex: 0 0 auto;
          box-sizing: border-box;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 6px 14px;
          overflow: visible;
          z-index: 10;
        }
        .rf-cut-line {
          width: 100%;
          border-top: 1px dashed #666;
          height: 0;
        }
        .rf-cut-label {
          position: absolute;
          right: 14px;
          top: -7px;
          font-size: 8px;
          color: #666;
          background: #fff;
          padding: 0 5px;
          letter-spacing: 0.5px;
          line-height: 14px;
        }

        /* Scope filling the entire half */
        .rf-scope {
          width: 100%;
          height: auto;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          font-size: 10px;
          line-height: 1.2;
        }

        /* Form Heading: Title and Subtitle */
        .rf-heading {
          text-align: center;
          flex: 0 0 auto;
          margin-bottom: 6px;
        }
        .rf-title {
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -0.1px;
          color: #000;
          line-height: 1.15;
        }
        .rf-subtitle {
          font-size: 9px;
          margin-top: 1px;
          font-weight: 400;
          color: #111;
          line-height: 1.15;
        }

        /* Main Table Layout */
        .rf-table-container {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          min-height: 0;
          width: 100%;
          overflow-x: auto;
        }
        .rf-table {
          width: 100%;
          height: auto;
          border-collapse: collapse;
          table-layout: fixed;
          border: 1px solid #000;
          margin: 0;
          box-sizing: border-box;
        }
        .rf-table td, .rf-table th {
          border: 1px solid #000;
          box-sizing: border-box;
        }
        .rf-cell {
          padding: 2px 4px;
          vertical-align: middle;
        }
        .rf-center {
          text-align: center;
        }
        .rf-bold {
          font-weight: 700;
        }

        /* Row 1: Student Details */
        .rf-header-row {
          min-height: 38px;
        }
        .rf-header-cell {
          padding: 1.5px 3px;
          vertical-align: middle;
        }
        .rf-header-label {
          text-align: center;
          font-weight: 700;
          font-size: 10.5px;
          margin-bottom: 1.5px;
          color: #000;
        }
        .rf-header-value {
          text-align: left;
        }

        /* Row 2: Date Details */
        .rf-date-row {
          min-height: 28px;
        }
        .rf-date-cell {
          padding: 1.5px 4px;
          text-align: center;
          vertical-align: middle;
          white-space: nowrap;
        }
        .rf-date-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #000;
        }
        .rf-date-input {
          display: inline-block;
          width: 80px;
          max-width: 100%;
          min-width: 0;
          border: none;
          border-bottom: 1px solid #000;
          outline: none;
          font-size: 11px;
          background: transparent;
          text-align: center;
          padding: 0 2px;
          color: #000;
        }

        /* Row 3: Reasons for Resignation */
        .rf-reasons-row {
          min-height: 48px;
        }
        .rf-reasons-label-cell {
          font-weight: 700;
          font-size: 9.5px;
          vertical-align: middle;
          padding-left: 6px;
          color: #000;
        }
        .rf-reasons-content-cell {
          padding: 2px 6px;
          vertical-align: middle;
        }
        .rf-reasons-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2.5px;
        }
        .rf-checkbox-group {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }
        .rf-checkbox-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9.5px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          color: #000;
        }
        .rf-checkbox-input {
          width: 13px;
          height: 13px;
          cursor: pointer;
          accent-color: #000;
        }
        .rf-underline-input {
          width: 100%;
          min-width: 0;
          border: none;
          border-bottom: 1px solid #000;
          outline: none;
          font-size: 9.5px;
          padding: 1px 0;
          background: transparent;
          color: #000;
        }

        /* Row 4: Applicant / HOS / HOD Signatures */
        .rf-sig-row {
          min-height: 52px;
        }
        .rf-sig-cell {
          padding: 0 !important;
          vertical-align: top;
          min-height: 52px;
          box-sizing: border-box;
        }
        .rf-sig-box {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 2px 4px 4px 4px;
          box-sizing: border-box;
        }
        .rf-sig-input {
          width: 100%;
          min-width: 0;
          flex: 1 1 auto;
          min-height: 0;
          height: auto;
          border: none;
          outline: none;
          background: transparent;
          font-size: 10.5px;
          text-align: center;
          color: #000;
          font-family: inherit;
          box-sizing: border-box;
          padding: 0;
        }
        .rf-sig-caption {
          flex: 0 0 auto;
          font-size: 9.5px;
          font-weight: 700;
          color: #000;
          line-height: 1.1;
          text-align: center;
          padding-bottom: 1px;
        }

        /* Row 5: Assets Section Title */
        .rf-title-row {
          min-height: 22px;
        }
        .rf-handover-title {
          font-size: 10px;
          font-weight: 700;
          text-align: center;
          background: #fff;
          color: #000;
        }

        /* Category Header Rows */
        .rf-section-header-row {
          min-height: 20px;
        }
        .rf-section-title {
          background: #e8e8e8;
          font-weight: 700;
          font-size: 9.5px;
          padding: 1px 6px;
          vertical-align: middle;
          color: #000;
        }

        /* Doc Table Header Row */
        .rf-doc-header {
          min-height: 22px;
        }
        .rf-doc-header td {
          background: #f4f4f4;
          font-size: 9px;
          vertical-align: middle;
          color: #000;
        }

        /* Asset Rows */
        .rf-asset-row {
          min-height: 26px;
        }
        .rf-asset-name {
          font-size: 9.5px;
          padding-left: 6px;
          color: #000;
        }
        .rf-input-cell {
          padding: 0;
        }

        .rf-plain-input {
          width: 100%;
          min-width: 0;
          height: 100%;
          border: none;
          outline: none;
          font-size: 10px;
          padding: 1px 3px;
          background: transparent;
          box-sizing: border-box;
          color: #000;
          font-family: inherit;
        }

        /* Row 14: HR Head Signature Row */
        .rf-hrhead-tr {
          min-height: 56px;
        }
        .rf-hrhead-cell {
          padding: 4px 10px 4px 4px;
          vertical-align: bottom;
        }
        .rf-hrhead-row {
          display: flex;
          align-items: flex-end;
          justify-content: flex-end;
          gap: 10px;
          height: 100%;
        }
        .rf-hrhead-input {
          border: none;
          outline: none;
          font-size: 10.5px;
          text-align: right;
          background: transparent;
          width: 140px;
          max-width: 100%;
          min-width: 0;
          color: #000;
          font-family: inherit;
        }
        .rf-hrhead-caption {
          font-size: 10px;
          font-weight: 700;
          padding-bottom: 2px;
          white-space: nowrap;
          color: #000;
        }

        /* Form Footer: Company Name in Middle, Form Code on Right */
        .rf-footer {
          flex: 0 0 auto;
          margin-top: 6px;
          position: relative;
          text-align: center;
          font-size: 9.5px;
          font-weight: 500;
          color: #000;
          line-height: 1.2;
          padding: 0 2px;
        }
        .rf-footer-company {
          text-align: center;
        }
        .rf-footer-code {
          position: absolute;
          right: 2px;
          top: 0;
          font-weight: 700;
        }

        /* ======================== PRINT STYLES ======================== */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            overflow: hidden !important;
            background: #fff !important;
          }

          body * {
            visibility: hidden !important;
          }

          .rf-page,
          .rf-page * {
            visibility: visible !important;
          }

          .rf-page {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: hidden !important;
            z-index: 999999 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .rf-sheet {
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .rf-half {
            width: 100% !important;
            height: 148mm !important;
            min-height: 148mm !important;
            max-height: 148mm !important;
            flex: 0 0 148mm !important;
            box-sizing: border-box !important;
            padding: 3mm 9mm 2.5mm 9mm !important;
            overflow: hidden !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }

          .rf-cut-divider {
            width: 100% !important;
            height: 1mm !important;
            min-height: 1mm !important;
            max-height: 1mm !important;
            flex: 0 0 1mm !important;
            padding: 0 9mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            align-items: center !important;
            justify-content: flex-end !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          .rf-table {
            height: 100% !important;
            width: 100% !important;
          }

          .rf-header-row { height: 10.5mm !important; }
          .rf-date-row { height: 7.5mm !important; }
          .rf-reasons-row { height: 13.5mm !important; }
          .rf-sig-row { height: 15mm !important; }
          .rf-sig-cell { height: 15mm !important; }
          .rf-title-row { height: 5.5mm !important; }
          .rf-section-header-row { height: 5mm !important; }
          .rf-doc-header { height: 5.5mm !important; }
          .rf-asset-row { height: 6.8mm !important; }
          .rf-hrhead-tr { height: 17mm !important; }

          .rf-heading { margin-bottom: 1.5mm !important; }
          .rf-footer { margin-top: 1.5mm !important; }

          .rf-plain-input,
          .rf-underline-input,
          .rf-sig-input,
          .rf-hrhead-input {
            width: 100% !important;
          }

          .rf-date-input {
            width: 80px !important;
          }

          .rf-section-title {
            background: #e8e8e8 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .rf-doc-header td {
            background: #f4f4f4 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="rf-sheet">
        {/* Top Half (50% of page height) */}
        <div className="rf-half">
          <ResignationForm
            header={header1}
            setHeader={isShared ? (val) => { setHeader1(val); setHeader2(val); } : setHeader1}
            reasons={reasons1}
            setReasons={isShared ? (val) => { setReasons1(val); setReasons2(val); } : setReasons1}
            reasonDetails={reasonDetails1}
            setReasonDetails={isShared ? (val) => { setReasonDetails1(val); setReasonDetails2(val); } : setReasonDetails1}
            signatures={signatures1}
            setSignatures={isShared ? (val) => { setSignatures1(val); setSignatures2(val); } : setSignatures1}
            generalAffairs={generalAffairs1}
            setGeneralAffairs={isShared ? (val) => { setGeneralAffairs1(val); setGeneralAffairs2(val); } : setGeneralAffairs1}
            hrDept={hrDept1}
            setHrDept={isShared ? (val) => { setHrDept1(val); setHrDept2(val); } : setHrDept1}
            hrHeadSignature={hrHeadSignature1}
            setHrHeadSignature={isShared ? (val) => { setHrHeadSignature1(val); setHrHeadSignature2(val); } : setHrHeadSignature1}
          />
        </div>

        {/* Dashed Cut Line at the exact midpoint */}
        <div className="rf-cut-divider">
          <div className="rf-cut-line" />
          <span className="rf-cut-label">✂ cut here</span>
        </div>

        {/* Bottom Half (50% of page height) */}
        <div className="rf-half">
          <ResignationForm
            header={isShared ? header1 : header2}
            setHeader={isShared ? (val) => { setHeader1(val); setHeader2(val); } : setHeader2}
            reasons={isShared ? reasons1 : reasons2}
            setReasons={isShared ? (val) => { setReasons1(val); setReasons2(val); } : setReasons2}
            reasonDetails={isShared ? reasonDetails1 : reasonDetails2}
            setReasonDetails={isShared ? (val) => { setReasonDetails1(val); setReasonDetails2(val); } : setReasonDetails2}
            signatures={isShared ? signatures1 : signatures2}
            setSignatures={isShared ? (val) => { setSignatures1(val); setSignatures2(val); } : setSignatures2}
            generalAffairs={isShared ? generalAffairs1 : generalAffairs2}
            setGeneralAffairs={isShared ? (val) => { setGeneralAffairs1(val); setGeneralAffairs2(val); } : setGeneralAffairs2}
            hrDept={isShared ? hrDept1 : hrDept2}
            setHrDept={isShared ? (val) => { setHrDept1(val); setHrDept2(val); } : setHrDept2}
            hrHeadSignature={isShared ? hrHeadSignature1 : hrHeadSignature2}
            setHrHeadSignature={isShared ? (val) => { setHrHeadSignature1(val); setHrHeadSignature2(val); } : setHrHeadSignature2}
          />
        </div>
      </div>
    </div>
  );
}