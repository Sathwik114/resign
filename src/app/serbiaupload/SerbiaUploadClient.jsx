"use client";

import React, { useState } from "react";

export default function SerbiaUploadClient() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [activeTab, setActiveTab] = useState("inserts");
  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  // View Details of Serbia (SerbiaEmpMast table)
  const [showDetails, setShowDetails] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setPreviewData(null);
      setSuccessMessage(null);
      setSaveErrors([]);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError("Please select an Excel file (.xlsx or .xls) first.");
      return;
    }

    setLoading(true);
    setError(null);
    setPreviewData(null);
    setSuccessMessage(null);
    setSaveErrors([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/serbiaupload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze Excel file.");
      }

      setPreviewData(data);
      if (data.inserts && data.inserts.length > 0) {
        setActiveTab("inserts");
      } else if (data.updates && data.updates.length > 0) {
        setActiveTab("updates");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred during preview.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!previewData) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    setSaveErrors([]);

    try {
      const res = await fetch("/api/serbiaupload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "confirm",
          inserts: previewData.inserts,
          updates: previewData.updates,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save records.");
      }

      setSuccessMessage(data.message || "Upload process completed successfully.");
      if (data.errors && data.errors.length > 0) {
        setSaveErrors(data.errors);
      }
      setPreviewData(null);
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";

      // If details was loaded, refresh it so user sees the new data
      if (detailsData) {
        fetchDetailsData();
      }
    } catch (err) {
      setError(err.message || "An error occurred while saving records.");
    } finally {
      setSaving(false);
    }
  };

  const fetchDetailsData = async () => {
    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const res = await fetch("/api/serbiaupload");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load SerbiaEmpMast data.");
      }

      setDetailsData(data.data || []);
      setCurrentPage(1);
    } catch (err) {
      setDetailsError(err.message || "An error occurred while fetching Serbia data.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleToggleDetails = () => {
    if (!showDetails) {
      setShowDetails(true);
      if (!detailsData) {
        fetchDetailsData();
      }
    } else {
      setShowDetails(false);
    }
  };

  const filteredDetails = (detailsData || []).filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (row.NewEmpCode && String(row.NewEmpCode).toLowerCase().includes(term)) ||
      (row.TR && String(row.TR).toLowerCase().includes(term)) ||
      (row.EMPNAME && String(row.EMPNAME).toLowerCase().includes(term)) ||
      (row.TYPE && String(row.TYPE).toLowerCase().includes(term)) ||
      (row.DEPT && String(row.DEPT).toLowerCase().includes(term)) ||
      (row.Section && String(row.Section).toLowerCase().includes(term)) ||
      (row.Designation && String(row.Designation).toLowerCase().includes(term)) ||
      (row.DOJ && String(row.DOJ).toLowerCase().includes(term)) ||
      (row.AGRPERIFROM && String(row.AGRPERIFROM).toLowerCase().includes(term)) ||
      (row.AGRPERITO && String(row.AGRPERITO).toLowerCase().includes(term))
    );
  });

  const totalPages = pageSize === "all" ? 1 : Math.ceil(filteredDetails.length / pageSize) || 1;
  const paginatedDetails =
    pageSize === "all"
      ? filteredDetails
      : filteredDetails.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCsv = () => {
    if (!filteredDetails || filteredDetails.length === 0) return;
    const headers = ["NewEmpCode", "TR", "EMPNAME", "TYPE", "DOJ", "DEPT", "Section", "Designation", "AGRPERIFROM", "AGRPERITO"];
    const csvRows = [headers.join(",")];
    for (const row of filteredDetails) {
      const values = headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`);
      csvRows.push(values.join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SerbiaEmpMast_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTable = (rows) => {
    if (!rows || rows.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500 font-medium text-xs">
          No records in this category.
        </div>
      );
    }

    return (
      <div className="overflow-y-auto flex-1 min-h-0 border border-slate-200 rounded-lg w-full">
        <table className="w-full divide-y divide-slate-200 text-xs border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "6%" }} />
            <col style={{ width: "6%" }} />
          </colgroup>
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr className="divide-x divide-slate-200">
              <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">NewEmpCode</th>
              <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">TR</th>
              <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">Name</th>
              <th className="px-1 py-2.5 text-center font-semibold text-slate-700 bg-slate-50">Type</th>
              <th className="px-2 py-2.5 text-center font-semibold text-slate-700 bg-slate-50">DOJ</th>
              <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">Dept</th>
              <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">Section</th>
              <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">Designation</th>
              <th className="px-1.5 py-2.5 text-center font-semibold text-slate-700 bg-slate-50 leading-tight">Agri From</th>
              <th className="px-1.5 py-2.5 text-center font-semibold text-slate-700 bg-slate-50 leading-tight">Agri To</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 divide-x divide-slate-200 transition-colors">
                <td className="px-2.5 py-1.5 text-slate-900 font-medium whitespace-nowrap">{row.NewEmpCode}</td>
                <td className="px-2.5 py-1.5 text-slate-600 whitespace-nowrap">{row.TR}</td>
                <td className="px-2.5 py-1.5 font-medium text-slate-800 break-words">{row.EMPNAME}</td>
                <td className="px-1 py-1.5 text-center text-slate-600 whitespace-nowrap">{row.TYPE}</td>
                <td className="px-2 py-1.5 text-center text-slate-600 whitespace-nowrap">{row.DOJ || "-"}</td>
                <td className="px-2.5 py-1.5 text-slate-600 break-words">{row.DEPT}</td>
                <td className="px-2.5 py-1.5 text-slate-600 break-words">{row.Section}</td>
                <td className="px-2.5 py-1.5 text-slate-600 break-words">{row.Designation}</td>
                <td className="px-1.5 py-1.5 text-center text-slate-600 whitespace-nowrap">{row.AGRPERIFROM || "-"}</td>
                <td className="px-1.5 py-1.5 text-center text-slate-600 whitespace-nowrap">{row.AGRPERITO || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 min-h-0 overflow-hidden">
      {/* Upload Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-2.5 flex flex-col gap-2 w-full shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-bold text-sm text-slate-800">Upload Serbia Data File</h2>
            <p className="text-xs text-slate-500">
              Analyze the excel file based on <strong>NewEmpCode</strong> to identify new employee insertions vs existing employee updates.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="flex-1 text-xs text-slate-500 border border-slate-200 rounded-lg p-1.5 bg-slate-50 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          <button
            onClick={handlePreview}
            disabled={loading || !file}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shadow-sm"
          >
            {loading ? "Analyzing..." : "Analyze & Preview"}
          </button>
          <button
            type="button"
            onClick={handleToggleDetails}
            className={`px-3.5 py-2 font-semibold text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm ${
              showDetails
                ? "bg-slate-700 hover:bg-slate-800 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <span>{showDetails ? "✕" : "📋"}</span>
            <span>{showDetails ? "Hide Serbia Details" : "View Details of Serbia"}</span>
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs font-semibold text-rose-700">
            ⚠️ {error}
          </div>
        )}

        {successMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-semibold text-emerald-700">
            🎉 {successMessage}
          </div>
        )}

        {saveErrors.length > 0 && (
          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex flex-col gap-1">
            <strong className="text-xs text-amber-800">{saveErrors.length} row(s) failed during write:</strong>
            <ul className="max-h-24 overflow-y-auto text-xs text-amber-700 font-medium list-disc list-inside">
              {saveErrors.map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Details of Serbia Database Card */}
      {showDetails && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full flex-1 min-h-0">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-800">Serbia Employee Master Details</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                  SerbiaEmpMast
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium mt-0.5">
                Live records directly from the database table
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!detailsData || detailsData.length === 0}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
              >
                <span>📥</span>
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={fetchDetailsData}
                disabled={detailsLoading}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                <span className={detailsLoading ? "animate-spin" : ""}>🔄</span>
                <span>{detailsLoading ? "Loading..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Search bar & count summary */}
          <div className="px-4 py-2 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 shrink-0">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search code, name, dept, designation..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50 placeholder:text-slate-400"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium text-right whitespace-nowrap">
              {detailsData ? (
                <>
                  Showing <strong>{filteredDetails.length}</strong> of <strong>{detailsData.length}</strong> total records
                </>
              ) : (
                "Fetching records..."
              )}
            </div>
          </div>

          {/* Error */}
          {detailsError && (
            <div className="p-3 bg-rose-50 border-b border-rose-100 text-xs text-rose-700 font-semibold shrink-0">
              ⚠️ {detailsError}
            </div>
          )}

          {/* Loading state */}
          {detailsLoading && !detailsData && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-semibold text-slate-600">Loading Serbia master records...</span>
            </div>
          )}

          {/* Table view */}
          {detailsData && (
            <div className="p-3 flex-1 min-h-0 flex flex-col overflow-hidden">
              {filteredDetails.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-medium">
                  No matching employee records found.
                </div>
              ) : (
                <>
                  <div className="overflow-y-auto flex-1 min-h-0 border border-slate-200 rounded-lg w-full">
                    <table className="w-full divide-y divide-slate-200 text-xs border-collapse table-fixed">
                      <colgroup>
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "5%" }} />
                        <col style={{ width: "9%" }} />
                        <col style={{ width: "13%" }} />
                        <col style={{ width: "11%" }} />
                        <col style={{ width: "14%" }} />
                        <col style={{ width: "6%" }} />
                        <col style={{ width: "6%" }} />
                      </colgroup>
                      <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr className="divide-x divide-slate-200">
                          <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">NewEmpCode</th>
                          <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">TR</th>
                          <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">Name</th>
                          <th className="px-1 py-2.5 text-center font-semibold text-slate-700 bg-slate-50">Type</th>
                          <th className="px-2 py-2.5 text-center font-semibold text-slate-700 bg-slate-50">DOJ</th>
                          <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">Dept</th>
                          <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">Section</th>
                          <th className="px-2.5 py-2.5 text-left font-semibold text-slate-700 bg-slate-50">Designation</th>
                          <th className="px-1.5 py-2.5 text-center font-semibold text-slate-700 bg-slate-50 leading-tight">Agri From</th>
                          <th className="px-1.5 py-2.5 text-center font-semibold text-slate-700 bg-slate-50 leading-tight">Agri To</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {paginatedDetails.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 divide-x divide-slate-200 transition-colors">
                            <td className="px-2.5 py-1.5 text-slate-900 font-medium whitespace-nowrap">{row.NewEmpCode}</td>
                            <td className="px-2.5 py-1.5 text-slate-600 whitespace-nowrap">{row.TR}</td>
                            <td className="px-2.5 py-1.5 font-medium text-slate-800 break-words">{row.EMPNAME}</td>
                            <td className="px-1 py-1.5 text-center text-slate-600 whitespace-nowrap">{row.TYPE}</td>
                            <td className="px-2 py-1.5 text-center text-slate-600 whitespace-nowrap">{row.DOJ || "-"}</td>
                            <td className="px-2.5 py-1.5 text-slate-600 break-words">{row.DEPT}</td>
                            <td className="px-2.5 py-1.5 text-slate-600 break-words">{row.Section}</td>
                            <td className="px-2.5 py-1.5 text-slate-600 break-words">{row.Designation}</td>
                            <td className="px-1.5 py-1.5 text-center text-slate-600 whitespace-nowrap">{row.AGRPERIFROM || "-"}</td>
                            <td className="px-1.5 py-1.5 text-center text-slate-600 whitespace-nowrap">{row.AGRPERITO || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer - Pinned at bottom */}
                  <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 pt-2.5 px-1 text-xs text-slate-600 bg-white border-t border-slate-200 mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700 whitespace-nowrap">Rows per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          const val = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
                          setPageSize(val);
                          setCurrentPage(1);
                        }}
                        className="border border-slate-300 rounded px-2 py-1 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="all">All</option>
                      </select>
                      <span className="text-slate-300 mx-1">|</span>
                      <span className="text-slate-600 font-medium whitespace-nowrap">
                        Showing{" "}
                        <strong className="text-slate-800 font-bold">
                          {pageSize === "all" ? 1 : (currentPage - 1) * pageSize + 1}
                        </strong>{" "}
                        -{" "}
                        <strong className="text-slate-800 font-bold">
                          {pageSize === "all" ? filteredDetails.length : Math.min(currentPage * pageSize, filteredDetails.length)}
                        </strong>{" "}
                        of <strong className="text-slate-800 font-bold">{filteredDetails.length}</strong>
                      </span>
                    </div>

                    {pageSize !== "all" && totalPages > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs cursor-pointer shadow-sm transition flex items-center gap-1"
                        >
                          ◀ Prev
                        </button>
                        <span className="px-2 font-bold text-slate-800 whitespace-nowrap">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs cursor-pointer shadow-sm transition flex items-center gap-1"
                        >
                          Next ▶
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview Section - Full Page Width */}
      {previewData && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full flex-1 min-h-0">
          {/* Header / Actions */}
          <div className="px-4 py-2.5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 shrink-0">
            <div className="flex flex-col">
              <h3 className="font-bold text-sm text-slate-800">Preview Changes</h3>
              <span className="text-xs text-slate-500 font-semibold">
                Total rows: {previewData.totalRows} | Inserts: {previewData.inserts?.length || 0} | Updates: {previewData.updates?.length || 0}
              </span>
            </div>
            <button
              onClick={handleSaveToDatabase}
              disabled={saving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-lg transition cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {saving ? "Saving to Database..." : "Confirm & Save changes to Database"}
            </button>
          </div>

          {/* Tab Selectors */}
          <div className="flex border-b border-slate-200 bg-white shrink-0">
            <button
              onClick={() => setActiveTab("inserts")}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition ${
                activeTab === "inserts"
                  ? "border-blue-600 text-blue-600 bg-blue-50/10"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              New Insertions ({previewData.inserts?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("updates")}
              className={`flex-1 py-2 text-xs font-bold border-b-2 transition ${
                activeTab === "updates"
                  ? "border-blue-600 text-blue-600 bg-blue-50/10"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Updates to Existing ({previewData.updates?.length || 0})
            </button>
          </div>

          {/* Tab Panels */}
          <div className="p-3 flex-1 min-h-0 flex flex-col overflow-hidden">
            {activeTab === "inserts"
              ? renderTable(previewData.inserts)
              : renderTable(previewData.updates)}
          </div>
        </div>
      )}
    </div>
  );
}
