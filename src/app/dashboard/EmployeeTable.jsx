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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, width: '100%' }}>

      {/* Description & Count Row (Top) */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '15px', padding: '5px 0', width: '100%', marginBottom: '5px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#666666' }}>
          List of employees from the EMPMAST database table based on status filter.
        </p>
        <div style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>
          <strong>{active === 'Y' ? 'Active' : 'Resigned'}:</strong> {employees.length} | <strong>Showing:</strong> {filteredEmployees.length} | <strong>Selected:</strong> {selectedRows.size}
        </div>
      </div>

      {/* Filter Bar (Bottom) */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '15px', padding: '10px 0', borderBottom: '1px solid #eee', marginBottom: '15px', width: '100%', overflowX: 'auto' }}>
        <div style={{ flex: '0 0 auto', whiteSpace: 'nowrap', fontSize: '18px', fontWeight: '700' }}>
          {active === 'Y'
            ? (workerType === 'STAFF' ? 'Active Staff' : 'Active Operators')
            : (workerType === 'STAFF' ? 'Resigned Staff' : 'Resigned Operators')}
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '15px', whiteSpace: 'nowrap' }}>
           <div style={{ display: 'flex', alignItems: 'center' }}>
            <label htmlFor="worker-type-select" style={{ marginRight: '5px' }}>Type:</label>
            <select
              id="worker-type-select"
              value={workerType}
              onChange={(e) => setWorkerType(e.target.value)}
              style={{ padding: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select Type</option>
              <option value="REG">Reg Worker</option>
              <option value="TEMP">Temp Worker</option>
              <option value="STUDENT">Student</option>
              <option value="STAFF">Staff</option>
            </select>
          </div>

           <div style={{ display: 'flex', alignItems: 'center' }}>
            <label htmlFor="active-select" style={{ marginRight: '5px' }}>Active:</label>
            <select
              id="active-select"
              value={active}
              onChange={(e) => setActive(e.target.value)}
              style={{ padding: '4px', border: '1px solid #ccc' }}
            >
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>

          {active !== 'Y' && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label htmlFor="year-input" style={{ marginRight: '5px' }}>Year:</label>
              <input
                id="year-input"
                type="number"
                value={year}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setYear(isNaN(val) ? '' : val);
                }}
                style={{ padding: '4px', border: '1px solid #ccc', width: '65px' }}
              />
            </div>
          )}

          {active !== 'Y' && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label htmlFor="month-select" style={{ marginRight: '5px' }}>Month:</label>
              <select
                id="month-select"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                style={{ padding: '4px', border: '1px solid #ccc' }}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label htmlFor="search-input" style={{ marginRight: '5px' }}>Search:</label>
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Emp Code"
              style={{ padding: '4px 8px', border: '1px solid #ccc', width: '140px' }}
            />
          </div>
        </div>
      </div>

      {/* Normal Table */}
      <div className="no-print" style={{ flex: 1, overflow: 'auto', border: '1px solid #cccccc', marginBottom: '15px' }}>
        {!workerType ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666666' }}>
            Please select a worker type to load employee records
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
            <div>Error: {error}</div>
            <button onClick={() => fetchEmployees(year, month, active, workerType)} style={{ marginTop: '10px', padding: '5px 10px' }}>
              Retry
            </button>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>No records found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #cccccc' }}>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, width: '40px', padding: '8px', border: '1px solid #cccccc', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, padding: '8px', border: '1px solid #cccccc', textAlign: 'left' }}>Emp Code</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, padding: '8px', border: '1px solid #cccccc', textAlign: 'left' }}>Name</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, padding: '8px', border: '1px solid #cccccc', textAlign: 'left' }}>Designation</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, padding: '8px', border: '1px solid #cccccc', textAlign: 'left' }}>Department</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, padding: '8px', border: '1px solid #cccccc', textAlign: 'left' }}>Section</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, padding: '8px', border: '1px solid #cccccc', textAlign: 'left' }}>Join Date</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, padding: '8px', border: '1px solid #cccccc', textAlign: 'left' }}>DOL</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, padding: '8px', border: '1px solid #cccccc', textAlign: 'left' }}>Last Work Day</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, padding: '8px', border: '1px solid #cccccc', textAlign: 'left' }}>Reason</th>
                <th style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1, width: workerType === 'STAFF' ? '180px' : '100px', padding: '8px', border: '1px solid #cccccc', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.EMPCODE}
                  style={{
                    borderBottom: '1px solid #cccccc',
                    backgroundColor: selectedRows.has(emp.EMPCODE) ? '#e6f7ff' : '#ffffff'
                  }}
                >
                  <td style={{ padding: '8px', border: '1px solid #cccccc', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(emp.EMPCODE)}
                      onChange={() => toggleSelectRow(emp.EMPCODE)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #cccccc' }}>{emp.EMPCODE}</td>
                  <td style={{ padding: '8px', border: '1px solid #cccccc', fontWeight: 'bold' }}>{emp.EMPNAME}</td>
                  <td style={{ padding: '8px', border: '1px solid #cccccc' }}>{emp.DESIGNAME || emp.DESIG}</td>
                  <td style={{ padding: '8px', border: '1px solid #cccccc' }}>{emp.DEPTNAME || emp.DEPTCODE}</td>
                  <td style={{ padding: '8px', border: '1px solid #cccccc' }}>{emp.NSECTION || emp.NSECCODE}</td>
                  <td style={{ padding: '8px', border: '1px solid #cccccc' }}>{emp.JOINDATE || '-'}</td>
                  <td style={{ padding: '8px', border: '1px solid #cccccc', color: '#cc0000', fontWeight: 'bold' }}>{emp.DOL || '-'}</td>
                  <td style={{ padding: '8px', border: '1px solid #cccccc' }}>{emp.LASTWRKDAY || '-'}</td>
                  <td style={{ padding: '8px', border: '1px solid #cccccc' }}>{emp.REASON || '-'}</td>
                  <td style={{ padding: '8px', border: '1px solid #cccccc', textAlign: 'center' }}>
                    {workerType === 'STAFF' ? (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button
                          onClick={() => openForm(emp, 'due')}
                          style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          No Dues Form
                        </button>
                        <button
                          onClick={() => openForm(emp, 'resign')}
                          style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Resign Form
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openForm(emp)}
                        style={{ padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
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

      {/* Download Selected Forms button — below the table */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingBottom: '20px' }}>
        {pdfError && <span style={{ color: '#cc0000', fontSize: '12px' }}>{pdfError}</span>}
        <button
          onClick={handleDownloadSelected}
          disabled={selectedRows.size === 0 || generatingPdf}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: selectedRows.size === 0 || generatingPdf ? '#93c5fd' : '#2563eb',
            border: 'none',
            borderRadius: '6px',
            cursor: selectedRows.size === 0 || generatingPdf ? 'not-allowed' : 'pointer',
          }}
        >
          {generatingPdf
            ? 'Generating PDF…'
            : `Download Selected Forms${selectedRows.size ? ` (${selectedRows.size})` : ''}`}
        </button>
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