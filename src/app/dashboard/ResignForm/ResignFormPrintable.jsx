'use client';

import React from 'react';

function getDateParts(dateStr) {
  if (!dateStr) return { dd: '', mm: '', yyyy: '' };
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return { dd: parts[2], mm: parts[1], yyyy: parts[0] };
    }
  } catch (e) {}
  return { dd: '', mm: '', yyyy: '' };
}

function getTodayDateParts() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = String(today.getFullYear());
  return { dd, mm, yyyy };
}

const noop = () => {};

function getDynamicFontSize(text, baseSize = 12, maxLen = 18) {
  if (!text) return `${baseSize}px`;
  if (text.length <= maxLen) return `${baseSize}px`;
  const calculated = Math.floor(baseSize * (maxLen / text.length));
  return `${Math.max(calculated, 6.5)}px`;
}

/**
 * Read-only, always-print-styled clone of ResignForm's "print-sheet".
 * Used off-screen by EmployeeTable to capture each selected employee's
 * form with html2canvas and assemble a multi-page PDF.
 */
export default function ResignFormPrintable({ employee, savedData }) {
  if (!employee) return null;

  const norm = (employee.REASON || '').toUpperCase().trim();
  const prefilledReasonMap = {
    furtherPlan: norm.includes('PLAN'),
    health: norm.includes('HEALTH'),
    salary: norm.includes('SALARY') || norm.includes('DISSATISFACTION'),
    family: norm.includes('FAMILY') || norm.includes('FAM RES') || norm.includes('RESPONSIBILITY') || norm.includes('FAM'),
    management: norm.includes('MANAGEMENT'),
    marriage: norm.includes('MARRIAGE'),
    personal: norm.includes('PERSONAL'),
    interest: norm.includes('INTEREST') || norm.includes('DEVIATION'),
    betterCareer: norm.includes('CAREER') || norm.includes('OPPORTUNITY'),
    transportation: norm.includes('TRANSPORT'),
    education: norm.includes('EDUCATION'),
    others: false,
  };

  const hasMatched = Object.values(prefilledReasonMap).some(Boolean);
  const isOthersPrefilled = !hasMatched && employee.REASON && employee.REASON.trim() !== '';
  if (isOthersPrefilled) {
    prefilledReasonMap.others = true;
  }

  const initialJoin = getDateParts(employee.JOINDATE);
  const initialDol = getDateParts(employee.DOL);
  const today = getTodayDateParts();

  const v = (key, fallback) =>
    savedData && savedData[key] !== undefined && savedData[key] !== '' ? savedData[key] : fallback;

  const empName = v('empName', employee.EMPNAME || '');
  const empCode = v('empCode', employee.EMPCODE || '');
  const desig = v('desig', employee.DESIGNAME || employee.DESIG || '');
  const nsecCode = v('nsecCode', employee.NSECTION || employee.NSECCODE || '');
  const deptCode = v('deptCode', employee.DEPTNAME || employee.DEPTCODE || '');

  const joinDd = v('joinDd', initialJoin.dd);
  const joinMm = v('joinMm', initialJoin.mm);
  const joinYyyy = v('joinYyyy', initialJoin.yyyy);

  const dolDd = v('dolDd', initialDol.dd);
  const dolMm = v('dolMm', initialDol.mm);
  const dolYyyy = v('dolYyyy', initialDol.yyyy);

  const appDd = v('appDd', today.dd);
  const appMm = v('appMm', today.mm);
  const appYyyy = v('appYyyy', today.yyyy);

  const voluntaryResign = savedData ? !!savedData.voluntaryResign : false;
  const longAbsentRemoved = savedData ? !!savedData.longAbsentRemoved : false;

  const initialAbroadFrom = getDateParts(employee.AGRPERIFROM);
  const initialAbroadTo = getDateParts(employee.AGRPERITO);

  const abroadYes = savedData ? !!savedData.abroadYes : !!employee.SERBIA_EMPCODE;
  const abroadNo = savedData ? !!savedData.abroadNo : !employee.SERBIA_EMPCODE;
  const abroadFromDd = v('abroadFromDd', initialAbroadFrom.dd);
  const abroadFromMm = v('abroadFromMm', initialAbroadFrom.mm);
  const abroadFromYyyy = v('abroadFromYyyy', initialAbroadFrom.yyyy);
  const abroadToDd = v('abroadToDd', initialAbroadTo.dd);
  const abroadToMm = v('abroadToMm', initialAbroadTo.mm);
  const abroadToYyyy = v('abroadToYyyy', initialAbroadTo.yyyy);

  const reasons = (savedData && savedData.reasons) || prefilledReasonMap;
  const othersExplain = v('othersExplain', (isOthersPrefilled ? employee.REASON : ''));
  const exitRecordText = v('exitRecordText', '➤ ');

  const interviewDd = v('interviewDd', today.dd);
  const interviewMm = v('interviewMm', today.mm);
  const interviewYyyy = v('interviewYyyy', today.yyyy);
  const remarks = v('remarks', '');

  return (
    <div className="print-sheet mx-auto font-sans text-xs text-slate-900 bg-white" style={{ width: '800px', padding: '6px', border: 'none', boxSizing: 'border-box' }}>
      
      {/* Custom Embedded CSS */}
      <style>{`
        .print-sheet {
          font-family: Arial, Helvetica, sans-serif !important;
          font-size: 11px !important;
          color: #000000 !important;
          background-color: #ffffff !important;
          box-sizing: border-box !important;
          overflow: visible !important;
        }
        .print-sheet h1 {
          text-align: center;
          font-size: 15px;
          font-weight: bold;
          margin: 2px 0 1px 0;
        }
        .print-sheet .subtitle {
          text-align: center;
          font-size: 9px;
          font-weight: bold;
          color: #000;
          margin: 0 0 8px 0;
        }
        .print-sheet table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .print-sheet td, .print-sheet th {
          border: 1px solid #000000 !important;
          padding: 3px 5px !important;
          vertical-align: top;
        }
        .print-sheet .emp-header-row td {
          border-bottom: none !important;
          padding: 3px 4px !important;
        }
        .print-sheet .emp-data-row td {
          border-top: none !important;
          padding: 2px 4px 4px !important;
        }
        .print-sheet .emp-data-row .plain-input {
          font-weight: bold;
        }
        .print-sheet .section-title {
          text-align: center;
          font-weight: bold;
          background: #ffffff;
        }
        .print-sheet .cb {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
          font-size: 10.5px;
        }
        .print-sheet .cb input[type="checkbox"] {
          width: 12px;
          height: 12px;
          margin: 0;
        }
        .print-sheet .date-cell {
          padding: 3px 4px !important;
          text-align: center;
        }
        .print-sheet .date-label {
          font-size: 9px;
          font-weight: bold;
          margin-bottom: 2px;
          white-space: nowrap;
        }
        .print-sheet .date-inputs {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          border-bottom: 1px solid #000 !important;
          padding-bottom: 1px;
        }
        .print-sheet .date-inputs input[type="text"] {
          border: none;
          border-bottom: none !important;
          width: 24px;
          text-align: center;
          font-size: 11px;
          padding: 1px 0;
          background: transparent;
        }
        .print-sheet .date-inputs input.year {
          width: 38px;
        }
        .print-sheet .date-inputs span {
          font-size: 11px;
        }
        .print-sheet .reasons-td {
          padding: 6px 16px 6px 8px !important;
        }
        .print-sheet .reasons-grid {
          display: grid;
          grid-template-columns: 28% 18% 28% 26%;
          gap: 4px 6px;
          margin-bottom: 4px;
        }
        .print-sheet .reasons-row {
          display: flex;
          justify-content: space-between;
          margin: 2px 0;
          flex-wrap: wrap;
          row-gap: 3px;
        }
        .print-sheet .others-row {
          display: flex;
          margin-top: 4px;
        }
        .print-sheet .others-line {
          border: none;
          border-bottom: 1px solid #000;
          width: 100%;
          font-size: 11px;
          padding: 2px 0;
          background: transparent;
        }
        .print-sheet .center { text-align: center; }
        .print-sheet .sig-row td { height: 35px !important; text-align: center; }
        .print-sheet .hr-title {
          text-align: center;
          font-weight: bold;
          background: #ffffff;
        }
        .print-sheet .exit-box td { height: 120px !important; }
        .print-sheet .doc-header td {
          font-weight: bold;
          background: #f5f5f5;
        }
        .print-sheet .cat-row td {
          font-weight: bold;
          color: #000;
        }
        .print-sheet .footer-row td {
          font-size: 9px;
          vertical-align: bottom;
          padding-bottom: 4px !important;
        }
        .print-sheet .headhr {
            font-weight: bold;
            font-size: 12px;
            text-align: right;
            vertical-align: bottom;
            height: 45px;
            padding: 0 10px 8px 0;
        }
        .print-sheet .page-footer { 
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          font-size: 8px;
          margin-top: 4px;
        }
        .print-sheet .page-footer .company {
          grid-column: 2;
          text-align: center;
          white-space: nowrap;
        }
        .print-sheet .page-footer .headcode {
          grid-column: 3;
          text-align: right;
        }
        .print-sheet .plain-input {
          border: none;
          font-size: 11px;
          width: 100% !important;
          box-sizing: border-box;
          background: transparent;
        }
      `}</style>

      <h1>Resignation Application Form – Operators</h1>
      <div className="subtitle">We are following &quot;IATF16949 CAPD method 10.3 Continuous Improvement Spirit&quot; to improve our GTI</div>

      <table>
        <colgroup>
          {Array.from({ length: 100 }).map((_, idx) => (
            <col key={idx} style={{ width: '1%' }} />
          ))}
        </colgroup>
        <tbody>
          <tr className="emp-header-row">
            <td colSpan="28" style={{ textAlign: 'center', fontWeight: 'bold' }}>Employee Name</td>
            <td colSpan="16" style={{ textAlign: 'center', fontWeight: 'bold' }}>Employee ID No.</td>
            <td colSpan="18" style={{ textAlign: 'center', fontWeight: 'bold' }}>Designation</td>
            <td colSpan="18" style={{ textAlign: 'center', fontWeight: 'bold' }}>Section</td>
            <td colSpan="20" style={{ textAlign: 'center', fontWeight: 'bold' }}>Department</td>
          </tr>
          <tr className="emp-data-row">
            <td colSpan="28" style={{ height: '24px' }}>
              <input className="plain-input" type="text" readOnly value={empName} style={{ fontSize: getDynamicFontSize(empName, 12, 24) }} />
            </td>
            <td colSpan="16">
              <input className="plain-input" style={{ textAlign: 'center', fontSize: getDynamicFontSize(empCode, 12, 12) }} type="text" readOnly value={empCode} />
            </td>
            <td colSpan="18">
              <input className="plain-input" style={{ fontSize: getDynamicFontSize(desig, 12, 18) }} type="text" readOnly value={desig} />
            </td>
            <td colSpan="18">
              <input className="plain-input" style={{ fontSize: getDynamicFontSize(nsecCode, 12, 18) }} type="text" readOnly value={nsecCode} />
            </td>
            <td colSpan="20">
              <input className="plain-input" style={{ fontSize: getDynamicFontSize(deptCode, 12, 22), letterSpacing: '-0.15px' }} type="text" readOnly value={deptCode} />
            </td>
          </tr>

          <tr>
            <td colSpan="25" className="date-cell">
              <div className="date-label">Date of Joining (DD/MM/YYYY)</div>
              <div className="date-inputs">
                <input type="text" readOnly value={joinDd} />
                <span>/</span>
                <input type="text" readOnly value={joinMm} />
                <span>/</span>
                <input type="text" className="year" readOnly value={joinYyyy} />
              </div>
            </td>
            <td colSpan="25" className="date-cell">
              <div className="date-label">Date of leaving (DD/MM/YYYY)</div>
              <div className="date-inputs">
                <input type="text" readOnly value={dolDd} />
                <span>/</span>
                <input type="text" readOnly value={dolMm} />
                <span>/</span>
                <input type="text" className="year" readOnly value={dolYyyy} />
              </div>
            </td>
            <td colSpan="25" className="date-cell" style={{ verticalAlign: 'middle', textAlign: 'left' }}>
              <label className="cb">
                <input type="checkbox" checked={voluntaryResign} onChange={noop} /> Voluntary resign
              </label>
              <br />
              <label className="cb">
                <input type="checkbox" checked={longAbsentRemoved} onChange={noop} /> Long Absent removed
              </label>
            </td>
            <td colSpan="25" className="date-cell">
              <div className="date-label">Application Date (DD/MM/YYYY)</div>
              <div className="date-inputs">
                <input type="text" readOnly value={appDd} />
                <span>/</span>
                <input type="text" readOnly value={appMm} />
                <span>/</span>
                <input type="text" className="year" readOnly value={appYyyy} />
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan="100">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '70px' }}>
                <div>
                  Worked in Serbia / Abroad
                  <label className="cb" style={{ marginLeft: '10px' }}>
                    <input type="checkbox" checked={abroadYes} onChange={noop} /> Yes
                  </label>
                  <label className="cb">
                    <input type="checkbox" checked={abroadNo} onChange={noop} /> No
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  if Yes, Period From:
                  <span className="date-inputs" style={{ display: 'inline-flex' }}>
                    <input type="text" readOnly value={abroadFromDd} style={{ width: '20px' }} />
                    <span>/</span>
                    <input type="text" readOnly value={abroadFromMm} style={{ width: '20px' }} />
                    <span>/</span>
                    <input type="text" className="year" readOnly value={abroadFromYyyy} style={{ width: '34px' }} />
                  </span>
                  &nbsp; To:
                  <span className="date-inputs" style={{ display: 'inline-flex' }}>
                    <input type="text" readOnly value={abroadToDd} style={{ width: '20px' }} />
                    <span>/</span>
                    <input type="text" readOnly value={abroadToMm} style={{ width: '20px' }} />
                    <span>/</span>
                    <input type="text" className="year" readOnly value={abroadToYyyy} style={{ width: '34px' }} />
                  </span>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan="25" style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>Reasons for Resignation</td>
            <td colSpan="75" className="reasons-td">
              <div className="reasons-grid">
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.furtherPlan} onChange={noop} /> Further Plan
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.health} onChange={noop} /> Health
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.salary} onChange={noop} /> Dissatisfaction of Salary
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.family} onChange={noop} /> Family Responsibility
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.management} onChange={noop} /> Management
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.marriage} onChange={noop} /> Marriage
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.personal} onChange={noop} /> Personal Reasons
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.interest} onChange={noop} /> Interest Deviation
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.betterCareer} onChange={noop} /> Better Career opportunity
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.transportation} onChange={noop} /> Transportation
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.education} onChange={noop} /> Education
                </label>
                <label className="cb">
                  <input type="checkbox" checked={!!reasons.others} onChange={noop} /> Others&nbsp;(Please Explain)
                </label>
              </div>
              <div className="reasons-row others-row">
                <input
                  type="text"
                  className="others-line"
                  readOnly
                  value={othersExplain}
                  placeholder="Please explain..."
                />
              </div>
            </td>
          </tr>

          <tr className="sig-row">
            <td colSpan="20">Applicant Signature</td>
            <td colSpan="40">Team Leader</td>
            <td colSpan="20">Section Head</td>
            <td colSpan="20">HOD</td>
          </tr>

          {/* Exit Interview Record Section */}
          <tr>
            <td colSpan="100" className="hr-title">HR EXIT INTERVIEW RECORD</td>
          </tr>
          <tr className="exit-box">
            <td colSpan="100">
              <textarea
                className="plain-input"
                readOnly
                value={exitRecordText}
                style={{ width: '100%', height: '120px', border: 'none', resize: 'none', fontSize: '16px' }}
              />
            </td>
          </tr>
          <tr>
            <td colSpan="100" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' , paddingRight: '240px' }}>
                <span>Interviewer Signature:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  Date:
                  <span className="date-inputs" style={{ display: 'inline-flex', marginLeft: '4px' }}>
                    <input type="text" readOnly value={interviewDd} style={{ width: '20px' }} />
                    <span>/</span>
                    <input type="text" readOnly value={interviewMm} style={{ width: '20px' }} />
                    <span>/</span>
                    <input type="text" className="year" readOnly value={interviewYyyy} style={{ width: '34px' }} />
                  </span>
                </span>
              </div>
            </td>
          </tr>

          {/* Asset Handover Header */}
          <tr>
            <td colSpan="100" className="section-title">List Of Documents/ Assets To Hand Over</td>
          </tr>

          {/* Asset Handover Header row */}
          <tr className="doc-header">
            <td colSpan="8" style={{ textAlign: 'center' }}>S.No</td>
            <td colSpan="34" style={{ textAlign: 'center' }}>Documents / Assets</td>
            <td colSpan="34" style={{ textAlign: 'center' }}>Returned / Deactivated</td>
            <td colSpan="24" style={{ textAlign: 'center' }}>Signature of HOS / HOD</td>
          </tr>

          {/* Asset handover rows */}
          <tr className="cat-row">
            <td colSpan="100">General Affairs</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">1</td>
            <td colSpan="34">Uniform</td>
            <td colSpan="34">&nbsp;</td>
            <td colSpan="24" rowSpan="5">&nbsp;</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">2</td>
            <td colSpan="34">PPE&apos;s</td>
            <td colSpan="34">&nbsp;</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">3</td>
            <td colSpan="34">Cloak Room Keys</td>
            <td colSpan="34">&nbsp;</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">4</td>
            <td colSpan="34">Dormitory Clearance</td>
            <td colSpan="34">&nbsp;</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">5</td>
            <td colSpan="34">Others</td>
            <td colSpan="34">&nbsp;</td>
          </tr>

          <tr className="cat-row">
            <td colSpan="100">Security Office</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">1</td>
            <td colSpan="34">Security clearance</td>
            <td colSpan="34">&nbsp;</td>
            <td colSpan="24">&nbsp;</td>
          </tr>

          <tr className="cat-row">
            <td colSpan="100">HSE Department</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">1</td>
            <td colSpan="34">HSE Deductions</td>
            <td colSpan="34">&nbsp;</td>
            <td colSpan="24" rowSpan="2">&nbsp;</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">2</td>
            <td colSpan="34">Any other (Please Specify)</td>
            <td colSpan="34">&nbsp;</td>
          </tr>

          <tr className="cat-row">
            <td colSpan="100">HR Department</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">1</td>
            <td colSpan="34">I.D Cards, Business Cards &amp; SEZ ID Card</td>
            <td colSpan="34">&nbsp;</td>
            <td colSpan="24" rowSpan="3">&nbsp;</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">2</td>
            <td colSpan="34">Any other Recovery or Pay</td>
            <td colSpan="34">&nbsp;</td>
          </tr>
          <tr>
            <td colSpan="8" className="center">3</td>
            <td colSpan="34">Abroad Agreement Recovery</td>
            <td colSpan="34">&nbsp;</td>
          </tr>

          <tr>
            <td colSpan="100" style={{ height: '32px', verticalAlign: 'top' }}>Remarks: {remarks}</td>
          </tr>
          <tr className="footer-row">
            <td colSpan="100" className="headhr" style={{ height: '55px', verticalAlign: 'bottom' }}>Head-HR</td>
          </tr>
        </tbody>
      </table>

      <div className="page-footer">
        <span></span>
        <span className="company">Greentech Industries(India) Pvt. Ltd.@HR 09.06.2025 by Rambabu J</span>
        <span className="headcode">HR-048-4</span>
      </div>

    </div>
  );
}