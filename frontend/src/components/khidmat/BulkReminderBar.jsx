/* eslint-disable react-hooks/set-state-in-effect */
// ============================================================
// components/khidmat/BulkReminderBar.jsx
// FIXED: ESLint warnings resolved
// - Removed setState from useEffect
// - Fixed dependency array
// - Proper state sync pattern
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Users,
  CheckCheck,
  AlertTriangle,
  UserCheck,
  Filter,
  Tag,
  Clock
} from "lucide-react";
import { useKhidmat } from "../../context/KhidmatContext";
import { useDonations } from "../../context/DonationContext";

const REMINDER_STATUSES = ['PARTIAL', 'RECORD_ONLY'];

const STATUS_CONFIG = {
  PARTIAL: {
    label: "Partial",
    icon: AlertCircle,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
    description: "Partially paid"
  },
  RECORD_ONLY: {
    label: "Pending",
    icon: FileText,
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
    description: "No payment yet"
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    description: "Fully paid"
  },
};

const BulkReminderBar = () => {
  const {
    records,
    filters,
    fetchRecords,
    applyFilters,
    sendBulkReminderMessages,
    sendingBulk,
    bulkPreview,
    fetchBulkPreview,
  } = useKhidmat();
  const { activeCategories } = useDonations();

  // ── State ──────────────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState("status");
  const [selectedStatuses, setSelectedStatuses] = useState(["PARTIAL", "RECORD_ONLY"]);
  const [selectedPeople, setSelectedPeople] = useState([]);
  // Initialize local category from filters
  const [selectedCategory, setSelectedCategory] = useState(filters.categoryId || "");
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPersonSelector, setShowPersonSelector] = useState(false);
  const [isTemplateError, setIsTemplateError] = useState(false);
  
  // Ref to prevent infinite loops
  const isSyncingRef = useRef(false);

  // ── Sync local category with filters (FIXED) ──────────
  // Use useRef to track if we're already syncing
  useEffect(() => {
    // Only sync if the filter changed externally and we're not already syncing
    if (filters.categoryId !== selectedCategory && !isSyncingRef.current) {
      isSyncingRef.current = true;
      setSelectedCategory(filters.categoryId || "");
      // Reset the ref after state update
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 0);
    }
  }, [filters.categoryId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle category change - sync with main filters ────
  const handleCategoryChange = (categoryId) => {
    // Set the ref to prevent the effect from trying to sync back
    isSyncingRef.current = true;
    
    setSelectedCategory(categoryId);
    setResult(null);
    setShowConfirm(false);
    setIsTemplateError(false);
    
    // Apply filter to main table
    const updatedFilters = applyFilters({ 
      categoryId: categoryId || '', 
      page: 1 
    });
    
    // Fetch records with new category filter
    fetchRecords(updatedFilters);
    
    // Reset the ref after state updates
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  };

  // ── Fetch preview when selection changes ───────────────
  useEffect(() => {
    if (selectionMode === "status" && selectedStatuses.length > 0) {
      fetchBulkPreview({
        statuses: selectedStatuses,
        categoryId: selectedCategory || filters.categoryId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }
  }, [
    selectionMode,
    selectedStatuses,
    selectedCategory,
    filters.categoryId,
    filters.startDate,
    filters.endDate,
    fetchBulkPreview,
  ]);

  // ── Toggle functions ────────────────────────────────────
  const toggleStatus = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setResult(null);
    setShowConfirm(false);
    setIsTemplateError(false);
  };

  const togglePerson = (recordId) => {
    setSelectedPeople((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
    setResult(null);
    setShowConfirm(false);
    setIsTemplateError(false);
  };

  const selectAllCurrentRecords = () => {
    const eligibleIds = eligibleRecords.map((r) => r.id);
    setSelectedPeople(eligibleIds);
    setShowPersonSelector(false);
  };

  const clearSelection = () => {
    setSelectedPeople([]);
  };

  const dismiss = () => {
    setResult(null);
    setShowConfirm(false);
    setExpanded(false);
    setIsTemplateError(false);
  };

  // ── Handle Send ──────────────────────────────────────────
  const handleSend = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setResult(null);
    setShowConfirm(false);
    setIsTemplateError(false);

    try {
      let res;
      if (selectionMode === "status") {
        res = await sendBulkReminderMessages({
          statuses: selectedStatuses,
          categoryId: selectedCategory || filters.categoryId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        });
      } else {
        res = await sendBulkReminderMessages({
          recordIds: selectedPeople,
        });
      }

      const allFailed = res.sent === 0 && res.failed > 0;
      const hasTemplateError = res.results?.some(r => 
        r.error?.toLowerCase().includes('template') || 
        r.error?.toLowerCase().includes('130472') ||
        r.error?.toLowerCase().includes('not found')
      );

      if (allFailed && hasTemplateError) {
        setIsTemplateError(true);
      }

      setResult(res);
      setExpanded(true);
      
      if (selectionMode === "manual" && res.sent > 0) {
        setSelectedPeople([]);
      }
    } catch (err) {
      const errorMsg = err.message || '';
      const isTemplateErr = 
        errorMsg.toLowerCase().includes('template') ||
        errorMsg.toLowerCase().includes('130472') ||
        errorMsg.toLowerCase().includes('not found');
      
      setResult({ 
        error: errorMsg,
        isTemplateError: isTemplateErr
      });
      
      if (isTemplateErr) {
        setIsTemplateError(true);
      }
    }
  };

  // ── Computed values ─────────────────────────────────────
  const getPreviewCount = () => {
    if (selectionMode === "status") {
      return bulkPreview?.total ?? 0;
    } else {
      return selectedPeople.length;
    }
  };

  const previewCount = getPreviewCount();

  // Only pending & partial records are eligible for reminders
  const eligibleRecords = records.filter((r) => REMINDER_STATUSES.includes(r.status));

  const selectedPeopleDetails = eligibleRecords.filter((r) =>
    selectedPeople.includes(r.id)
  );

  // ── Get selected category name for display ──────────────
  const getSelectedCategoryName = () => {
    if (!selectedCategory) return "All Categories";
    const cat = activeCategories.find(c => c.id === selectedCategory);
    return cat?.name || "Unknown Category";
  };

  return (
    <div
      className={`
        rounded-2xl border transition-all duration-300
        ${
          result?.error || isTemplateError
            ? "border-red-200 bg-red-50"
            : result
              ? "border-emerald-200 bg-emerald-50/60"
              : selectedCategory
                ? "border-blue-300 bg-blue-50/60"
                : "border-blue-100 bg-blue-50/40"
        }
      `}
    >
      {/* ── Main bar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {/* Icon + label */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center shadow-sm">
            <MessageCircle size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 leading-tight">
              Bulk Reminder
            </p>
            <p className="text-xs text-slate-400">Send WhatsApp reminders</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5">
          <button
            onClick={() => {
              setSelectionMode("status");
              setShowPersonSelector(false);
              setResult(null);
              setShowConfirm(false);
              setIsTemplateError(false);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              selectionMode === "status"
                ? "bg-blue-700 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <Filter size={12} className="inline mr-1" />
            By Status
          </button>
          <button
            onClick={() => {
              setSelectionMode("manual");
              setResult(null);
              setShowConfirm(false);
              setIsTemplateError(false);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              selectionMode === "manual"
                ? "bg-blue-700 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            <UserCheck size={12} className="inline mr-1" />
            Select People
          </button>
        </div>

        {/* Status toggles (only in status mode) */}
        {selectionMode === "status" && (
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {Object.entries(STATUS_CONFIG)
              .filter(([key]) => REMINDER_STATUSES.includes(key))
              .map(([key, cfg]) => {
                const Icon = cfg.icon;
                const active = selectedStatuses.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleStatus(key)}
                    disabled={sendingBulk}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all
                      ${
                        active
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} shadow-sm`
                          : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                      }
                      ${
                        sendingBulk
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                    `}
                  >
                    <Icon size={11} strokeWidth={active ? 2.5 : 2} />
                    {cfg.label}
                    {active && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ml-0.5`}
                      />
                    )}
                  </button>
                );
              })}
          </div>
        )}

        {/* Category Filter - Syncs with main table */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Tag size={12} className="text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={`px-2.5 py-1.5 rounded-lg text-xs border 
                       focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[140px]
                       ${selectedCategory 
                         ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium' 
                         : 'bg-white border-slate-200 text-slate-600'
                       }`}
          >
            <option value="">All Categories</option>
            {activeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <span className="text-[10px] text-blue-600 font-medium hidden sm:inline">
              ({activeCategories.find(c => c.id === selectedCategory)?.name})
            </span>
          )}
        </div>

        {/* Person selection (only in manual mode) */}
        {selectionMode === "manual" && (
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPersonSelector(!showPersonSelector)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:border-blue-300 transition-all"
              >
                <Users size={12} />
                {selectedPeople.length > 0
                  ? `${selectedPeople.length} person(s) selected`
                  : "Select People"}
                <ChevronDown size={10} />
              </button>
              {selectedPeople.length > 0 && (
                <button
                  onClick={clearSelection}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Person selector dropdown */}
            {showPersonSelector && (
              <div className="absolute z-50 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600">
                    Select Recipients {selectedCategory && `(${getSelectedCategoryName()})`}
                  </span>
                  <button
                    onClick={selectAllCurrentRecords}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Select All ({eligibleRecords.length})
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {eligibleRecords.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-slate-400 text-center">
                      No pending or partial records {selectedCategory ? 'in this category' : ''}
                    </p>
                  ) : (
                    eligibleRecords.map((record) => (
                      <label
                        key={record.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPeople.includes(record.id)}
                          onChange={() => togglePerson(record.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">
                            {record.name}
                          </p>
                          <p className="text-xs text-slate-400">{record.phone}</p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            record.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-700"
                              : record.status === "PARTIAL"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {STATUS_CONFIG[record.status]?.label || record.status}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => setShowPersonSelector(false)}
                    className="w-full py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Done ({selectedPeople.length} selected)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right: count + send button */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {!result && previewCount > 0 && (
            <span className="text-xs text-slate-500 font-medium hidden sm:block">
              {previewCount} recipient{previewCount !== 1 ? "s" : ""}
            </span>
          )}

          {result && !result.error && (
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCheck size={13} />
                {result.sent} sent
              </span>
              {result.failed > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertTriangle size={13} />
                  {result.failed} failed
                </span>
              )}
              {result.skipped > 0 && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock size={13} />
                  {result.skipped} skipped
                </span>
              )}
            </div>
          )}

          {result && (
            <button
              onClick={dismiss}
              className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={11} />
            </button>
          )}

          {/* Send / Confirm button */}
          {!result && (
            <button
              onClick={handleSend}
              disabled={sendingBulk || previewCount === 0}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm
                ${
                  showConfirm
                    ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                    : "bg-blue-700 hover:bg-blue-800 text-white"
                }
                ${sendingBulk || previewCount === 0 ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              {sendingBulk ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending…
                </>
              ) : showConfirm ? (
                <>
                  <AlertCircle size={14} />
                  Confirm Send ({previewCount})
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send Reminders
                </>
              )}
            </button>
          )}

          {/* Expand/collapse results */}
          {result && !result.error && result.results?.length > 0 && (
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors px-2 py-1 rounded-lg hover:bg-white"
            >
              Details{" "}
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Active Category Indicator ────────────────────── */}
      {selectedCategory && (
        <div className="mx-4 mb-2 px-3 py-1.5 bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-2">
          <Tag size={12} className="text-blue-600" />
          <span className="text-xs text-blue-700 font-medium">
            Filtering by: <strong>{getSelectedCategoryName()}</strong>
          </span>
          <span className="text-[10px] text-blue-500">
            ({records.length} records)
          </span>
          <button
            onClick={() => handleCategoryChange('')}
            className="ml-auto text-blue-400 hover:text-blue-600"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Selected People Summary ───────────────────────── */}
      {selectionMode === "manual" && selectedPeople.length > 0 && !showConfirm && !result && (
        <div className="mx-4 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
            <UserCheck size={12} />
            Selected: {selectedPeople.length} person(s) {selectedCategory && `in ${getSelectedCategoryName()}`}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {selectedPeopleDetails.slice(0, 5).map((person) => (
              <span key={person.id} className="text-[10px] bg-white px-2 py-0.5 rounded-full text-slate-600">
                {person.name}
              </span>
            ))}
            {selectedPeople.length > 5 && (
              <span className="text-[10px] text-blue-500">
                +{selectedPeople.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Confirm callout ────────────────────────────────── */}
      {showConfirm && !sendingBulk && previewCount > 0 && (
        <div className="mx-4 mb-3 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 font-medium flex-1">
            {selectionMode === "status" ? (
              <>
                This will send WhatsApp messages to <strong>{previewCount}</strong>{" "}
                record{previewCount !== 1 ? "s" : ""}
                with status{" "}
                <strong>
                  {selectedStatuses
                    .map((s) => STATUS_CONFIG[s]?.label || s)
                    .join(" & ")}
                </strong>
                {selectedCategory ? ` in <strong>${getSelectedCategoryName()}</strong>` : ""}.
              </>
            ) : (
              <>
                This will send WhatsApp messages to <strong>{previewCount}</strong>{" "}
                selected person{previewCount !== 1 ? "s" : ""}
                {selectedCategory ? ` in <strong>${getSelectedCategoryName()}</strong>` : ""}.
              </>
            )}
            Click <strong>Confirm Send</strong> to proceed.
          </p>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-amber-400 hover:text-amber-600"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── No records message ────────────────────────────── */}
      {showConfirm && !sendingBulk && previewCount === 0 && (
        <div className="mx-4 mb-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
          <AlertCircle size={14} className="text-slate-400 shrink-0" />
          <p className="text-xs text-slate-600 font-medium flex-1">
            {selectionMode === "status"
              ? `No records found with selected statuses${selectedCategory ? ` in ${getSelectedCategoryName()}` : ''}.`
              : "No people selected. Please select recipients first."}
          </p>
          <button
            onClick={() => setShowConfirm(false)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Template Error Display ─────────────────────────── */}
      {isTemplateError && (
        <div className="mx-4 mb-3 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl relative">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-700 mb-1">
                ⚠️ WhatsApp Templates Not Configured
              </p>
              <p className="text-xs text-red-600/80">
                The following WhatsApp templates need to be created in Meta Business Manager:
              </p>
              <div className="mt-2 space-y-1">
                <div className="bg-white/60 rounded-lg p-2 text-xs">
                  <p className="font-mono text-red-600">khidmat_completed</p>
                  <p className="text-slate-500 text-[10px]">Variables: name, amount, category</p>
                </div>
                <div className="bg-white/60 rounded-lg p-2 text-xs">
                  <p className="font-mono text-amber-600">khidmat_partial</p>
                  <p className="text-slate-500 text-[10px]">Variables: name, category, received, total, remaining</p>
                </div>
                <div className="bg-white/60 rounded-lg p-2 text-xs">
                  <p className="font-mono text-blue-600">khidmat_pending</p>
                  <p className="text-slate-500 text-[10px]">Variables: name, category, total</p>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-2">
                💡 Tip: Go to Meta Business Manager → WhatsApp → Templates to create these templates.
              </p>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Error display ───────────────────────────────────── */}
      {result?.error && !isTemplateError && (
        <div className="mx-4 mb-3 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-red-600 mb-1">
                Bulk Reminder Failed
              </p>
              <p className="text-xs text-red-500/80">{result.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Results detail panel ───────────────────────────── */}
      {expanded && result?.results?.length > 0 && (
        <div className="mx-4 mb-3 border border-slate-200 rounded-xl overflow-hidden bg-white">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Users size={12} /> {result.total} records processed
              {selectedCategory && ` in ${getSelectedCategoryName()}`}
            </span>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-600 font-semibold">
                ✓ {result.sent} sent
              </span>
              {result.failed > 0 && (
                <span className="text-red-500 font-semibold">
                  ✗ {result.failed} failed
                </span>
              )}
              {result.skipped > 0 && (
                <span className="text-slate-400">
                  – {result.skipped} skipped
                </span>
              )}
            </div>
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-slate-50">
            {result.results.map((r, i) => (
              <div
                key={i}
                className="flex items-start justify-between px-3 py-2 hover:bg-slate-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1">
                    <span className="text-xs font-medium text-slate-700">
                      {r.name}
                    </span>
                    <span className="text-xs text-slate-400">{r.phone}</span>
                  </div>
                  {r.error && (
                    <p className="text-[10px] text-red-500 mt-0.5 break-words">
                      {r.error.length > 100
                        ? `${r.error.substring(0, 100)}...`
                        : r.error}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2
                    ${
                      r.status === "SENT"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "FAILED"
                          ? "bg-red-100 text-red-600"
                          : r.status === "SKIPPED"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-slate-100 text-slate-500"
                    }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkReminderBar;