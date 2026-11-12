'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ResignForm from './ResignForm/resignform';
import ResignFormPrintable from './ResignForm/ResignFormPrintable';
import StudentResignForm from './studentResignForm/StudentResignForm';
import StaffDueForm from './StaffResignForm/StaffDueForm';
import StaffResignForm from './StaffResignForm/StaffResignForm';

export default function EmployeeTable() {
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [active, setActive] = useState('Y'); // Load active workers by default
  const [workerType, setWorkerType] = useState(''); // Require the user to select a worker type
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectedEmployeeForForm, setSelectedEmployeeForForm] = useState(null);
  const [selectedStaffForm, setSelectedStaffForm] = useState(null);

  // Local storage/state for client-side modified forms (auto-save history)
  const [editedForms, setEditedForms] = useState({});

  // PDF generation state
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const printRefs = useRef({});

  const fetchEmployees = useCallback(async (selectedYear, selectedMonth, selectedActive, selectedType) => {
    if (!selectedType) {
      setEmployees([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setSelectedRows(new Set());
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(
        `/api/employees?year=${selectedYear}&month=${selectedMonth}&active=${selectedActive}&type=${selectedType}`,
        { signal: controller.signal, cache: 'no-store' },
      );
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Failed to retrieve employee data');
      }
      const result = await response.json();
      setEmployees(result.data || []);
    } catch (err) {
      setError(err.name === 'AbortError' ? 'The employee request timed out.' : err.message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active === 'Y') {
      void Promise.resolve().then(() => fetchEmployees(year, month, active, workerType));
    } else if (year && !isNaN(year) && String(year).length === 4) {
      void Promise.resolve().then(() => fetchEmployees(year, month, active, workerType));
    }
  }, [year, month, active, workerType, fetchEmployees]);

  const filteredEmployees = employees.filter((emp) => {
    const searchLower = search.toLowerCase();
    return (
      (emp.EMPCODE || '').toLowerCase().includes(searchLower) ||
      (emp.EMPNAME || '').toLowerCase().includes(searchLower) ||
      (emp.DESIGNAME || emp.DESIG || '').toLowerCase().includes(searchLower) ||
      (emp.DEPTNAME || emp.DEPTCODE || '').toLowerCase().includes(searchLower) ||
      (emp.NSECTION || emp.NSECCODE || '').toLowerCase().includes(searchLower) ||
      (emp.REASON || '').toLowerCase().includes(searchLower)
    );
  });

  const toggleSelectRow = (empCode) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(empCode)) {
        next.delete(empCode);
      } else {
        next.add(empCode);
      }
      return next;
    });
  };

  const allFilteredSelected =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedRows.has(emp.EMPCODE));

  const toggleSelectAll = () => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredEmployees.forEach((emp) => next.delete(emp.EMPCODE));
      } else {
        filteredEmployees.forEach((emp) => next.add(emp.EMPCODE));
      }
      return next;
    });
  };

  const handleFormChange = (empCode, updatedFormState) => {
    setEditedForms((prev) => ({
      ...prev,
      [empCode]: updatedFormState,
    }));
  };

  const openForm = (employee, formType = 'resign') => {
    setSelectedEmployeeForForm(employee);
    setSelectedStaffForm(formType);
  };

  // Employees currently selected, in table order — used both for the
  // off-screen printable render and for the PDF page order.
  const selectedEmployees = employees.filter((emp) => selectedRows.has(emp.EMPCODE));

  const handleDownloadSelected = async () => {
    if (selectedEmployees.length === 0) return;
    setPdfError(null);
    setGeneratingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < selectedEmployees.length; i++) {
        const emp = selectedEmployees[i];
        const node = printRefs.current[emp.EMPCODE];
        if (!node) continue;

        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });
        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
      }

      pdf.save(`Resignation_Forms_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setPdfError('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);
  const workerLabel = workerType === 'STUDENT'
    ? 'Student'
    : workerType === 'STAFF' ? 'Staff' : 'Operators';
  const statusLabel = active === 'Y' ? 'Active' : 'Resigned';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%' }}>

      <div className="no-print resignEmployeesToolbar">
        <div className="resignEmployeesTitle">
          {workerType ? `${statusLabel} ${workerLabel}` : 'Employees'}
        </div>

        <div className="resignEmployeesSummary">
          <div className="resignEmployeesMetric">
            <span>{statusLabel}</span><strong>{employees.length}</strong>
          </div>
          <div className="resignEmployeesMetric">
            <span>Showing</span><strong>{filteredEmployees.length}</strong>
          </div>
          <div className="resignEmployeesMetric">
            <span>Selected</span><strong>{selectedRows.size}</strong>
          </div>
        </div>

        <div className="resignEmployeesFilters">
          <div className="resignEmployeesFilter">
            <label htmlFor="worker-type-select">Type:</label>
            <select
              id="worker-type-select"
              value={workerType}
              onChange={(e) => setWorkerType(e.target.value)}
            >
              <option value="">Select Type</option>
              <option value="REG">Reg Worker</option>
              <option value="TEMP">Temp Worker</option>
              <option value="STUDENT">Student</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>

          <div className="resignEmployeesFilter">
            <label htmlFor="active-select">Active:</label>
            <select
              id="active-select"
              value={active}
              onChange={(e) => setActive(e.target.value)}
            >
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>

          {active !== 'Y' && (
            <div className="resignEmployeesFilter">
              <label htmlFor="year-input">Year:</label>
              <input
                id="year-input"
                type="number"
                value={year}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setYear(isNaN(val) ? '' : val);
                }}
              />
            </div>
          )}

          {active !== 'Y' && (
            <div className="resignEmployeesFilter">
              <label htmlFor="month-select">Month:</label>
              <select
                id="month-select"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="resignEmployeesFilter">
            <label htmlFor="search-input">Search:</label>
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Emp Code"
            />
          </div>
        </div>
      </div>

      {/* Normal Table */}
      <div className="no-print resignEmployeesTableWrap">
        {!workerType ? (
          <div className="resignEmployeesTableMessage">
            Please select a worker type to load employee records
          </div>
        ) : loading ? (
          <div className="resignEmployeesTableMessage">Loading...</div>
        ) : error ? (
          <div className="resignEmployeesTableMessage isError">
            <div>Error: {error}</div>
            <button type="button" onClick={() => fetchEmployees(year, month, active, workerType)}>
              Retry
            </button>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="resignEmployeesTableMessage">No records found</div>
        ) : (
          <table className="resignEmployeesTable">
            <thead>
              <tr>
                <th className="isCheckboxColumn">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Emp Code</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Section</th>
                <th>Join Date</th>
                <th>DOL</th>
                <th>Last Work Day</th>
                <th>Reason</th>
                <th className={`isActionColumn${workerType === 'STAFF' ? ' isStaff' : ''}`}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.EMPCODE}
                  className={selectedRows.has(emp.EMPCODE) ? 'isSelected' : ''}
                >
                  <td className="isCheckboxColumn">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(emp.EMPCODE)}
                      onChange={() => toggleSelectRow(emp.EMPCODE)}
                    />
                  </td>
                  <td className="isEmployeeCode">{emp.EMPCODE}</td>
                  <td className="isEmployeeName">{emp.EMPNAME}</td>
                  <td>{emp.DESIGNAME || emp.DESIG}</td>
                  <td>{emp.DEPTNAME || emp.DEPTCODE}</td>
                  <td>{emp.NSECTION || emp.NSECCODE}</td>
                  <td>{emp.JOINDATE || '-'}</td>
                  <td className="isLeavingDate">{emp.DOL || '-'}</td>
                  <td>{emp.LASTWRKDAY || '-'}</td>
                  <td>{emp.REASON || '-'}</td>
                  <td className="isActionColumn">
                    {workerType === 'STAFF' ? (
                      <div className="resignEmployeesActionButtons">
                        <button
                          onClick={() => openForm(emp, 'due')}
                        >
                          No Dues Form
                        </button>
                        <button
                          onClick={() => openForm(emp, 'resign')}
                        >
                          Resign Form
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openForm(emp)}
                      >
                        View Form
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Off-screen printable clones for every selected employee — kept in
          sync with the selection at all times so refs are ready to capture
          the instant the download button is pressed. */}
      <div style={{ position: 'fixed', top: 0, left: '-99999px', zIndex: -1, pointerEvents: 'none' }}>
        {selectedEmployees.map((emp) => (
          <div
            key={emp.EMPCODE}
            ref={(el) => { printRefs.current[emp.EMPCODE] = el; }}
          >
            {workerType === 'STUDENT' ? (
              <StudentResignForm employee={emp} />
            ) : workerType === 'STAFF' ? (
              <StaffDueForm employee={emp} savedData={editedForms[emp.EMPCODE]} isPrintable={true} />
            ) : (
              <ResignFormPrintable employee={emp} savedData={editedForms[emp.EMPCODE]} />
            )}
          </div>
        ))}
      </div>

      {selectedEmployeeForForm && (
        workerType === 'STUDENT' ? (
          <div
            className="student-preview inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
            style={{ position: 'fixed', inset: 0 }}
          >
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col h-[96vh] sm:h-[90vh] print:h-auto print:shadow-none print:rounded-none">
              <div className="flex-none px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl no-print">
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-slate-800 leading-tight">Printable Resignation Form Preview</h3>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Auto-saved locally</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <span>🖨️</span> Print / Save as PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeForForm(null)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 print:p-0 print:overflow-visible bg-slate-100 print:bg-white">
                <StudentResignForm key={selectedEmployeeForForm.EMPCODE} employee={selectedEmployeeForForm} />
              </div>
            </div>
            <style>{`
              @media print {
                @page { size: A4 portrait; margin: 0; }
                body * { visibility: hidden !important; }
                .student-preview, .student-preview * { visibility: visible !important; }
                .student-preview .no-print, .student-preview .no-print * { display: none !important; }
                .student-preview {
                  position: absolute !important;
                  inset: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  display: block !important;
                  background: #fff !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  z-index: 999999 !important;
                  overflow: hidden !important;
                }
                .student-preview > div {
                  width: 210mm !important;
                  height: 297mm !important;
                  max-width: none !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                  border: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden !important;
                }
                .student-preview > div > div:last-child {
                  width: 210mm !important;
                  height: 297mm !important;
                  overflow: hidden !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: #fff !important;
                }
              }
            `}</style>
          </div>
        ) : workerType === 'STAFF' ? (
          <div className="staff-preview fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col h-[90vh] print:h-auto print:shadow-none print:rounded-none">
              <div className="flex-none px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl no-print">
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-slate-800 leading-tight">
                    {selectedStaffForm === 'due' ? 'Staff No Dues Form Preview' : 'Staff Resignation Form Preview'}
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Auto-saved locally</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <span>🖨️</span> Print / Save as PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEmployeeForForm(null)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 print:p-0 print:overflow-visible bg-slate-100 print:bg-white">
                {selectedStaffForm === 'due' ? (
                  <StaffDueForm
                    key={selectedEmployeeForForm.EMPCODE}
                    employee={selectedEmployeeForForm}
                    savedData={editedForms[selectedEmployeeForForm.EMPCODE]}
                    onFormChange={handleFormChange}
                    onClose={() => setSelectedEmployeeForForm(null)}
                  />
                ) : (
                  <StaffResignForm
                    key={selectedEmployeeForForm.EMPCODE}
                    employee={selectedEmployeeForForm}
                  />
                )}
              </div>
            </div>
            <style>{`
              @media print {
                @page { size: A4 portrait; margin: 0; }
                body * { visibility: hidden !important; }
                .staff-preview, .staff-preview * { visibility: visible !important; }
                .staff-preview .no-print, .staff-preview .no-print * { display: none !important; }
                .staff-preview {
                  position: fixed !important;
                  inset: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  display: block !important;
                  background: #fff !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  z-index: 999999 !important;
                  overflow: hidden !important;
                }
                .staff-preview > div {
                  width: 210mm !important;
                  height: 297mm !important;
                  max-width: none !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                  border: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden !important;
                }
                .staff-preview > div > div:last-child {
                  width: 210mm !important;
                  height: 297mm !important;
                  overflow: hidden !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: #fff !important;
                }
              }
            `}</style>
          </div>
        ) : (
          <ResignForm
            employee={selectedEmployeeForForm}
            savedData={editedForms[selectedEmployeeForForm.EMPCODE]}
            onFormChange={handleFormChange}
            onClose={() => setSelectedEmployeeForForm(null)}
          />
        )
      )}
    </div>
  );
}