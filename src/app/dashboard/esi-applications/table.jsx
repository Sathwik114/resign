'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const IMAGE_FIELDS = new Set([
  'Photograph', 'SpousePhotograph', 'Child1Photograph', 'Child2Photograph',
  'Child3Photograph', 'Child4Photograph', 'Child5Photograph', 'FatherPhotograph',
  'MotherPhotograph',
]);

const DATE_FIELDS = new Set([
  'DateOfJoining',
  'DateOfBirth',
  'SpouseDateOfBirth',
  'Child1DateOfBirth',
  'Child2DateOfBirth',
  'Child3DateOfBirth',
  'Child4DateOfBirth',
  'Child5DateOfBirth',
  'FatherDateOfBirth',
  'MotherDateOfBirth',
  'CreatedAt',
  'UpdatedAt',
]);

const COLUMNS = [
  'EmployeeId', 'EmployeeName', 'DateOfJoining', 'DateOfBirth', 'Gender', 'MobileNumber',
  'AadharNumber', 'MaritalStatus', 'HasPreviousEsi', 'PreviousEsiNumber', 'Address', 'State',
  'Pincode', 'Photograph', 'FatherName', 'FatherDateOfBirth', 'FatherPhotograph',
  'MotherName', 'MotherDateOfBirth', 'MotherPhotograph', 'SpouseName',
  'SpouseDateOfBirth', 'SpousePhotograph', 'ChildCount',
  'Child1Name', 'Child1DateOfBirth', 'Child1Photograph',
  'Child2Name', 'Child2DateOfBirth', 'Child2Photograph',
  'Child3Name', 'Child3DateOfBirth', 'Child3Photograph',
  'Child4Name', 'Child4DateOfBirth', 'Child4Photograph',
  'Child5Name', 'Child5DateOfBirth', 'Child5Photograph',
  'IncludesParents', 'CreatedAt', 'UpdatedAt',
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

function displayColumnName(column) {
  return column.charAt(0).toUpperCase() + column.slice(1);
}

export default function EsiApplicationsTable() {
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (!selectedImage) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedImage]);

  const loadPage = useCallback(async (pageNumber, signal) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/esi-applications?page=${pageNumber}`, {
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
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => void loadPage(page, controller.signal));
    return () => {
      cancelAnimationFrame(frame);
      controller.abort();
    };
  }, [loadPage, page]);

  return (
    <main className="esiApplicationsPage">
      <header className="esiApplicationsHeader">
        <div>
          <h1>ESI application forms</h1>
          <p>{total} application{total === 1 ? '' : 's'} in the ESI database</p>
        </div>
        <Link href="/dashboard" className="esiApplicationsBack">Back to dashboard</Link>
      </header>

      {error && (
        <div className="esiApplicationsMessage esiApplicationsError" role="alert">
          {error}
          <button type="button" onClick={() => loadPage(page)}>Retry</button>
        </div>
      )}

      <div className="esiApplicationsTableWrap" role="region" aria-label="ESI application details" tabIndex={0}>
        <table className="esiApplicationsTable">
          <thead>
            <tr>{COLUMNS.map((column) => <th key={column} scope="col">{displayColumnName(column)}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLUMNS.length} className="esiApplicationsEmpty">Loading applications…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={COLUMNS.length} className="esiApplicationsEmpty">No ESI applications found.</td></tr>
            ) : records.map((record) => (
              <tr key={record.EmployeeId}>
                {COLUMNS.map((column) => (
                  <td key={column}>
                    {IMAGE_FIELDS.has(column) && record[column] ? (
                      <button
                        type="button"
                        className="esiApplicationsImageButton"
                        aria-label={`View ${displayColumnName(column)} for ${record.EmployeeId}`}
                        onClick={() => setSelectedImage({
                          src: record[column],
                          label: `${displayColumnName(column)} — ${record.EmployeeId}`,
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
        <span>Page {page} of {pageCount}</span>
        <div>
          <button type="button" onClick={() => setPage((current) => current - 1)} disabled={page <= 1 || loading}>
            Previous
          </button>
          <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= pageCount || loading}>
            Next
          </button>
        </div>
      </footer>

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
