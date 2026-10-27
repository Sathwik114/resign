import { useState } from "react";

const EXIT_RECORD_BULLET = "➤ ";

const REASONS_GRID = [
  ["Further Plan", "Health", "Dissatisfaction of Salary", "Family Responsibility"],
  ["Management", "Marriage", "Personal Reasons", "Interest Deviation"],
  ["Better Career opportunity", "", "Transportation", "Education"],
];

// Print-only rules: page size, safe margins (fixes the top line being cut off)
const PRINT_CSS = `
@media print {
  @page {
    size: A4 portrait;
    margin: 12mm 10mm 8mm 10mm; /* top right bottom left */
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  input, textarea {
    color: #000 !important;
  }
}
`;

const cell = "border border-neutral-600 px-2 py-1.5";
const label = "text-[11px] text-neutral-800 font-bold";
const blankInput =
  "border-0 bg-transparent focus:outline-none text-sm px-1 w-full";

function Checkbox({ text, checked, onChange, className = "" }) {
  return (
    <label className={`flex items-center gap-1.5 text-[12px] text-neutral-900 cursor-pointer whitespace-nowrap ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer"
      />
      {text}
    </label>
  );
}

function getDynamicFontSize(text, baseSize = 14, maxLen = 14) {
  if (!text) return `${baseSize}px`;
  if (text.length <= maxLen) return `${baseSize}px`;
  const calculated = Math.floor(baseSize * (maxLen / text.length));
  return `${Math.max(calculated, 9)}px`;
}

function AutoField({ fieldLabel, value, onChange }) {
  const isEmployeeId = fieldLabel === "Employee ID No";

  return (
    <div className={`${cell} h-16 flex flex-col justify-center`}>
      <div className={`${label} text-center`}>{fieldLabel}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontSize: getDynamicFontSize(value, 14, 14) }}
        className={`border-0 bg-transparent focus:outline-none px-1 w-full ${isEmployeeId ? "text-center" : "text-left"}`}
      />
    </div>
  );
}

function DateBoxes({ value, onChange }) {
  // value = {d:"", m:"", y:""}
  return (
    <span className="inline-flex items-center gap-1">
      <input
        maxLength={2}
        value={value.d}
        onChange={(e) => onChange({ ...value, d: e.target.value })}
        className="w-6 border-0 border-b border-neutral-600 bg-transparent text-center text-sm focus:outline-none"
      />
      <span>/</span>
      <input
        maxLength={2}
        value={value.m}
        onChange={(e) => onChange({ ...value, m: e.target.value })}
        className="w-6 border-0 border-b border-neutral-600 bg-transparent text-center text-sm focus:outline-none"
      />
      <span>/</span>
      <input
        maxLength={4}
        value={value.y}
        onChange={(e) => onChange({ ...value, y: e.target.value })}
        className="w-10 border-0 border-b border-neutral-600 bg-transparent text-center text-sm focus:outline-none"
      />
    </span>
  );
}

function dateToBoxes(value) {
  if (!value) return { d: "", m: "", y: "" };
  const [year, month, day] = String(value).split("T")[0].split("-");
  return {
    d: day || "",
    m: month || "",
    y: year || "",
  };
}

function todayToBoxes() {
  const today = new Date();
  return {
    d: String(today.getDate()).padStart(2, "0"),
    m: String(today.getMonth() + 1).padStart(2, "0"),
    y: String(today.getFullYear()),
  };
}

function employeeText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export default function ResignationFormExact({ employee }) {
  const [employeeName, setEmployeeName] = useState(() => employeeText(employee?.EMPNAME));
  const [employeeId, setEmployeeId] = useState(() => employeeText(employee?.EMPCODE));
  const [designation, setDesignation] = useState(() => employeeText(employee?.DESIGNAME));
  const [department, setDepartment] = useState(() => employeeText(employee?.DEPTNAME));
  const [section, setSection] = useState(() => employeeText(employee?.NSECTION));

  const [joining, setJoining] = useState(() => dateToBoxes(employee?.JOINDATE));
  const [leaving, setLeaving] = useState(() => dateToBoxes(employee?.DOL));

  const hasSerbiaDetails = Boolean(employee?.SERBIA_EMPCODE);
  const [worked, setWorked] = useState({ yes: hasSerbiaDetails, no: !hasSerbiaDetails });
  const [periodFrom, setPeriodFrom] = useState(() => dateToBoxes(employee?.AGRPERIFROM));
  const [periodTo, setPeriodTo] = useState(() => dateToBoxes(employee?.AGRPERITO));

  const [reasons, setReasons] = useState({});
  const [other, setOther] = useState(false);
  const [otherText, setOtherText] = useState("");

  const [appDate, setAppDate] = useState(todayToBoxes);

  const [exitNotes, setExitNotes] = useState(EXIT_RECORD_BULLET);
  const [interviewerDate, setInterviewerDate] = useState({ d: "", m: "", y: "" });

  const [deptRemarks, setDeptRemarks] = useState("");

  const [noticePeriod, setNoticePeriod] = useState({ yes: false, no: false });
  const [noticeDays, setNoticeDays] = useState("");
  const [noticeAmount, setNoticeAmount] = useState("");

  const [abroadAgreement, setAbroadAgreement] = useState({ yes: false, no: false });
  const [recoveryAmount, setRecoveryAmount] = useState("");

  const [remarks, setRemarks] = useState("");

  const toggleReason = (r) => setReasons((p) => ({ ...p, [r]: !p[r] }));

  const handleExitNotesKeyDown = (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;
    const nextText =
      value.slice(0, selectionStart) +
      `\n${EXIT_RECORD_BULLET}` +
      value.slice(selectionEnd);
    setExitNotes(nextText);

    requestAnimationFrame(() => {
      const caretPosition = selectionStart + 1 + EXIT_RECORD_BULLET.length;
      textarea.setSelectionRange(caretPosition, caretPosition);
    });
  };

  return (
    <div className="min-h-screen bg-neutral-200 py-8 px-2 flex justify-center font-sans print:min-h-0 print:bg-white print:pt-[8mm] print:pb-0 print:px-0">
      <style>{PRINT_CSS}</style>

      <div className="w-full max-w-[850px] bg-white text-black text-sm print:w-[188mm] print:max-w-none print:mx-auto print:break-inside-avoid">
        {/* Title */}
        <div className="text-center border-b border-neutral-600 py-2">
          <h1 className="text-lg font-bold">Resignation Application Form</h1>
          <p className="text-[10px] mt-0.5">
            We are following "IATF 16949 CAPD method 10.3 Continuous Improvement Spirit" to improve our GTI
          </p>
        </div>

        {/* Header row: names/ids */}
        <div className="grid grid-cols-5">
          <AutoField fieldLabel="Employee Name" value={employeeName} onChange={setEmployeeName} />
          <AutoField fieldLabel="Employee ID No" value={employeeId} onChange={setEmployeeId} />
          <AutoField fieldLabel="Designation" value={designation} onChange={setDesignation} />
          <AutoField fieldLabel="Department" value={department} onChange={setDepartment} />
          <AutoField fieldLabel="Section" value={section} onChange={setSection} />
        </div>

        {/* Joining / Leaving */}
        <div className="grid grid-cols-2 border-t-0">
          <div className={`${cell} h-12 flex items-center gap-2`}>
            <span>Date of Joining :</span>
            <DateBoxes value={joining} onChange={setJoining} />
          </div>
          <div className={`${cell} h-12 flex items-center gap-2`}>
            <span>Date of leaving :</span>
            <DateBoxes value={leaving} onChange={setLeaving} />
          </div>
        </div>

        {/* Worked abroad */}
        <div className={`${cell} h-14 flex flex-nowrap items-center gap-2 whitespace-nowrap text-[11px] print:text-[10px]`}>
          <span>Worked in Serbia / Abroad</span>
          <Checkbox
            text="Yes"
            checked={worked.yes}
            onChange={(v) => setWorked({ yes: v, no: v ? false : worked.no })}
          />
          <Checkbox
            text="No"
            checked={worked.no}
            onChange={(v) => setWorked({ no: v, yes: v ? false : worked.yes })}
          />
          <span>If Yes, Period From :</span>
          <DateBoxes value={periodFrom} onChange={setPeriodFrom} />
          <span>To :</span>
          <DateBoxes value={periodTo} onChange={setPeriodTo} />
        </div>

        {/* Reasons for resignation */}
        <div className="grid" style={{ gridTemplateColumns: "175px 1fr" }}>
          <div className={`${cell} flex items-center justify-center whitespace-nowrap`}>Reasons for Resignation</div>
          <div className={`${cell} pr-1`}>
            {/* Same 4-column layout spread across the row; columns fit their text, with a minimum gap between them */}
            <div
              className="grid gap-y-3 gap-x-4 justify-between"
              style={{ gridTemplateColumns: "repeat(4, max-content)" }}
            >
              {REASONS_GRID.flat().map((r, i) =>
                r ? (
                  <Checkbox
                    key={i}
                    text={r}
                    checked={!!reasons[r]}
                    onChange={() => toggleReason(r)}
                    className="print:text-[11px]"
                  />
                ) : (
                  <span key={i} />
                )
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Checkbox text="Other  (Please Explain)" checked={other} onChange={setOther} />
            </div>
            <input
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              disabled={!other}
              className="mt-2 w-full border-0 border-b border-neutral-600 bg-transparent text-sm focus:outline-none disabled:bg-neutral-50 print:disabled:bg-transparent"
            />
          </div>
        </div>

        {/* Application date / signature */}
        <div className="border border-neutral-600 px-2 py-1.5 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DateBoxes value={appDate} onChange={setAppDate} />
            </div>
            <div className="text-sm text-neutral-800 mt-1 font-bold">Application Date</div>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-40 h-6" />
            <span className="mt-1 font-bold">Applicant Signature</span>
          </div>
        </div>

        {/* Exit interview header */}
        <div className={`${cell} flex items-center justify-center font-medium py-2`}>
          EXIT INTERVIEW RECORD BY HR
        </div>

        {/* Exit interview body */}
        <div className="grid" style={{ gridTemplateColumns: "1fr 160px" }}>
          {/* min-height is a class (not inline style) so the print: variant can override it */}
          <div className={`${cell} min-h-[240px] print:min-h-[190px]`}>
            <textarea
              value={exitNotes}
              onChange={(e) => setExitNotes(e.target.value)}
              onKeyDown={handleExitNotesKeyDown}
              onFocus={(e) => {
                if (exitNotes === EXIT_RECORD_BULLET && e.target.selectionStart === 0) {
                  e.target.setSelectionRange(EXIT_RECORD_BULLET.length, EXIT_RECORD_BULLET.length);
                }
              }}
              className="w-full h-full border-0 bg-transparent text-base focus:outline-none resize-none"
            />
          </div>
          <div className={`${cell} flex flex-col justify-between text-xs`}>
            <div>
              <span className="whitespace-nowrap">Interviewer Signature</span>
              <span className="mt-1 mb-3 block h-20 w-full border-b border-neutral-600" />
            </div>
            <div>
              <span>Date</span>
              <div className="mt-1">
                <DateBoxes value={interviewerDate} onChange={setInterviewerDate} />
              </div>
            </div>
          </div>
        </div>

        {/* Department remarks */}
        <div className={cell}>
          <div className="font-bold">Remarks from Department (if any):</div>
          <input
            value={deptRemarks}
            onChange={(e) => setDeptRemarks(e.target.value)}
            className={`${blankInput} mt-2`}
          />
        </div>

        {/* Team leader / Section head / HOD */}
        <div className="grid grid-cols-3">
          <div className={`${cell} h-14 flex items-end justify-center pb-0`}>Team Leader</div>
          <div className={`${cell} h-14 flex items-end justify-center pb-0`}>Section Head</div>
          <div className={`${cell} h-14 flex items-end justify-center pb-0`}>HOD</div>
        </div>

        {/* Notice period / Abroad agreement */}
        <div className="grid grid-cols-2">
          <div className={cell}>
            <div className="flex items-center justify-center gap-4">
              <span>Notice Period</span>
              <Checkbox
                text="Yes"
                checked={noticePeriod.yes}
                onChange={(v) => setNoticePeriod({ yes: v, no: v ? false : noticePeriod.no })}
              />
              <Checkbox
                text="No"
                checked={noticePeriod.no}
                onChange={(v) => setNoticePeriod({ no: v, yes: v ? false : noticePeriod.yes })}
              />
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span>If Yes, Day(s)</span>
              <input
                value={noticeDays}
                onChange={(e) => setNoticeDays(e.target.value)}
                className="w-16 border-0 border-b border-neutral-600 bg-transparent text-sm focus:outline-none"
              />
              <span>Amount Rs.</span>
              <input
                value={noticeAmount}
                onChange={(e) => setNoticeAmount(e.target.value)}
                className="w-24 border-0 border-b border-neutral-600 bg-transparent text-sm focus:outline-none"
              />
              <span>/-</span>
            </div>
          </div>
          <div className={cell}>
            <div className="flex items-center gap-4">
              <span>Abroad Agreement</span>
              <Checkbox
                text="Yes"
                checked={abroadAgreement.yes}
                onChange={(v) =>
                  setAbroadAgreement({ yes: v, no: v ? false : abroadAgreement.no })
                }
              />
              <Checkbox
                text="No"
                checked={abroadAgreement.no}
                onChange={(v) =>
                  setAbroadAgreement({ no: v, yes: v ? false : abroadAgreement.yes })
                }
              />
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span>If Yes, Recovery amount Rs.</span>
              <input
                value={recoveryAmount}
                onChange={(e) => setRecoveryAmount(e.target.value)}
                className="w-24 border-0 border-b border-neutral-600 bg-transparent text-sm focus:outline-none"
              />
              <span>/-</span>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className={cell}>
          <div>Remarks</div>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full h-16 border-0 bg-transparent text-sm focus:outline-none resize-none overflow-hidden mt-1"
          />
        </div>

        {/* Footer */}
        <div className="border border-neutral-600 h-20 flex items-end justify-end pb-0 pr-2 font-medium">
          HEAD-HR
        </div>

        <div className="relative flex items-center justify-center px-2 py-2 text-[11px] italic text-neutral-700">
          <span>Greentech Industries (India) Pvt. Ltd. @ HR 09.06.2025 by Rambabu J</span>
          <span className="not-italic font-medium absolute right-2">HR-031-3</span>
        </div>
      </div>
    </div>
  );
}