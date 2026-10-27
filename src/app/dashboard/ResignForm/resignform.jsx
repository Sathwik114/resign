'use client';

import React, { useState } from 'react';

const EXIT_RECORD_BULLET = '➤ ';

function getDynamicFontSize(text, baseSize = 13, maxLen = 18) {
  if (!text) return `${baseSize}px`;
  if (text.length <= maxLen) return `${baseSize}px`;
  const calculated = Math.floor(baseSize * (maxLen / text.length));
  return `${Math.max(calculated, 9.5)}px`;
}

export default function ResignForm({ employee, onClose, onFormChange, savedData }) {
  // Helper to extract date parts
  const getJoinDateParts = (dateStr) => {
    if (!dateStr) return { dd: '', mm: '', yyyy: '' };
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return { dd: parts[2], mm: parts[1], yyyy: parts[0] };
      }
    } catch (e) {}
    return { dd: '', mm: '', yyyy: '' };
  };

  const getDolParts = (dateStr) => {
    if (!dateStr) return { dd: '', mm: '', yyyy: '' };
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return { dd: parts[2], mm: parts[1], yyyy: parts[0] };
      }
    } catch (e) {}
    return { dd: '', mm: '', yyyy: '' };
  };

  const getTodayDateParts = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = String(today.getFullYear());
    return { dd, mm, yyyy };
  };

  // Prefill parser
  const norm = (employee?.REASON || '').toUpperCase().trim();
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
  };

  const initialJoin = getJoinDateParts(employee?.JOINDATE);
  const initialDol = getDolParts(employee?.DOL);
  const today = getTodayDateParts();

  // State Declarations
  const [empName, setEmpName] = useState(savedData ? savedData.empName : (employee?.EMPNAME || ''));
  const [empCode, setEmpCode] = useState(savedData ? savedData.empCode : (employee?.EMPCODE || ''));
  const [desig, setDesig] = useState(savedData ? savedData.desig : (employee?.DESIGNAME || employee?.DESIG || ''));
  const [nsecCode, setNsecCode] = useState(savedData ? savedData.nsecCode : (employee?.NSECTION || employee?.NSECCODE || ''));
  const [deptCode, setDeptCode] = useState(savedData ? savedData.deptCode : (employee?.DEPTNAME || employee?.DEPTCODE || ''));

  const [joinDd, setJoinDd] = useState(savedData ? savedData.joinDd : initialJoin.dd);
  const [joinMm, setJoinMm] = useState(savedData ? savedData.joinMm : initialJoin.mm);
  const [joinYyyy, setJoinYyyy] = useState(savedData ? savedData.joinYyyy : initialJoin.yyyy);

  const [dolDd, setDolDd] = useState(savedData ? savedData.dolDd : initialDol.dd);
  const [dolMm, setDolMm] = useState(savedData ? savedData.dolMm : initialDol.mm);
  const [dolYyyy, setDolYyyy] = useState(savedData ? savedData.dolYyyy : initialDol.yyyy);

  const [appDd, setAppDd] = useState(savedData ? savedData.appDd : today.dd);
  const [appMm, setAppMm] = useState(savedData ? savedData.appMm : today.mm);
  const [appYyyy, setAppYyyy] = useState(savedData ? savedData.appYyyy : today.yyyy);

  const [voluntaryResign, setVoluntaryResign] = useState(savedData ? savedData.voluntaryResign : false);
  const [longAbsentRemoved, setLongAbsentRemoved] = useState(savedData ? savedData.longAbsentRemoved : false);

  const initialAbroadFrom = getJoinDateParts(employee?.AGRPERIFROM);
  const initialAbroadTo = getJoinDateParts(employee?.AGRPERITO);

  const [abroadYes, setAbroadYes] = useState(savedData ? savedData.abroadYes : !!employee?.SERBIA_EMPCODE);
  const [abroadNo, setAbroadNo] = useState(savedData ? savedData.abroadNo : !employee?.SERBIA_EMPCODE);
  const [abroadFromDd, setAbroadFromDd] = useState(savedData ? savedData.abroadFromDd : initialAbroadFrom.dd);
  const [abroadFromMm, setAbroadFromMm] = useState(savedData ? savedData.abroadFromMm : initialAbroadFrom.mm);
  const [abroadFromYyyy, setAbroadFromYyyy] = useState(savedData ? savedData.abroadFromYyyy : initialAbroadFrom.yyyy);
  const [abroadToDd, setAbroadToDd] = useState(savedData ? savedData.abroadToDd : initialAbroadTo.dd);
  const [abroadToMm, setAbroadToMm] = useState(savedData ? savedData.abroadToMm : initialAbroadTo.mm);
  const [abroadToYyyy, setAbroadToYyyy] = useState(savedData ? savedData.abroadToYyyy : initialAbroadTo.yyyy);

  const [reasons, setReasons] = useState(savedData ? savedData.reasons : prefilledReasonMap);
  const [othersExplain, setOthersExplain] = useState(savedData ? savedData.othersExplain : '');
  const [exitRecordText, setExitRecordText] = useState(
    savedData?.exitRecordText || EXIT_RECORD_BULLET
  );
  const [interviewDd, setInterviewDd] = useState(savedData ? savedData.interviewDd : today.dd);
  const [interviewMm, setInterviewMm] = useState(savedData ? savedData.interviewMm : today.mm);
  const [interviewYyyy, setInterviewYyyy] = useState(savedData ? savedData.interviewYyyy : today.yyyy);
  const [remarks, setRemarks] = useState(savedData ? savedData.remarks : '');

  if (!employee) return null;

  const handleClose = () => {
    if (onFormChange) {
      onFormChange(employee.EMPCODE, {
        empName, empCode, desig, nsecCode, deptCode,
        joinDd, joinMm, joinYyyy, dolDd, dolMm, dolYyyy,
        appDd, appMm, appYyyy, voluntaryResign, longAbsentRemoved,
        abroadYes, abroadNo, abroadFromDd, abroadFromMm, abroadFromYyyy,
        abroadToDd, abroadToMm, abroadToYyyy, reasons, othersExplain, exitRecordText,
        interviewDd, interviewMm, interviewYyyy, remarks
      });
    }
    onClose();
  };

  const handleExitRecordKeyDown = (event) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;
    const nextText =
      value.slice(0, selectionStart) +
      `\n${EXIT_RECORD_BULLET}` +
      value.slice(selectionEnd);
    setExitRecordText(nextText);

    requestAnimationFrame(() => {
      const caretPosition = selectionStart + 1 + EXIT_RECORD_BULLET.length;
      textarea.setSelectionRange(caretPosition, caretPosition);
    });
  };

  const toggleReason = (key) => {
    setReasons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col h-[90vh] print:h-auto print:shadow-none print:rounded-none">
        <div className="flex-none px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl no-print">
          <div className="flex flex-col">
            <h3 className="font-extrabold text-slate-800 leading-tight">Printable Resignation Form Preview</h3>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Auto-saved locally</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>🖨️</span> Print / Save as PDF
            </button>
            <button
              onClick={handleClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-hidden bg-slate-100 print:bg-white">
          <div className="print-sheet mx-auto font-sans text-xs text-slate-900 bg-white" style={{ width: '210mm', maxWidth: '100%', padding: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}>

            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 6mm;
                }
                html, body {
                  width: 100% !important;
                  height: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden !important;
                  background: #fff !important;
                }
                .print-sheet {
                  width: 100% !important;
                  height: 284mm !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  box-sizing: border-box !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: flex-start !important;
                  overflow: hidden !important;
                }
                body * {
                  visibility: hidden !important;
                }
                .print-sheet, .print-sheet * {
                  visibility: visible !important;
                }
                .print\\:hidden, .no-print, .no-print * {
                  display: none !important;
                  visibility: hidden !important;
                  height: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden !important;
                }
                .print-sheet h1 {
                  margin-top: 0 !important;
                }
                .print-sheet textarea {
                  height: 145px !important;
                }
                .print-sheet .footer-row td {
                  height: 55px !important;
                  padding-bottom: 4px !important;
                }
                .print-sheet > div:first-of-type {
                  margin-top: 0 !important;
                  padding-top: 0 !important;
                  flex: 0 0 auto !important;
                  min-height: auto !important;
                  overflow: visible !important;
                }
                .print-sheet .page-footer {
                  flex: 0 0 auto !important;
                  margin-top: 4px !important;
                }
              }

              .print-sheet {
                font-family: Arial, Helvetica, sans-serif !important;
                font-size: 12px !important;
                color: #000000 !important;
                background-color: #ffffff !important;
                box-sizing: border-box !important;
              }
              .print-sheet h1 {
                text-align: center;
                font-size: 17px;
                font-weight: bold;
                margin: 0 0 3px 0;
              }
              .print-sheet .subtitle {
                text-align: center;
                font-size: 11.5px;
                font-weight: normal;
                color: #000;
                margin: 0 0 8px 0;
              }
              .print-sheet table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
                margin-top: -1px;
              }
              .print-sheet td, .print-sheet th {
                border: 1px solid #000000 !important;
                padding: 5.9px 8px !important;
                vertical-align: top;
                font-size: 12px;
                line-height: 1.35;
              }
              /* Employee Name / ID / Designation / Section / Department header
                 row and the input row directly below it should read as one
                 continuous cell — no divider between the label and the value,
                 only the vertical column lines. !important is required here
                 because it must beat the generic td border rule above. */
              .print-sheet .emp-header-row td {
                border-bottom: none !important;
                padding: 3px 4px !important;
              }
              .print-sheet .emp-data-row td {
                border-top: none !important;
                padding: 2px 4px 4px !important;
              }
              .print-sheet .emp-data-row .plain-input {
                height: 16px;
                font-weight: bold;
              }
              .print-sheet .section-title {
                text-align: center;
                font-weight: bold;
                background: #ffffff;
                font-size: 12.5px;
              }
              .print-sheet .cb {
                display: inline-flex;
                align-items: center;
                gap: 3px;
                white-space: nowrap;
                cursor: pointer;
                font-size: 10.5px;
              }
              .print-sheet .cb input[type="checkbox"] {
                width: 13px;
                height: 13px;
                margin: 0;
                cursor: pointer;
              }
              .print-sheet .date-cell {
                padding: 6px 8px !important;
                text-align: center;
              }
              .print-sheet .date-label {
                font-size: 10.5px;
                font-weight: bold;
                margin-bottom: 4px;
                white-space: nowrap;
              }
              .print-sheet .date-inputs {
                display: inline-flex;
                align-items: center;
                gap: 3px;
                border-bottom: 1px solid #000;
                padding-bottom: 1px;
              }
              .print-sheet .date-inputs input[type="text"] {
                border: none;
                border-bottom: none;
                width: 24px;
                text-align: center;
                font-size: 12px;
                padding: 0;
                background: transparent;
              }
              .print-sheet .date-inputs input.year {
                width: 38px;
              }
              .print-sheet .reasons-td {
                padding: 6px 16px 6px 8px !important;
              }
              .print-sheet .reasons-grid {
                display: grid;
                grid-template-columns: 28% 18% 28% 26%;
                gap: 5px 6px;
                margin-bottom: 6px;
              }
              .print-sheet .others-line {
                border: none;
                border-bottom: 1px solid #000;
                width: 100%;
                font-size: 12px;
                padding: 2px 0;
                background: transparent;
              }
              .print-sheet .center { text-align: center; }
              .print-sheet .sig-row td { 
                height: 38px !important; 
                text-align: top; 
                font-weight: bold; 
                vertical-align: top !important; 
                padding-top: 1px !important;
              }
              .print-sheet .hr-title {
                text-align: center;
                font-weight: bold;
                background: #ffffff;
                font-size: 12.5px;
              }
              .print-sheet .doc-header td {
                font-weight: bold;
                background: #f5f5f5;
                padding: 4px 8px !important;
              }
              /* Documents/Assets handover rows — compact padding + tighter
                 line-height so this whole block (General Affairs through
                 HR Department) takes noticeably less vertical space,
                 freeing room for a taller Exit Interview Record above. */
              .print-sheet .asset-row td {
                padding: 4.5px 8px !important;
                line-height: 1.3 !important;
                font-size: 12px;
              }
              .print-sheet .cat-row td {
                font-weight: bold;
                color: #000;
                background: #fafafa;
                padding: 4px 8px !important;
                font-size: 12px;
              }
              .print-sheet .footer-row td {
                font-size: 10px;
                vertical-align: bottom;
              }
              .print-sheet .headhr {
                font-weight: bold;
                text-align: right;
                font-size: 12px !important;
              }
              .print-sheet .page-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 11px;
                margin-top: 10px;
              }
              .print-sheet .plain-input {
                border: none;
                font-size: 12px;
                width: 100% !important;
                box-sizing: border-box;
                background: transparent;
              }
            `}</style>

            {/* Top Form Content */}
            <div>
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
                    <td colSpan="18" style={{ textAlign: 'center', fontWeight: 'bold' }}>Employee ID No.</td>
                    <td colSpan="18" style={{ textAlign: 'center', fontWeight: 'bold' }}>Designation</td>
                    <td colSpan="18" style={{ textAlign: 'center', fontWeight: 'bold' }}>Section</td>
                    <td colSpan="18" style={{ textAlign: 'center', fontWeight: 'bold' }}>Department</td>
                  </tr>
                  <tr className="emp-data-row">
                    <td colSpan="28" style={{ height: '24px' }}>
                      <input className="plain-input" type="text" value={empName} onChange={(e) => setEmpName(e.target.value)} style={{ fontSize: getDynamicFontSize(empName, 13, 24) }} />
                    </td>
                    <td colSpan="18">
                      <input className="plain-input" style={{ textAlign: 'center', fontSize: '13px' }} type="text" value={empCode} onChange={(e) => setEmpCode(e.target.value)} />
                    </td>
                    <td colSpan="18">
                      <input className="plain-input" style={{ fontSize: getDynamicFontSize(desig, 13, 18) }} type="text" value={desig} onChange={(e) => setDesig(e.target.value)} />
                    </td>
                    <td colSpan="18">
                      <input className="plain-input" style={{ fontSize: getDynamicFontSize(nsecCode, 13, 18) }} type="text" value={nsecCode} onChange={(e) => setNsecCode(e.target.value)} />
                    </td>
                    <td colSpan="18">
                      <input className="plain-input" style={{ fontSize: getDynamicFontSize(deptCode, 13, 18) }} type="text" value={deptCode} onChange={(e) => setDeptCode(e.target.value)} />
                    </td>
                  </tr>

                  {/* SECOND ROW TABLE FIELDS */}
                  <tr>
                    <td colSpan="25" className="date-cell">
                      <div className="date-label">Date of Joining (DD/MM/YYYY)</div>
                      <div className="date-inputs">
                        <input type="text" value={joinDd} onChange={(e) => setJoinDd(e.target.value)} />
                        <span>/</span>
                        <input type="text" value={joinMm} onChange={(e) => setJoinMm(e.target.value)} />
                        <span>/</span>
                        <input type="text" className="year" value={joinYyyy} onChange={(e) => setJoinYyyy(e.target.value)} />
                      </div>
                    </td>
                    <td colSpan="25" className="date-cell">
                      <div className="date-label">Date of leaving (DD/MM/YYYY)</div>
                      <div className="date-inputs">
                        <input type="text" value={dolDd} onChange={(e) => setDolDd(e.target.value)} />
                        <span>/</span>
                        <input type="text" value={dolMm} onChange={(e) => setDolMm(e.target.value)} />
                        <span>/</span>
                        <input type="text" className="year" value={dolYyyy} onChange={(e) => setDolYyyy(e.target.value)} />
                      </div>
                    </td>
                    <td colSpan="25" className="date-cell" style={{ verticalAlign: 'middle', textAlign: 'left' }}>
                      <label className="cb">
                        <input type="checkbox" checked={voluntaryResign} onChange={(e) => { setVoluntaryResign(e.target.checked); if (e.target.checked) setLongAbsentRemoved(false); }} /> Voluntary resign
                      </label>
                      <br />
                      <label className="cb" style={{ marginTop: '3px' }}>
                        <input type="checkbox" checked={longAbsentRemoved} onChange={(e) => { setLongAbsentRemoved(e.target.checked); if (e.target.checked) setVoluntaryResign(false); }} /> Long Absent removed
                      </label>
                    </td>
                    <td colSpan="25" className="date-cell">
                      <div className="date-label">Application Date (DD/MM/YYYY)</div>
                      <div className="date-inputs">
                        <input type="text" value={appDd} onChange={(e) => setAppDd(e.target.value)} />
                        <span>/</span>
                        <input type="text" value={appMm} onChange={(e) => setAppMm(e.target.value)} />
                        <span>/</span>
                        <input type="text" className="year" value={appYyyy} onChange={(e) => setAppYyyy(e.target.value)} />
                      </div>
                    </td>
                  </tr>

                  {/* Worked Abroad Row */}
                  <tr>
                    <td colSpan="100">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: '70px' }}>
                        <div>
                          Worked in Serbia / Abroad:
                          <label className="cb" style={{ marginLeft: '10px' }}>
                            <input type="checkbox" checked={abroadYes} onChange={(e) => { setAbroadYes(e.target.checked); if (e.target.checked) setAbroadNo(false); }} /> Yes
                          </label>
                          <label className="cb" style={{ marginLeft: '6px' }}>
                            <input type="checkbox" checked={abroadNo} onChange={(e) => { setAbroadNo(e.target.checked); if (e.target.checked) setAbroadYes(false); }} /> No
                          </label>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          if Yes, Period From:
                          <span className="date-inputs" style={{ display: 'inline-flex' }}>
                            <input type="text" value={abroadFromDd} onChange={(e) => setAbroadFromDd(e.target.value)} />
                            <span>/</span>
                            <input type="text" value={abroadFromMm} onChange={(e) => setAbroadFromMm(e.target.value)} />
                            <span>/</span>
                            <input type="text" className="year" value={abroadFromYyyy} onChange={(e) => setAbroadFromYyyy(e.target.value)} />
                          </span>
                          &nbsp; To:
                          <span className="date-inputs" style={{ display: 'inline-flex' }}>
                            <input type="text" value={abroadToDd} onChange={(e) => setAbroadToDd(e.target.value)} />
                            <span>/</span>
                            <input type="text" value={abroadToMm} onChange={(e) => setAbroadToMm(e.target.value)} />
                            <span>/</span>
                            <input type="text" className="year" value={abroadToYyyy} onChange={(e) => setAbroadToYyyy(e.target.value)} />
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* Resignation Reasons Checkboxes Grid */}
                  <tr>
                    <td colSpan="25" style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold' }}>Reasons for Resignation</td>
                    <td colSpan="75" className="reasons-td">
                      <div className="reasons-grid">
                        <label className="cb"><input type="checkbox" checked={!!reasons.furtherPlan} onChange={() => toggleReason('furtherPlan')} /> Further Plan</label>
                        <label className="cb"><input type="checkbox" checked={!!reasons.health} onChange={() => toggleReason('health')} /> Health</label>
                        <label className="cb"><input type="checkbox" checked={!!reasons.salary} onChange={() => toggleReason('salary')} /> Dissatisfaction of Salary</label>
                        <label className="cb"><input type="checkbox" checked={!!reasons.family} onChange={() => toggleReason('family')} /> Family Responsibility</label>

                        <label className="cb"><input type="checkbox" checked={!!reasons.management} onChange={() => toggleReason('management')} /> Management</label>
                        <label className="cb"><input type="checkbox" checked={!!reasons.marriage} onChange={() => toggleReason('marriage')} /> Marriage</label>
                        <label className="cb"><input type="checkbox" checked={!!reasons.personal} onChange={() => toggleReason('personal')} /> Personal Reasons</label>
                        <label className="cb"><input type="checkbox" checked={!!reasons.interest} onChange={() => toggleReason('interest')} /> Interest Deviation</label>

                        <label className="cb"><input type="checkbox" checked={!!reasons.betterCareer} onChange={() => toggleReason('betterCareer')} /> Better Career opportunity</label>
                        <label className="cb"><input type="checkbox" checked={!!reasons.transportation} onChange={() => toggleReason('transportation')} /> Transportation</label>
                        <label className="cb"><input type="checkbox" checked={!!reasons.education} onChange={() => toggleReason('education')} /> Education</label>
                        <label className="cb"><input type="checkbox" checked={!!reasons.others} onChange={() => toggleReason('others')} /> Others (Please Explain)</label>
                      </div>
                      <div>
                        <input
                          type="text"
                          className="others-line"
                          value={othersExplain}
                          onChange={(e) => {
                            setOthersExplain(e.target.value);
                            if (!reasons.others && e.target.value !== '') {
                              setReasons((prev) => ({ ...prev, others: true }));
                            }
                          }}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* Signatures pinned to top of cell */}
                  <tr className="sig-row">
                    <td colSpan="20"><center>Applicant Signature</center></td>
                    <td colSpan="40"><center>Team Leader</center></td>
                    <td colSpan="20"><center>Section Head</center></td>
                    <td colSpan="20"><center>HOD</center></td>
                  </tr>

                  {/* Exit Interview Record Section */}
                  <tr>
                    <td colSpan="100" className="hr-title">HR EXIT INTERVIEW RECORD</td>
                  </tr>
                  <tr>
                    <td colSpan="100">
                      <textarea
                        className="plain-input"
                        value={exitRecordText}
                        onChange={(e) => setExitRecordText(e.target.value)}
                        onKeyDown={handleExitRecordKeyDown}
                        onFocus={(e) => {
                          if (exitRecordText === EXIT_RECORD_BULLET && e.target.selectionStart === 0) {
                            e.target.setSelectionRange(EXIT_RECORD_BULLET.length, EXIT_RECORD_BULLET.length);
                          }
                        }}
                        style={{ width: '100%', height: '220px', resize: 'none', fontSize: '16px' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="100" style={{ textAlign: 'left', padding: '6px 8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' , paddingRight: '130px' }}>
                        <span>Interviewer Signature:</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          Date:
                          <span className="date-inputs" style={{ display: 'inline-flex', marginLeft: '4px' }}>
                            <input type="text" value={interviewDd} onChange={(e) => setInterviewDd(e.target.value)} style={{ width: '20px' }} />
                            <span>/</span>
                            <input type="text" value={interviewMm} onChange={(e) => setInterviewMm(e.target.value)} style={{ width: '20px' }} />
                            <span>/</span>
                            <input type="text" className="year" value={interviewYyyy} onChange={(e) => setInterviewYyyy(e.target.value)} style={{ width: '34px' }} />
                          </span>
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Asset Handover Header */}
                  <tr>
                    <td colSpan="100" className="section-title">List Of Documents/ Assets To Hand Over</td>
                  </tr>

                  {/* Asset Handover Table Header */}
                  <tr className="doc-header">
                    <td colSpan="8" style={{ textAlign: 'center' }}>S.No</td>
                    <td colSpan="34" style={{ textAlign: 'center' }}>Documents / Assets</td>
                    <td colSpan="34" style={{ textAlign: 'center' }}>Returned / Deactivated</td>
                    <td colSpan="24" style={{ textAlign: 'center' }}>Signature of HOS / HOD</td>
                  </tr>

                  {/* Asset handover rows — compact via .asset-row / .cat-row CSS above */}
                  <tr className="cat-row"><td colSpan="100">General Affairs</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">1</td><td colSpan="34">Uniform</td><td colSpan="34">&nbsp;</td><td colSpan="24" rowSpan="5">&nbsp;</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">2</td><td colSpan="34">PPE&apos;s</td><td colSpan="34">&nbsp;</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">3</td><td colSpan="34">Cloak Room Keys</td><td colSpan="34">&nbsp;</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">4</td><td colSpan="34">Dormitory Clearance</td><td colSpan="34">&nbsp;</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">5</td><td colSpan="34">Others</td><td colSpan="34">&nbsp;</td></tr>

                  <tr className="cat-row"><td colSpan="100">Security Office</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">1</td><td colSpan="34">Security clearance</td><td colSpan="34">&nbsp;</td><td colSpan="24">&nbsp;</td></tr>

                  <tr className="cat-row"><td colSpan="100">HSE Department</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">1</td><td colSpan="34">HSE Deductions</td><td colSpan="34">&nbsp;</td><td colSpan="24" rowSpan="2">&nbsp;</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">2</td><td colSpan="34">Any other (Please Specify)</td><td colSpan="34">&nbsp;</td></tr>

                  <tr className="cat-row"><td colSpan="100">HR Department</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">1</td><td colSpan="34">I.D Cards, Business Cards &amp; SEZ ID Card</td><td colSpan="34">&nbsp;</td><td colSpan="24" rowSpan="3">&nbsp;</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">2</td><td colSpan="34">Any other Recovery or Pay</td><td colSpan="34">&nbsp;</td></tr>
                  <tr className="asset-row"><td colSpan="8" className="center">3</td><td colSpan="34">Abroad Agreement Recovery</td><td colSpan="34">&nbsp;</td></tr>

                  <tr className="asset-row">
                    <td colSpan="100" style={{ height: '18px', verticalAlign: 'middle', padding: '2.5px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Remarks:</span>
                        <input
                          type="text"
                          className="plain-input"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder=" "
                          style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, padding: 0 }}
                        />
                      </div>
                    </td>
                  </tr>
                  <tr className="footer-row">
                    <td colSpan="100" className="headhr" style={{ height: '55px', verticalAlign: 'bottom' }}>Head-HR</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Document Footer */}
            <div className="page-footer">
              <span></span>
              <span className="company">Greentech Industries(India) Pvt. Ltd.@HR 09.06.2025 by Rambabu J</span>
              <span className="headcode">HR-048-4</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}