'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const IMAGE_FIELDS = new Set([
  'EmpImg', 'SpouseImg', 'Child1Img', 'Child2Img',
  'Child3Img', 'Child4Img', 'Child5Img', 'FatherImg',
  'MotherImg',
]);

const DATE_FIELDS = new Set([
  'DOJ',
  'DOB',
  'SpouseDOB',
  'Child1DOB',
  'Child2DOB',
  'Child3DOB',
  'Child4DOB',
  'Child5DOB',
  'FatherDOB',
  'MotherDOB',
  'CreatedAt',
  'UpdatedAt',
  'VerifiedAt',
]);

const COLUMNS = [
  'ESIID', 'EmpID', 'EmpName', 'DOJ', 'DOB', 'Gender', 'MobileNo',
  'AadharNo', 'MaritalStatus', 'HasPrevESI', 'PrevESINo', 'Address', 'State',
  'Pincode', 'EmpImg', 'FatherName', 'FatherDOB', 'FatherImg',
  'MotherName', 'MotherDOB', 'MotherImg', 'SpouseName',
  'SpouseDOB', 'SpouseImg', 'ChildCount',
  'Child1Name', 'Child1DOB', 'Child1Img',
  'Child2Name', 'Child2DOB', 'Child2Img',
  'Child3Name', 'Child3DOB', 'Child3Img',
  'Child4Name', 'Child4DOB', 'Child4Img',
  'Child5Name', 'Child5DOB', 'Child5Img',
  'IncludeParents', 'CreatedAt', 'UpdatedAt', 'VerifiedAt', 'Verification', 'VerifiedBy',
];

const PAGE_SIZE = 10;

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return displayValue(value);
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekDateRange(value) {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) return null;
  const januaryFourth = new Date(year, 0, 4);
  const mondayOffset = (januaryFourth.getDay() + 6) % 7;
  const start = new Date(year, 0, 4 - mondayOffset + (week - 1) * 7);
  const thursday = new Date(start);
  thursday.setDate(thursday.getDate() + 3);
  if (thursday.getFullYear() !== year) return null;

  const firstThursday = new Date(year, 0, 4);
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7));
  if (1 + Math.round((thursday - firstThursday) / 604800000) !== week) return null;

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { from: toDateInputValue(start), to: toDateInputValue(end) };
}

function getVerifiedDateRange(mode, date, week, month, from, to) {
  if (mode === 'date') {
    return date ? { from: date, to: date } : { error: 'Choose a date to filter applications.' };
  }
  if (mode === 'week') {
    return getWeekDateRange(week) || { error: 'Choose a valid week to filter applications.' };
  }
  if (mode === 'month') {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) return { error: 'Choose a month to filter applications.' };
    const year = Number(match[1]);
    const monthNumber = Number(match[2]);
    if (monthNumber < 1 || monthNumber > 12) return { error: 'Choose a valid month.' };
    return { from: `${month}-01`, to: toDateInputValue(new Date(year, monthNumber, 0)) };
  }
  if (mode === 'range') {
    if (!from || !to) return { error: 'Choose both dates for the date range.' };
    if (from > to) return { error: 'The start date must be on or before the end date.' };
    return { from, to };
  }
  return {};
}

function displayColumnName(column) {
  if (column === 'ESIID') return 'ESI ID';
  if (column === 'EmpID') return 'Employee ID';
  if (column === 'EmpName') return 'Employee Name';
  if (column === 'DOJ') return 'Date Of Joining';
  if (column === 'DOB') return 'Date Of Birth';
  if (column === 'MobileNo') return 'Mobile Number';
  if (column === 'AadharNo') return 'Aadhar Number';
  if (column === 'EmpImg') return 'Photograph';
  if (column === 'IncludeParents') return 'Includes Parents';
  if (column.endsWith('DOB')) return `${column.slice(0, -3)} Date Of Birth`;
  if (column.endsWith('Img')) return `${column.slice(0, -3)} Photograph`;
  if (column === 'HasPrevESI') return 'Has Previous ESI';
  if (column === 'PrevESINo') return 'Previous ESI Number';
  if (column === 'VerifiedBy') return 'Verified By';
  if (column === 'VerifiedAt') return 'Verified At';
  return column.charAt(0).toUpperCase() + column.slice(1);
}

export default function EsiApplicationsTable({ verifiedOnly = false }) {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiedDateMode, setVerifiedDateMode] = useState('all');
  const [verifiedDate, setVerifiedDate] = useState('');
  const [verifiedWeek, setVerifiedWeek] = useState('');
  const [verifiedMonth, setVerifiedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [verifiedFrom, setVerifiedFrom] = useState('');
  const [verifiedTo, setVerifiedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionError, setBulkActionError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const verifiedDateRange = getVerifiedDateRange(
    verifiedDateMode,
    verifiedDate,
    verifiedWeek,
    verifiedMonth,
    verifiedFrom,
    verifiedTo,
  );
  const verifiedDateError = verifiedDateRange.error;
  const verifiedRangeFrom = verifiedDateRange.from;
  const verifiedRangeTo = verifiedDateRange.to;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!selectedImage && !pendingConfirmation) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !bulkActionLoading) {
        setSelectedImage(null);
        setPendingConfirmation(null);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedImage, pendingConfirmation, bulkActionLoading]);

  const loadPage = useCallback(async (pageNumber, signal) => {
    if (verifiedOnly && verifiedDateError) {
      setRecords([]);
      setTotal(0);
      setError(verifiedDateError);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        search: searchQuery,
      });
      if (verifiedOnly) {
        params.set('verifiedOnly', 'true');
        if (verifiedRangeFrom) params.set('verifiedFrom', verifiedRangeFrom);
        if (verifiedRangeTo) params.set('verifiedTo', verifiedRangeTo);
      }
      const response = await fetch(`/api/esi-applications?${params.toString()}`, {
        cache: 'no-store',
        signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load ESI applications.');
      setRecords(result.data);
      setTotal(result.total);
      setPage(result.page);
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        setError(loadError.message || 'Unable to load ESI applications.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [searchQuery, verifiedDateError, verifiedRangeFrom, verifiedRangeTo, verifiedOnly]);

  useEffect(() => {
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => void loadPage(page, controller.signal));
    return () => {
      cancelAnimationFrame(frame);
      controller.abort();
    };
  }, [loadPage, page]);

  const confirmBulkAction = async () => {
    if (!pendingConfirmation || bulkActionLoading) return;

    const { action, employeeIds } = pendingConfirmation;
    setBulkActionLoading(true);
    setBulkActionError('');
    try {
      const response = await fetch('/api/esi-applications', {
        method: action === 'verify' ? 'PATCH' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `Unable to ${action} selected applications.`);
      }

      setSelectedIds(new Set());
      setPendingConfirmation(null);
      const affectedCount = action === 'verify' ? result.updatedCount : result.deletedCount;
      const newPageCount = Math.max(1, Math.ceil((total - affectedCount) / PAGE_SIZE));
      if (page > newPageCount) {
        setPage(newPageCount);
      } else {
        await loadPage(page);
      }
    } catch (actionError) {
      setBulkActionError(actionError.message || `Unable to ${action} selected applications.`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const allCurrentPageSelected = records.length > 0 &&
    records.every((record) => selectedIds.has(record.EmpID));

  const updateVerifiedDateFilter = (update) => {
    update();
    setPage(1);
    setSelectedIds(new Set());
    setExportError('');
  };

  const exportVerifiedApplications = async () => {
    if (exporting) return;
    if (verifiedDateError) {
      setExportError(verifiedDateError);
      return;
    }

    setExporting(true);
    setExportError('');
    try {
      const fetchPage = async (pageNumber, includeColumns = false) => {
        const params = new URLSearchParams({
          page: String(pageNumber),
          search: searchQuery,
          verifiedOnly: 'true',
        });
        if (includeColumns) params.set('includeColumns', 'true');
        if (verifiedRangeFrom) params.set('verifiedFrom', verifiedRangeFrom);
        if (verifiedRangeTo) params.set('verifiedTo', verifiedRangeTo);
        const response = await fetch(`/api/esi-applications?${params.toString()}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load verified applications for export.');
        return result;
      };

      const firstPage = await fetchPage(1, true);
      if (!Array.isArray(firstPage.columns)) {
        throw new Error('Database column headings are unavailable for the export.');
      }
      const exportColumns = firstPage.columns.filter((column) => (
        column !== 'UpdatedAt' && column !== 'Verification'
      ));
      if (!exportColumns.length) {
        throw new Error('Database column headings are unavailable for the export.');
      }
      const exportRecords = [...firstPage.data];
      const pageCountForExport = Math.ceil(firstPage.total / (firstPage.pageSize || PAGE_SIZE));
      for (let pageNumber = 2; pageNumber <= pageCountForExport; pageNumber++) {
        const result = await fetchPage(pageNumber);
        exportRecords.push(...result.data);
      }

      const { default: ExcelJS } = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'ESI Applications';
      const worksheet = workbook.addWorksheet('Verified Applications', {
        views: [{ state: 'frozen', ySplit: 5 }],
      });
      worksheet.columns = exportColumns.map((column) => ({
        key: column,
        width: IMAGE_FIELDS.has(column) ? 16 : column === 'Address' ? 32 : 20,
      }));
      worksheet.mergeCells('D1:F1');
      worksheet.getCell('D1').value = 'GREENTECH INDUSTRIES';
      worksheet.getCell('D1').font = { bold: true, size: 16, color: { argb: 'FF0F3D38' } };
      worksheet.getCell('D1').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(1).height = 28;

      worksheet.mergeCells('D2:F2');
      worksheet.getCell('D2').value = 'Verified ESI Applications Report';
      worksheet.getCell('D2').font = { bold: true, size: 13, color: { argb: 'FF475569' } };
      worksheet.getCell('D2').alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(2).height = 23;
      worksheet.getRow(3).height = 8;
      worksheet.getRow(4).height = 8;

      const headerRow = worksheet.getRow(5);
      exportColumns.forEach((column, columnIndex) => {
        headerRow.getCell(columnIndex + 1).value = column;
      });
      headerRow.height = 24;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F766E' },
      };
      headerRow.alignment = { vertical: 'middle', wrapText: true };
      worksheet.autoFilter = {
        from: { row: 5, column: 1 },
        to: { row: 5, column: exportColumns.length },
      };

      exportRecords.forEach((record, recordIndex) => {
        const row = worksheet.addRow(exportColumns.map((column) => {
          if (IMAGE_FIELDS.has(column)) return record[column] ? '' : 'Not uploaded';
          if (DATE_FIELDS.has(column) && record[column]) return formatDate(record[column]);
          return displayValue(record[column]);
        }));
        row.height = 60;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: recordIndex % 2 === 0 ? 'FFFFFFFF' : 'FFE8F3F1' },
          };
          cell.alignment = { vertical: 'middle', wrapText: true };
        });

        exportColumns.forEach((column, columnIndex) => {
          const imageData = record[column];
          if (!IMAGE_FIELDS.has(column) || !imageData) return;

          const imageMatch = /^data:image\/(jpeg|jpg|png|gif);base64,([\s\S]+)$/i.exec(imageData);
          if (!imageMatch) {
            throw new Error(`Unable to export the ${displayColumnName(column)} image for ${record.EmpID}.`);
          }
          const imageId = workbook.addImage({
            base64: imageMatch[2],
            extension: imageMatch[1].toLowerCase() === 'jpg' ? 'jpeg' : imageMatch[1].toLowerCase(),
          });
          worksheet.addImage(imageId, {
            tl: { col: columnIndex + 0.1, row: row.number - 0.92 },
            ext: { width: 64, height: 64 },
            editAs: 'oneCell',
          });
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `verified-esi-applications-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (exportActionError) {
      setExportError(exportActionError.message || 'Unable to export verified applications.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="esiApplicationsPage">
      <header className="esiApplicationsHeader">
        <div>
          <h1>{verifiedOnly ? 'Verified ESI applications' : 'ESI application forms'}</h1>
          <p>
            {total} {verifiedOnly ? 'verified ' : ''}
            application{total === 1 ? '' : 's'} in the ESI database
          </p>
        </div>
        <input
          className="esiApplicationsSearch"
          type="search"
          aria-label="Search ESI applications"
          placeholder="Search ESI ID, employee ID, employee name, mobile, Aadhaar, father name…"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setSelectedIds(new Set());
            setBulkActionError('');
          }}
        />
        {verifiedOnly && (
          <button
            type="button"
            className="esiApplicationsExportButton"
            onClick={() => void exportVerifiedApplications()}
            disabled={exporting}
          >
            {exporting ? 'Preparing Excel…' : 'Export to Excel'}
          </button>
        )}
      </header>

      {verifiedOnly && (
        <div className="verifiedApplicationsFilters" aria-label="Filter by verification date">
          <label>
            Verified at
            <select
              value={verifiedDateMode}
              onChange={(event) => updateVerifiedDateFilter(() => setVerifiedDateMode(event.target.value))}
            >
              <option value="all">All dates</option>
              <option value="date">Specific date</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="range">Date range</option>
            </select>
          </label>
          {verifiedDateMode === 'date' && (
            <label>
              Date
              <input
                type="date"
                value={verifiedDate}
                onChange={(event) => updateVerifiedDateFilter(() => setVerifiedDate(event.target.value))}
              />
            </label>
          )}
          {verifiedDateMode === 'week' && (
            <label>
              Week
              <input
                type="week"
                value={verifiedWeek}
                onChange={(event) => updateVerifiedDateFilter(() => setVerifiedWeek(event.target.value))}
              />
            </label>
          )}
          {verifiedDateMode === 'month' && (
            <label>
              Month
              <input
                type="month"
                value={verifiedMonth}
                onChange={(event) => updateVerifiedDateFilter(() => setVerifiedMonth(event.target.value))}
              />
            </label>
          )}
          {verifiedDateMode === 'range' && (
            <>
              <label>
                From
                <input
                  type="date"
                  value={verifiedFrom}
                  onChange={(event) => updateVerifiedDateFilter(() => setVerifiedFrom(event.target.value))}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={verifiedTo}
                  onChange={(event) => updateVerifiedDateFilter(() => setVerifiedTo(event.target.value))}
                />
              </label>
            </>
          )}
        </div>
      )}

      {exportError && <div className="esiApplicationsMessage esiApplicationsError" role="alert">{exportError}</div>}
      {error && (
        <div className="esiApplicationsMessage esiApplicationsError" role="alert">
          {error}
          <button type="button" onClick={() => loadPage(page)}>Retry</button>
        </div>
      )}

      <div className="esiApplicationsTableWrap" role="region" aria-label="ESI application details" tabIndex={0}>
        <table className="esiApplicationsTable">
          <thead>
            <tr>
              {!verifiedOnly && (
                <th scope="col">
                  <input
                    type="checkbox"
                    aria-label="Select all applications on this page"
                    checked={allCurrentPageSelected}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setSelectedIds((current) => {
                        const next = new Set(current);
                        records.forEach(({ EmpID }) => {
                          if (checked) next.add(EmpID);
                          else next.delete(EmpID);
                        });
                        return next;
                      });
                    }}
                  />
                </th>
              )}
              <th scope="col">S.No.</th>
              {COLUMNS.map((column) => <th key={column} scope="col">{displayColumnName(column)}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLUMNS.length + (verifiedOnly ? 1 : 2)} className="esiApplicationsEmpty">Loading applications…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={COLUMNS.length + (verifiedOnly ? 1 : 2)} className="esiApplicationsEmpty">
                {searchQuery ? 'No matching ESI applications found.' : 'No ESI applications found.'}
              </td></tr>
            ) : records.map((record, index) => (
            <tr
              key={record.EmpID}
              className="esiApplicationsDataRow"
              title="Double-click to view all application details"
              onDoubleClick={(event) => {
                if (!event.target.closest('button, input')) {
                   const returnTo = verifiedOnly ? '?from=verified' : '';
                  router.push(`/dashboard/esi-applications/${encodeURIComponent(record.EmpID)}${returnTo}`);
                }
              }}
            >
                {!verifiedOnly && (
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select application ${record.EmpID}`}
                      checked={selectedIds.has(record.EmpID)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        setSelectedIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(record.EmpID);
                          else next.delete(record.EmpID);
                          return next;
                        });
                      }}
                    />
                  </td>
                )}
                <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                {COLUMNS.map((column) => (
                  <td key={column}>
                    {column === 'Verification' ? (
                      record.Verification === 'V' ? 'Verified' : 'Not Verified'
                    ) : IMAGE_FIELDS.has(column) && record[column] ? (
                      <button
                        type="button"
                        className="esiApplicationsImageButton"
                        aria-label={`View ${displayColumnName(column)} for ${record.EmpID}`}
                        onClick={() => setSelectedImage({
                          src: record[column],
                          label: `${displayColumnName(column)} — ${record.EmpID}`,
                        })}
                      >
                        <Image
                          className="esiApplicationsThumbnail"
                          src={record[column]}
                          alt={column}
                          width={56}
                          height={56}
                          unoptimized
                        />
                      </button>
                    ) : DATE_FIELDS.has(column) && record[column]
                      ? formatDate(record[column])
                      : displayValue(record[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="esiApplicationsPagination">
        <div className="esiApplicationsPaginationActions">
          {!verifiedOnly && (
            <>
              <button
                type="button"
                className="esiApplicationsVerifyButton"
                onClick={() => {
                  setBulkActionError('');
                  setPendingConfirmation({ action: 'verify', employeeIds: [...selectedIds] });
                }}
                disabled={selectedIds.size === 0 || bulkActionLoading}
              >
                Verify selected ({selectedIds.size})
              </button>
              <button
                type="button"
                className="esiApplicationsDeleteButton"
                onClick={() => {
                  setBulkActionError('');
                  setPendingConfirmation({ action: 'delete', employeeIds: [...selectedIds] });
                }}
                disabled={selectedIds.size === 0 || bulkActionLoading}
              >
                Delete selected ({selectedIds.size})
              </button>
            </>
          )}
          {bulkActionError && <span className="esiApplicationsVerifyError" role="alert">{bulkActionError}</span>}
          <span>Page {page} of {pageCount}</span>
        </div>
        <div>
          <button type="button" onClick={() => setPage((current) => current - 1)} disabled={page <= 1 || loading}>
            Previous
          </button>
          <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= pageCount || loading}>
            Next
          </button>
        </div>
      </footer>

      {pendingConfirmation && (
        <div
          className="esiApplicationsImageOverlay"
          role="presentation"
          onClick={() => {
            if (!bulkActionLoading) setPendingConfirmation(null);
          }}
        >
          <div
            className="esiApplicationsConfirmDialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="esiApplicationsConfirmTitle"
            aria-describedby="esiApplicationsConfirmMessage"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="esiApplicationsConfirmTitle">
              {pendingConfirmation.action === 'verify' ? 'Confirm verification' : 'Confirm deletion'}
            </h2>
            <p id="esiApplicationsConfirmMessage">
              {pendingConfirmation.action === 'verify'
                ? `Verify ${pendingConfirmation.employeeIds.length} selected application${pendingConfirmation.employeeIds.length === 1 ? '' : 's'}?`
                : `Permanently delete ${pendingConfirmation.employeeIds.length} selected application${pendingConfirmation.employeeIds.length === 1 ? '' : 's'}? This cannot be undone.`}
            </p>
            {bulkActionError && <p className="esiApplicationsConfirmError" role="alert">{bulkActionError}</p>}
            <div className="esiApplicationsConfirmActions">
              <button
                type="button"
                className="esiApplicationsCancelButton"
                onClick={() => setPendingConfirmation(null)}
                disabled={bulkActionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={pendingConfirmation.action === 'delete' ? 'esiApplicationsDeleteButton' : 'esiApplicationsVerifyButton'}
                onClick={() => void confirmBulkAction()}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? 'Please wait…' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="esiApplicationsImageOverlay"
          role="presentation"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="esiApplicationsImageDialog"
            role="dialog"
            aria-modal="true"
            aria-label={selectedImage.label}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="esiApplicationsImageClose"
              aria-label="Close image"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <p>{selectedImage.label}</p>
            <Image
              className="esiApplicationsFullImage"
              src={selectedImage.src}
              alt={selectedImage.label}
              width={1200}
              height={900}
              unoptimized
            />
          </div>
        </div>
      )}
    </main>
  );
}
