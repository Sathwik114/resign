'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  'IncludeParents', 'CreatedAt',
];

const EXCLUDED_EXPORT_COLUMNS = new Set([
  'UpdatedAt',
  'PhotographMimeType',
  'SpousePhotoMimeType',
  'Child1PhotoMimeType',
  'Child2PhotoMimeType',
  'Child3PhotoMimeType',
  'Child4PhotoMimeType',
  'Child5PhotoMimeType',
  'FatherPhotoMimeType',
  'MotherPhotoMimeType',
]);

const PAGE_SIZE = 10;
const CURRENT_YEAR = new Date().getFullYear();

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

function getExportDateRange({ dateMode, year, date, month, week, rangeFrom, rangeTo }) {
  if (!dateMode) return '';
  if (dateMode === 'date') return formatDate(date);
  if (dateMode === 'month') {
    const monthName = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, Number(month) - 1, 1)));
    return `${monthName} ${year}`;
  }
  if (dateMode === 'week') {
    const dates = getIsoWeekDates(year, Number(week));
    const first = dates[0].getUTCFullYear() < year ? new Date(Date.UTC(year, 0, 1)) : dates[0];
    const lastDate = dates[6];
    const last = lastDate.getUTCFullYear() > year ? new Date(Date.UTC(year, 11, 31)) : lastDate;
    return `Week ${week}: ${formatDate(first)} - ${formatDate(last)}`;
  }
  if (dateMode === 'range') return `${formatDate(rangeFrom)} - ${formatDate(rangeTo)}`;
  return '';
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getIsoWeekNumber(date) {
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  thursday.setUTCDate(thursday.getUTCDate() + 3 - ((thursday.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3 - ((firstThursday.getUTCDay() + 6) % 7));
  return 1 + Math.round((thursday - firstThursday) / 604800000);
}

function getIsoWeeksInYear(year) {
  return getIsoWeekNumber(new Date(year, 11, 28));
}

function getIsoWeekDates(year, week) {
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const mondayOffset = (januaryFourth.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(year, 0, 4 - mondayOffset + (week - 1) * 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return date;
  });
}

function getIsoWeekDateRange(year, week) {
  const dates = getIsoWeekDates(year, week);
  const first = dates[0].getUTCFullYear() < year ? new Date(Date.UTC(year, 0, 1)) : dates[0];
  const lastDate = dates[6];
  const last = lastDate.getUTCFullYear() > year ? new Date(Date.UTC(year, 11, 31)) : lastDate;
  const format = (date) => date.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return `${format(first)} – ${format(last)}`;
}

function withDateYear(value, year) {
  const monthAndDay = value?.slice(5) || '01-01';
  const candidate = `${year}-${monthAndDay}`;
  const date = new Date(`${candidate}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === candidate
    ? candidate
    : `${year}-01-01`;
}

function addDateFilterParams(params, { dateMode, year, date, month, week, rangeFrom, rangeTo }) {
  params.set('year', String(year));
  params.set('dateMode', dateMode);
  if (dateMode === 'date') params.set('date', date);
  if (dateMode === 'month') params.set('month', month);
  if (dateMode === 'week') params.set('week', week);
  if (dateMode === 'range') {
    params.set('from', rangeFrom);
    params.set('to', rangeTo);
  }
}

function getColumnLetter(colIndex) {
  let temp;
  let letter = '';
  let col = colIndex;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = Math.floor((col - temp - 1) / 26);
  }
  return letter || 'AR';
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
  return column.charAt(0).toUpperCase() + column.slice(1);
}

export default function EsiApplicationsTable({ canManage = false }) {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateMode, setDateMode] = useState('');
  const [filterYear, setFilterYear] = useState(String(CURRENT_YEAR));
  const [filterDate, setFilterDate] = useState(() => toDateInputValue(new Date()));
  const [filterMonth, setFilterMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [filterWeek, setFilterWeek] = useState(() => String(getIsoWeekNumber(new Date())));
  const [weekMenuOpen, setWeekMenuOpen] = useState(false);
  const [weekMenuPosition, setWeekMenuPosition] = useState({ top: 0, left: 0, width: 260 });
  const weekPickerRef = useRef(null);
  const weekMenuRef = useRef(null);
  const [rangeFrom, setRangeFrom] = useState(() => `${CURRENT_YEAR}-01-01`);
  const [rangeTo, setRangeTo] = useState(() => toDateInputValue(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [activeRowId, setActiveRowId] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionError, setBulkActionError] = useState('');
  const [noAccessPopup, setNoAccessPopup] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const selectedYear = Number(filterYear);
  const validFilterYear = /^\d{4}$/.test(filterYear) && selectedYear >= 1900 && selectedYear <= 9999;
  const effectiveYear = validFilterYear ? selectedYear : CURRENT_YEAR;
  const weeksInYear = getIsoWeeksInYear(effectiveYear);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (!weekMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!weekPickerRef.current?.contains(event.target) && !weekMenuRef.current?.contains(event.target)) {
        setWeekMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setWeekMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    const closeOnResize = () => setWeekMenuOpen(false);
    window.addEventListener('resize', closeOnResize);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnResize);
    };
  }, [weekMenuOpen]);

  useEffect(() => {
    if (!selectedImage && !pendingConfirmation && !noAccessPopup) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !bulkActionLoading) {
        setSelectedImage(null);
        setPendingConfirmation(null);
        setNoAccessPopup(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedImage, pendingConfirmation, noAccessPopup, bulkActionLoading]);

  const loadPage = useCallback(async (pageNumber, signal) => {
    if (!/^\d{4}$/.test(filterYear) || Number(filterYear) < 1900 || Number(filterYear) > 9999) {
      setRecords([]);
      setTotal(0);
      setError('Enter a valid year between 1900 and 9999.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        all: 'true',
        search: searchQuery,
      });
      addDateFilterParams(params, {
        dateMode,
        year: Number(filterYear),
        date: filterDate,
        month: filterMonth,
        week: filterWeek,
        rangeFrom,
        rangeTo,
      });
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
  }, [searchQuery, dateMode, filterYear, filterDate, filterMonth, filterWeek, rangeFrom, rangeTo]);

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

    const { employeeIds } = pendingConfirmation;
    if (!canManage) {
      setBulkActionError("You don't have access to delete");
      return;
    }
    setBulkActionLoading(true);
    setBulkActionError('');
    try {
      const response = await fetch('/api/esi-applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeIds,
          filter: {
            year: filterYear,
            dateMode,
            date: filterDate,
            month: filterMonth,
            week: filterWeek,
            from: rangeFrom,
            to: rangeTo,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Unable to delete selected applications.');
      }

      setSelectedIds(new Set());
      setPendingConfirmation(null);
      const newPageCount = Math.max(1, Math.ceil((total - result.deletedCount) / PAGE_SIZE));
      if (page > newPageCount) {
        setPage(newPageCount);
      } else {
        await loadPage(page);
      }
    } catch (actionError) {
      setBulkActionError(actionError.message || 'Unable to delete selected applications.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setBulkActionError('');
    if (selectedIds.size === 0) return;
    if (!canManage) {
      setNoAccessPopup(true);
      return;
    }
    setPendingConfirmation({ employeeIds: [...selectedIds] });
  };

  const allRecordsSelected = records.length > 0 &&
    records.every((record) => selectedIds.has(record.EmpID));

  const exportApplications = async () => {
    if (exporting) return;
    if (!validFilterYear) {
      setExportError('Enter a valid year between 1900 and 9999.');
      return;
    }

    setExporting(true);
    setExportError('');
    try {
      const fetchPage = async (pageNumber, includeColumns = false) => {
        const params = new URLSearchParams({
          page: String(pageNumber),
          search: searchQuery,
        });
        addDateFilterParams(params, {
          dateMode,
          year: selectedYear,
          date: filterDate,
          month: filterMonth,
          week: filterWeek,
          rangeFrom,
          rangeTo,
        });
        if (includeColumns) params.set('includeColumns', 'true');
        const response = await fetch(`/api/esi-applications?${params.toString()}`, { cache: 'no-store' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load applications for export.');
        return result;
      };

      const firstPage = await fetchPage(1, true);
      if (!Array.isArray(firstPage.columns)) {
        throw new Error('Database column headings are unavailable for the export.');
      }
      const exportColumns = firstPage.columns.filter((column) => (
        !EXCLUDED_EXPORT_COLUMNS.has(column) && !column.toLowerCase().endsWith('mimetype')
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
      const worksheet = workbook.addWorksheet('ESI Applications', {
        views: [{ state: 'frozen', ySplit: 5 }],
      });
      worksheet.columns = exportColumns.map((column) => ({
        key: column,
        width: IMAGE_FIELDS.has(column) ? 16 : column === 'Address' ? 32 : 20,
      }));
      const lastCol = getColumnLetter(exportColumns.length);
      const reportDateRange = getExportDateRange({
        dateMode,
        year: selectedYear,
        date: filterDate,
        month: filterMonth,
        week: filterWeek,
        rangeFrom,
        rangeTo,
      });
      worksheet.mergeCells('A1:A4');
      const gtiCell = worksheet.getCell('A1');
      gtiCell.value = 'GTI';
      gtiCell.font = { bold: true, size: 28, color: { argb: 'FF00B0F0' }, name: 'Calibri' };
      gtiCell.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('B1:F4');
      const bannerCell = worksheet.getCell('B1');
      bannerCell.value = {
        richText: [
          {
            text: 'GREENTECH INDUSTRIES\n',
            font: { bold: true, size: 14, color: { argb: 'FF0F3D38' }, name: 'Calibri' },
          },
          {
            text: `ESI Applications Report${reportDateRange ? ` (${reportDateRange})` : ''}`,
            font: { bold: true, size: 11, color: { argb: 'FF000000' }, name: 'Calibri' },
          },
        ],
      };
      bannerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      worksheet.mergeCells(`G1:${lastCol}4`);
      worksheet.getRow(1).height = 18;
      worksheet.getRow(2).height = 18;
      worksheet.getRow(3).height = 10;
      worksheet.getRow(4).height = 10;

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

      const startRow = 5;
      const endRow = Math.max(5, 5 + exportRecords.length);
      const totalCols = exportColumns.length;

      const innerBorder = { style: 'thin', color: { argb: 'FF94A3B8' } };
      const darkBorder = { style: 'medium', color: { argb: 'FF000000' } };

      for (let r = startRow; r <= endRow; r++) {
        const row = worksheet.getRow(r);
        const isTop = r === startRow;
        const isBottom = r === endRow;

        for (let c = 1; c <= totalCols; c++) {
          const cell = row.getCell(c);
          const isLeft = c === 1;
          const isRight = c === totalCols;

          cell.border = {
            top: isTop ? darkBorder : (r === 6 ? darkBorder : innerBorder),
            bottom: isBottom ? darkBorder : (r === startRow ? darkBorder : innerBorder),
            left: isLeft ? darkBorder : innerBorder,
            right: isRight ? darkBorder : innerBorder,
          };
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `esi-applications-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (exportActionError) {
      setExportError(exportActionError.message || 'Unable to export ESI applications.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="esiApplicationsPage">
      <header className="esiApplicationsHeader">
        <div className="esiApplicationsTitleWrap">
          <h1>ESI application forms</h1>
        </div>
        <div className="esiApplicationsRightControls">
          <input
            className="esiApplicationsToolbarControl esiApplicationsSearch"
            type="search"
            aria-label="Search ESI applications"
            placeholder="Search applications"
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setSelectedIds(new Set());
              setBulkActionError('');
            }}
          />
          <select
            className="esiApplicationsToolbarControl esiApplicationsFilterSelect"
            aria-label="Filter applications by period"
            value={dateMode}
            onChange={(event) => {
              setDateMode(event.target.value);
              setPage(1);
              setSelectedIds(new Set());
            }}
          >
            <option value="">Select filter</option>
            <option value="date">Date</option>
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="range">Date range</option>
          </select>
          {dateMode === 'date' && (
            <input
              className="esiApplicationsToolbarControl esiApplicationsDateInput"
              type="date"
              aria-label="Filter applications by date"
              min={`${effectiveYear}-01-01`}
              max={`${effectiveYear}-12-31`}
              value={filterDate}
              onChange={(event) => {
                setFilterDate(event.target.value);
                setPage(1);
                setSelectedIds(new Set());
              }}
            />
          )}
          {dateMode === 'month' && (
            <select
              className="esiApplicationsToolbarControl esiApplicationsFilterSelect"
              aria-label="Filter applications by month"
              value={filterMonth}
              onChange={(event) => {
                setFilterMonth(event.target.value);
                setPage(1);
                setSelectedIds(new Set());
              }}
            >
              {Array.from({ length: 12 }, (_, index) => {
                const month = String(index + 1).padStart(2, '0');
                return <option key={month} value={month}>{new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2000, index, 1))}</option>;
              })}
            </select>
          )}
          {dateMode === 'week' && (
            <div className="esiApplicationsWeekPicker" ref={weekPickerRef}>
              <button
                type="button"
                className="esiApplicationsToolbarControl esiApplicationsWeekTrigger"
                aria-label={`Selected week ${filterWeek}, ${getIsoWeekDateRange(effectiveYear, Number(filterWeek))}`}
                aria-haspopup="listbox"
                aria-controls="esiApplicationsWeekOptions"
                aria-expanded={weekMenuOpen}
                onClick={(event) => {
                  if (weekMenuOpen) {
                    setWeekMenuOpen(false);
                    return;
                  }
                  const rect = event.currentTarget.getBoundingClientRect();
                  const width = Math.min(260, window.innerWidth - 24);
                  setWeekMenuPosition({
                    top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - 332)),
                    left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
                    width,
                  });
                  setWeekMenuOpen(true);
                }}
              >
                <strong>Week {filterWeek}</strong>
                <span>{getIsoWeekDateRange(effectiveYear, Number(filterWeek))}</span>
                <span className="esiApplicationsWeekChevron" aria-hidden="true">▾</span>
              </button>
              {weekMenuOpen && (
                <div
                  className="esiApplicationsWeekMenu"
                  id="esiApplicationsWeekOptions"
                  role="listbox"
                  aria-label="Select week and date range"
                  ref={weekMenuRef}
                  style={{
                    top: `${weekMenuPosition.top}px`,
                    left: `${weekMenuPosition.left}px`,
                    width: `${weekMenuPosition.width}px`,
                  }}
                >
                  <div className="esiApplicationsWeekMenuHeader" aria-hidden="true">
                    <span>Week</span>
                    <span>Dates</span>
                  </div>
                  {Array.from({ length: weeksInYear }, (_, index) => {
                    const week = String(weeksInYear - index);
                    return (
                      <button
                        type="button"
                        className={`esiApplicationsWeekOption${filterWeek === week ? ' isSelected' : ''}`}
                        key={week}
                        role="option"
                        aria-selected={filterWeek === week}
                        onClick={() => {
                          setFilterWeek(week);
                          setPage(1);
                          setSelectedIds(new Set());
                          setWeekMenuOpen(false);
                        }}
                      >
                        <span>Week {week}</span>
                        <span>{getIsoWeekDateRange(effectiveYear, Number(week))}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {dateMode === 'range' && (
            <>
              <input
                className="esiApplicationsToolbarControl esiApplicationsDateInput"
                type="date"
                aria-label="Start date"
                min={`${effectiveYear}-01-01`}
                max={`${effectiveYear}-12-31`}
                value={rangeFrom}
                onChange={(event) => {
                  setRangeFrom(event.target.value);
                  setPage(1);
                  setSelectedIds(new Set());
                }}
              />
              <input
                className="esiApplicationsToolbarControl esiApplicationsDateInput"
                type="date"
                aria-label="End date"
                min={`${effectiveYear}-01-01`}
                max={`${effectiveYear}-12-31`}
                value={rangeTo}
                onChange={(event) => {
                  setRangeTo(event.target.value);
                  setPage(1);
                  setSelectedIds(new Set());
                }}
              />
            </>
          )}
          <input
            className="esiApplicationsToolbarControl esiApplicationsYearInput"
            type="number"
            aria-label="Filter applications by year"
            min="1900"
            max="9999"
            step="1"
            value={filterYear}
            onChange={(event) => {
              const value = event.target.value;
              setFilterYear(value);
              const year = Number(value);
              if (!/^\d{4}$/.test(value) || year < 1900 || year > 9999) return;
              setFilterDate((current) => withDateYear(current, year));
              setRangeFrom(`${year}-01-01`);
              setRangeTo(`${year}-12-31`);
              setFilterWeek((current) => (Number(current) > getIsoWeeksInYear(year) ? '1' : current));
              setPage(1);
              setSelectedIds(new Set());
            }}
          />
          <button
            type="button"
            className="esiApplicationsToolbarControl esiApplicationsExportButton"
            onClick={() => void exportApplications()}
            disabled={exporting}
          >
            {exporting ? 'Preparing Excel…' : 'Export to Excel'}
          </button>
        </div>
      </header>

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
              <th scope="col">
                <input
                  type="checkbox"
                  aria-label="Select all applications"
                  checked={allRecordsSelected}
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
              <th scope="col">S.No.</th>
              {COLUMNS.map((column) => (
                <th key={column} scope="col">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLUMNS.length + 2} className="esiApplicationsEmpty">Loading applications…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={COLUMNS.length + 2} className="esiApplicationsEmpty">
                {searchQuery ? 'No matching ESI applications found.' : 'No ESI applications found.'}
              </td></tr>
            ) : records.map((record, index) => (
            <tr
              key={record.EmpID}
              className={`esiApplicationsDataRow${activeRowId === record.EmpID ? ' isActive' : ''}${selectedIds.has(record.EmpID) ? ' isSelected' : ''}`}
              aria-selected={activeRowId === record.EmpID || selectedIds.has(record.EmpID)}
              title="Double-click to view all application details"
              onClick={() => setActiveRowId(record.EmpID)}
              onDoubleClick={(event) => {
                if (!event.target.closest('button, input')) {
                  router.push(`/dashboard/esi-applications/${encodeURIComponent(record.EmpID)}`);
                }
              }}
            >
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select application ${record.EmpID}`}
                    checked={selectedIds.has(record.EmpID)}
                    onClick={(event) => {
                      setActiveRowId(record.EmpID);
                      event.stopPropagation();
                    }}
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
                <td>{index + 1}</td>
                {COLUMNS.map((column) => (
                  <td key={column}>
                    {IMAGE_FIELDS.has(column) && record[column] ? (
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

      <footer className="esiApplicationsPagination esiApplicationsActionsFooter">
        <div className="esiApplicationsPaginationActions">
          <button
            type="button"
            className="esiApplicationsDeleteButton"
            onClick={handleDeleteClick}
            disabled={selectedIds.size === 0 || bulkActionLoading}
          >
            Delete selected ({selectedIds.size})
          </button>
          {bulkActionError && <span className="esiApplicationsVerifyError" role="alert">{bulkActionError}</span>}
        </div>
      </footer>

      {noAccessPopup && (
        <div
          className="esiApplicationsImageOverlay"
          role="presentation"
          onClick={() => setNoAccessPopup(false)}
        >
          <div
            className="esiApplicationsConfirmDialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="esiApplicationsNoAccessTitle"
            aria-describedby="esiApplicationsNoAccessMessage"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="esiApplicationsNoAccessTitle" style={{ color: '#b91c1c' }}>
              Access Denied
            </h2>
            <p id="esiApplicationsNoAccessMessage" style={{ margin: '14px 0 20px', fontSize: '15px', color: '#183B4E' }}>
              You don&apos;t have access to delete
            </p>
            <div className="esiApplicationsConfirmActions" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="esiApplicationsCancelButton"
                onClick={() => setNoAccessPopup(false)}
                style={{ minWidth: '70px', fontWeight: 600 }}
                autoFocus
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

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
            <h2 id="esiApplicationsConfirmTitle">Confirm deletion</h2>
            <p id="esiApplicationsConfirmMessage">
              Permanently delete {pendingConfirmation.employeeIds.length} selected application{pendingConfirmation.employeeIds.length === 1 ? '' : 's'}? This cannot be undone.
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
                className="esiApplicationsDeleteButton"
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
