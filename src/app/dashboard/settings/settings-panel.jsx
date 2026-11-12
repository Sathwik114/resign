'use client';

import { useEffect, useState } from 'react';
import './settings.css';

const PAGE_SIZE = 10;

function formatDeletedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.day}/${values.month}/${values.year} ${values.hour}:${values.minute} ${values.dayPeriod.toUpperCase()}`;
}

function formatDeletionRange(value) {
  const formatDate = (dateValue) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue || '')) return dateValue;
    const [year, month, day] = dateValue.split('-');
    return `${day}/${month}/${year}`;
  };
  const dateFilter = /^Date: (\d{4}-\d{2}-\d{2})$/.exec(value);
  if (dateFilter) return `Date: ${formatDate(dateFilter[1])}`;
  const range = /^(\d{4}-\d{2}-\d{2}) - (\d{4}-\d{2}-\d{2})$/.exec(value);
  if (range) return `${formatDate(range[1])} - ${formatDate(range[2])}`;
  return value;
}

export default function SettingsPanel() {
  const [enabled, setEnabled] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deletedHistory, setDeletedHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/esiform/settings', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load ESI form settings.');
        setEnabled(result.enabled);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setError(loadError.message || 'Unable to load ESI form settings.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadSettings();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadDeletedHistory = async () => {
      try {
        const response = await fetch('/api/esi-applications/deleted-history', {
          cache: 'no-store',
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load deleted history.');
        setDeletedHistory(result.data);
        setHistoryPage(1);
      } catch (loadError) {
        if (loadError.name !== 'AbortError') {
          setHistoryError(loadError.message || 'Unable to load deleted history.');
        }
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    };

    void loadDeletedHistory();
    return () => controller.abort();
  }, []);

  const setFormEnabled = async (nextEnabled) => {
    if (enabled === null || saving || nextEnabled === enabled) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/esiform/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update ESI form settings.');
      setEnabled(result.enabled);
    } catch (saveError) {
      setError(saveError.message || 'Unable to update ESI form settings.');
    } finally {
      setSaving(false);
    }
  };

  const hasRows = !historyLoading && !historyError && deletedHistory.length > 0;
  const totalPages = Math.max(1, Math.ceil(deletedHistory.length / PAGE_SIZE));
  const currentPage = Math.min(historyPage, totalPages);
  const visibleHistory = deletedHistory.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      {/* ---------- Settings: title outside the box, top left ---------- */}
      <section className="settingsSection" aria-labelledby="settingsTitle">
        <div className="sectionTitle">
          <h1 id="settingsTitle">Settings</h1>
          <p>Manage availability of the employee ESI form.</p>
        </div>

        <div className="settingsBox">
          <div className="settingsCurrentStatus">
            <h2 className="settingsOptionName">Employee ESI form status:</h2>
            <span className={`settingsStatus${enabled ? ' isEnabled' : enabled === false ? ' isDisabled' : ''}`} role="status">
              {loading ? 'Loading…' : enabled === null ? 'Unavailable' : enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="settingsControls">
            <span className="settingsDivider" aria-hidden="true" />
            <div className={`settingsSwitch${enabled === true ? ' isEnabled' : enabled === false ? ' isDisabled' : ''}`} role="group" aria-label="ESI form availability">
              <button
                type="button"
                className="settingsChoice isEnabledChoice"
                onClick={() => void setFormEnabled(true)}
                disabled={loading || saving || enabled === null}
                aria-pressed={enabled === true}
              >
                {saving && !enabled ? 'Saving…' : 'Enable'}
              </button>
              <button
                type="button"
                className="settingsChoice isDisabledChoice"
                onClick={() => void setFormEnabled(false)}
                disabled={loading || saving || enabled === null}
                aria-pressed={enabled === false}
              >
                {saving && enabled ? 'Saving…' : 'Disable'}
              </button>
            </div>
          </div>

          {error && <p className="settingsError" role="alert">{error}</p>}
        </div>
      </section>

      {/* ---------- Deleted history: title outside the box, top left ---------- */}
      <section className="settingsSection" aria-labelledby="deletedHistoryTitle">
        <div className="sectionTitle">
          <h2 id="deletedHistoryTitle">ESI Applications Deleted history</h2>
        </div>

        {historyError && <p className="settingsError settingsErrorBlock" role="alert">{historyError}</p>}

        <div className="tableBox">
          <div className="tableScroll">
            <table className="deletedHistoryTable">
              <thead>
                <tr>
                  <th scope="col">S.No.</th>
                  <th scope="col">EmpID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Deletion Range</th>
                  <th scope="col">Deleted at</th>
                  <th scope="col">Rows deleted</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr><td colSpan="6">Loading deleted history…</td></tr>
                ) : historyError ? (
                  <tr><td colSpan="6">History could not be loaded.</td></tr>
                ) : deletedHistory.length === 0 ? (
                  <tr><td colSpan="6">No deleted applications recorded.</td></tr>
                ) : visibleHistory.map((entry, index) => (
                  <tr className="deletedRow" key={`${entry.EmpID}-${entry.DeletedAt}-${index}`}>
                    <td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td>{entry.EmpID}</td>
                    <td>{entry.EmpName}</td>
                    <td>{formatDeletionRange(entry.Range)}</td>
                    <td>{formatDeletedAt(entry.DeletedAt)}</td>
                    <td>{entry.ApplCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasRows && (
            <div className="deletedPager">
              <span className="pagerInfo" aria-live="polite">
                Page {currentPage} of {totalPages} · {deletedHistory.length}{' '}
                {deletedHistory.length === 1 ? 'entry' : 'entries'}
              </span>
              <div className="pagerButtons">
                <button
                  type="button"
                  className="pagerBtn"
                  onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage <= 1}
                >
                  ‹ Prev
                </button>
                <button
                  type="button"
                  className="pagerBtn"
                  onClick={() => setHistoryPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}