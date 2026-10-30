'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const PAGE_SIZE = 10;

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getCurrentIsoWeek() {
  const thursday = new Date();
  thursday.setDate(thursday.getDate() + 3 - ((thursday.getDay() + 6) % 7));
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((thursday - yearStart) / 86400000) + 1) / 7);
  return `${thursday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

function getWeekRange(value) {
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

function getCreatedDateRange(mode, month, week, from, to) {
  if (mode === 'month') {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) return { error: 'Choose a month to filter applications.' };
    const year = Number(match[1]);
    const monthNumber = Number(match[2]);
    if (monthNumber < 1 || monthNumber > 12) return { error: 'Choose a valid month.' };
    return {
      from: `${month}-01`,
      to: toDateInputValue(new Date(year, monthNumber, 0)),
    };
  }
  if (mode === 'week') {
    const range = getWeekRange(week);
    return range || { error: 'Choose a valid week to filter applications.' };
  }
  if (mode === 'range') {
    if (!from || !to) return { error: 'Choose both dates for the date range.' };
    if (from > to) return { error: 'The start date must be on or before the end date.' };
    return { from, to };
  }
  return {};
}

export default function ManageApplicationsTable() {
  const now = new Date();
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [week, setWeek] = useState(getCurrentIsoWeek);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const createdDateRange = getCreatedDateRange(filterMode, month, week, dateFrom, dateTo);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
      setSelectedIds(new Set());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadPage = useCallback(async (pageNumber, signal) => {
    if (createdDateRange.error) {
      setRecords([]);
      setTotal(0);
      setError(createdDateRange.error);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        search: searchQuery,
        verifiedOnly: 'true',
        summary: 'true',
      });
      if (createdDateRange.from) params.set('createdFrom', createdDateRange.from);
      if (createdDateRange.to) params.set('createdTo', createdDateRange.to);
      const response = await fetch(`/api/esi-applications?${params.toString()}`, {
        cache: 'no-store',
        signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load verified applications.');
      setRecords(result.data);
      setTotal(result.total);
      setPage(result.page);
    } catch (loadError) {
      if (loadError.name !== 'AbortError') {
        setError(loadError.message || 'Unable to load verified applications.');
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [
    createdDateRange.error,
    createdDateRange.from,
    createdDateRange.to,
    searchQuery,
    setPage,
    setRecords,
    setTotal,
  ]);

  useEffect(() => {
    const controller = new AbortController();
    const frame = requestAnimationFrame(() => void loadPage(page, controller.signal));
    return () => {
      cancelAnimationFrame(frame);
      controller.abort();
    };
  }, [loadPage, page]);

  const updateFilter = (update) => {
    update();
    setPage(1);
    setSelectedIds(new Set());
  };

  const deleteSelected = async () => {
    if (!selectedIds.size || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const response = await fetch('/api/esi-applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeIds: [...selectedIds], verifiedOnly: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete selected applications.');

      setPendingDelete(false);
      setSelectedIds(new Set());
      const nextPage = Math.min(page, Math.max(1, Math.ceil((total - result.deletedCount) / PAGE_SIZE)));
      if (nextPage === page) {
        await loadPage(page);
      } else {
        setPage(nextPage);
      }
    } catch (requestError) {
      setDeleteError(requestError.message || 'Unable to delete selected applications.');
    } finally {
      setDeleting(false);
    }
  };

  const allCurrentPageSelected = records.length > 0 &&
    records.every((record) => selectedIds.has(record.EmpID));
  const filterChanged = (update) => updateFilter(() => {
    update();
    setDeleteError('');
  });

  return (
    <main className="esiApplicationsPage manageApplicationsPage">
      <header className="esiApplicationsHeader manageApplicationsHeader">
        <div>
          <h1>Manage applications</h1>
          <p>{total} verified application{total === 1 ? '' : 's'} in the ESI database</p>
        </div>
        <input
          className="esiApplicationsSearch"
          type="search"
          aria-label="Search verified applications"
          placeholder="Search ESI ID, employee ID, or name"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </header>

      <div className="manageApplicationsFilters">
        <label>
          Created date
          <select
            value={filterMode}
            onChange={(event) => filterChanged(() => setFilterMode(event.target.value))}
          >
            <option value="all">All dates</option>
            <option value="month">Monthly</option>
            <option value="week">Weekly</option>
            <option value="range">Date range</option>
          </select>
        </label>
        {filterMode === 'month' && (
          <label>
            Month
            <input type="month" value={month} onChange={(event) => filterChanged(() => setMonth(event.target.value))} />
          </label>
        )}
        {filterMode === 'week' && (
          <label>
            Week
            <input type="week" value={week} onChange={(event) => filterChanged(() => setWeek(event.target.value))} />
          </label>
        )}
        {filterMode === 'range' && (
          <>
            <label>
              From
              <input type="date" value={dateFrom} onChange={(event) => filterChanged(() => setDateFrom(event.target.value))} />
            </label>
            <label>
              To
              <input type="date" value={dateTo} onChange={(event) => filterChanged(() => setDateTo(event.target.value))} />
            </label>
          </>
        )}
        <button
          type="button"
          className="esiApplicationsDeleteButton"
          onClick={() => {
            setDeleteError('');
            setPendingDelete(true);
          }}
          disabled={!selectedIds.size || deleting}
        >
          Delete selected ({selectedIds.size})
        </button>
      </div>

      {error && (
        <div className="esiApplicationsMessage esiApplicationsError" role="alert">
          {error}
          {!createdDateRange.error && <button type="button" onClick={() => void loadPage(page)}>Retry</button>}
        </div>
      )}
      {deleteError && <div className="esiApplicationsMessage esiApplicationsError" role="alert">{deleteError}</div>}

      <div className="esiApplicationsTableWrap" role="region" aria-label="Verified applications" tabIndex={0}>
        <table className="esiApplicationsTable manageApplicationsTable">
          <thead>
            <tr>
              <th scope="col">
                <input
                  type="checkbox"
                  aria-label="Select all verified applications on this page"
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
              <th scope="col">Employee ID</th>
              <th scope="col">Employee name</th>
              <th scope="col">ESI ID</th>
              <th scope="col">Created date</th>
              <th scope="col">Verified by</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="esiApplicationsEmpty">Loading verified applications…</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={6} className="esiApplicationsEmpty">No verified applications found.</td></tr>
            ) : records.map((record) => (
              <tr key={record.EmpID}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select application ${record.EmpID}`}
                    checked={selectedIds.has(record.EmpID)}
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
                <td>
                  <Link href={`/dashboard/esi-applications/${encodeURIComponent(record.EmpID)}?from=manage`}>
                    {record.EmpID}
                  </Link>
                </td>
                <td>{record.EmpName}</td>
                <td>{record.ESIID || '—'}</td>
                <td>{formatDate(record.CreatedAt)}</td>
                <td>{record.VerifiedBy || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="esiApplicationsPagination manageApplicationsPagination">
        <span>Page {page} of {pageCount}</span>
        <div>
          <button
            type="button"
            onClick={() => {
              setSelectedIds(new Set());
              setPage((current) => current - 1);
            }}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedIds(new Set());
              setPage((current) => current + 1);
            }}
            disabled={page >= pageCount || loading}
          >
            Next
          </button>
        </div>
      </footer>

      {pendingDelete && (
        <div className="esiApplicationsImageOverlay" role="presentation" onClick={() => !deleting && setPendingDelete(false)}>
          <div
            className="esiApplicationsConfirmDialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="manageApplicationsDeleteTitle"
            aria-describedby="manageApplicationsDeleteMessage"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="manageApplicationsDeleteTitle">Do you want to delete these permanently?</h2>
            <p id="manageApplicationsDeleteMessage">
              This will permanently delete {selectedIds.size} selected verified application{selectedIds.size === 1 ? '' : 's'} from the database. This cannot be undone.
            </p>
            {deleteError && <p className="esiApplicationsConfirmError" role="alert">{deleteError}</p>}
            <div className="esiApplicationsConfirmActions">
              <button
                type="button"
                className="esiApplicationsCancelButton"
                onClick={() => setPendingDelete(false)}
                disabled={deleting}
              >
                No, keep them
              </button>
              <button
                type="button"
                className="esiApplicationsDeleteButton"
                onClick={() => void deleteSelected()}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
