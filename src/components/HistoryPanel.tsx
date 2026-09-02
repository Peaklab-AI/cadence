import { useCallback, useEffect, useState } from "react";
import { Check, ChevronDown, ChevronRight, Clock, FileDown, X } from "lucide-react";
import {
  getReportSettings,
  listBilledPeriods,
  listTimeEntries,
  markPeriodBilled,
  saveReportPdf,
  unmarkPeriodBilled,
} from "../lib/tauriCommands";
import {
  weekLabel,
  summarizeAllHistory,
  summarizeUnbilledTotal,
  hideBilledPeriods,
  groupHistoryByClient,
  buildReportRows,
  type ClientHistory,
} from "../lib/history";
import { buildTimeLogPdf } from "../lib/pdfReport";
import type { ReportSettings } from "../types";
import { formatCurrency } from "../lib/currency";
import { toErrorMessage } from "../lib/errors";
import type { BilledPeriod, Client, Project, TimeEntry } from "../types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Switch } from "./ui/Switch";

function isoDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Parses a `type="date"` input's "YYYY-MM-DD" value as a local-midnight
 * Date, matching weekStart/weekEnd's local-time convention elsewhere in this
 * file rather than `new Date(str)`'s UTC interpretation. */
function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Short label for one day within an expanded week, e.g. "Mon, Sep 1". */
function dayHeading(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function sanitizeForFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "-");
}

interface Props {
  clients: Client[];
  projects: Project[];
  onOpenLog: (project: Project, anchor: Date) => void;
  showBilled: boolean;
  onShowBilledChange: (showBilled: boolean) => void;
  reportOpen: boolean;
}

export function HistoryPanel({ clients, projects, onOpenLog, showBilled, onShowBilledChange, reportOpen }: Props) {
  const [entries, setEntries] = useState<TimeEntry[] | null>(null);
  const [billedPeriods, setBilledPeriods] = useState<BilledPeriod[] | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [invoiceDraft, setInvoiceDraft] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  // Which weeks (keyed `${projectId}::${periodStartKey}`) are expanded to
  // show their day-by-day breakdown — only meaningful for hourly/daily-
  // interval projects (weekly-interval periods have no `days` to expand).
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  // Marking billed happens once per client per currency (covering every
  // currently-unbilled period across that client's projects sharing the
  // currency), rather than one at a time per period — a client's invoice
  // covers everything owed at once, so that's the unit that gets a single
  // invoice ID. Individual periods keep their own Unmark/edit for
  // after-the-fact corrections (see editingKey above).
  const [editingClientCurrency, setEditingClientCurrency] = useState<{ clientId: string; currency: string } | null>(
    null,
  );
  const [clientInvoiceDraft, setClientInvoiceDraft] = useState("");
  const [clientBusyKey, setClientBusyKey] = useState<string | null>(null);
  // Which unbilled periods (within the client+currency currently being
  // edited) are checked for this bulk mark — keyed the same as busyKey,
  // `${projectId}::${periodStartKey}`. Defaults to "all" when the editor
  // opens (matching the old all-or-nothing behavior), but Paul can uncheck
  // periods he's already billed outside the app before confirming.
  const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set());
  const [toggleError, setToggleError] = useState<string | null>(null);
  // Separate from `toggleError` (which is scoped to mark/unmark-billed
  // actions and gets cleared the moment any of those runs) so a failed
  // initial load doesn't get silently wiped before the user can see or
  // retry it.
  const [loadError, setLoadError] = useState<string | null>(null);

  const now = new Date();
  const [reportStart, setReportStart] = useState(() => isoDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [reportEnd, setReportEnd] = useState(() => isoDateInput(now));
  const [reportClientId, setReportClientId] = useState("");
  const [reportProjectId, setReportProjectId] = useState("");
  const [reportIncludePricing, setReportIncludePricing] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportSavedPath, setReportSavedPath] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSettings, setReportSettings] = useState<ReportSettings | null>(null);

  const loadHistory = useCallback(() => {
    listTimeEntries()
      .then((data) => {
        setEntries(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError(toErrorMessage(err)));
    listBilledPeriods()
      .then((data) => {
        setBilledPeriods(data);
        setLoadError(null);
      })
      .catch((err) => setLoadError(toErrorMessage(err)));
    getReportSettings()
      .then(setReportSettings)
      .catch((err) => setLoadError(toErrorMessage(err)));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function openEditor(key: string, invoiceId: string | null) {
    setToggleError(null);
    setEditingKey(key);
    setInvoiceDraft(invoiceId ?? "");
  }

  function closeEditor() {
    setEditingKey(null);
    setInvoiceDraft("");
  }

  /** Marks/unmarks a single billing unit — a week for weekly-interval
   * projects, a day for hourly/daily-interval projects (see
   * `billedPeriodKeyFor` in history.ts, the same key shape used here). */
  async function handleSaveBilled(projectId: string, periodStartKey: string) {
    const key = `${projectId}::${periodStartKey}`;
    setBusyKey(key);
    setToggleError(null);
    try {
      await markPeriodBilled(projectId, periodStartKey, invoiceDraft.trim() || null);
      setBilledPeriods(await listBilledPeriods());
      closeEditor();
    } catch (err) {
      setToggleError(toErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUnmarkBilled(projectId: string, periodStartKey: string) {
    const key = `${projectId}::${periodStartKey}`;
    setBusyKey(key);
    setToggleError(null);
    try {
      await unmarkPeriodBilled(projectId, periodStartKey);
      setBilledPeriods(await listBilledPeriods());
      closeEditor();
    } catch (err) {
      setToggleError(toErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  function toggleExpanded(key: string) {
    setExpandedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  /** Every unbilled-period key for one client+currency — a week key
   * (`${projectId}::${periodStartKey}`) for weekly-interval projects, or one
   * day key (`${projectId}::${dayKey}`) per unbilled day for hourly/daily-
   * interval projects. The default "select all" state when the bulk editor
   * opens, and what "All" resets the selection back to. */
  function unbilledKeysFor(clientGroup: ClientHistory, currency: string): string[] {
    return clientGroup.projects
      .filter((group) => group.currency === currency)
      .flatMap((group) =>
        group.periods.flatMap((p) =>
          p.days
            ? p.days.filter((d) => !d.billed).map((d) => `${group.projectId}::${d.dayKey}`)
            : p.billed
              ? []
              : [`${group.projectId}::${p.periodStartKey}`],
        ),
      );
  }

  function openClientEditor(clientGroup: ClientHistory, currency: string) {
    setToggleError(null);
    setEditingClientCurrency({ clientId: clientGroup.clientId, currency });
    setClientInvoiceDraft("");
    setSelectedPeriods(new Set(unbilledKeysFor(clientGroup, currency)));
  }

  function closeClientEditor() {
    setEditingClientCurrency(null);
    setClientInvoiceDraft("");
    setSelectedPeriods(new Set());
  }

  function togglePeriodSelection(key: string) {
    setSelectedPeriods((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleMarkClientBilled(clientGroup: ClientHistory, currency: string) {
    const key = `${clientGroup.clientId}::${currency}`;
    setClientBusyKey(key);
    setToggleError(null);
    try {
      const invoiceId = clientInvoiceDraft.trim() || null;
      const targets = clientGroup.projects
        .filter((group) => group.currency === currency)
        .flatMap((group) =>
          group.periods.flatMap((p) =>
            p.days
              ? p.days
                  .filter((d) => !d.billed && selectedPeriods.has(`${group.projectId}::${d.dayKey}`))
                  .map((d) => ({ projectId: group.projectId, periodStartKey: d.dayKey }))
              : !p.billed && selectedPeriods.has(`${group.projectId}::${p.periodStartKey}`)
                ? [{ projectId: group.projectId, periodStartKey: p.periodStartKey }]
                : [],
          ),
        );
      await Promise.all(targets.map((t) => markPeriodBilled(t.projectId, t.periodStartKey, invoiceId)));
      setBilledPeriods(await listBilledPeriods());
      closeClientEditor();
    } catch (err) {
      setToggleError(toErrorMessage(err));
    } finally {
      setClientBusyKey(null);
    }
  }

  function handleReportClientChange(clientId: string) {
    setReportClientId(clientId);
    // Drop a project selection that no longer belongs to the newly chosen
    // client, rather than silently keeping a stale cross-client filter.
    const project = projects.find((p) => p.id === reportProjectId);
    if (clientId && project && project.clientId !== clientId) {
      setReportProjectId("");
    }
  }

  async function handleGenerateReport() {
    if (!entries) return;
    setReportBusy(true);
    setReportError(null);
    setReportSavedPath(null);
    try {
      const start = parseDateInput(reportStart);
      const endInclusive = parseDateInput(reportEnd);
      const end = new Date(endInclusive.getFullYear(), endInclusive.getMonth(), endInclusive.getDate() + 1);
      const filter = { clientId: reportClientId || null, projectId: reportProjectId || null };
      const sections = buildReportRows(entries, projects, clients, billedPeriods ?? [], start, end, filter);
      const bytes = await buildTimeLogPdf(
        sections,
        { start, end },
        {
          title: reportSettings?.title ?? null,
          logoDataUrl: reportSettings?.logoDataUrl ?? null,
        },
        reportIncludePricing,
      );

      const selectedProject = projects.find((p) => p.id === reportProjectId);
      const selectedClient =
        clients.find((c) => c.id === reportClientId) ??
        (selectedProject ? clients.find((c) => c.id === selectedProject.clientId) : undefined);
      const scopeName = selectedProject
        ? `${selectedClient?.name ?? "Unknown client"} - ${selectedProject.name}`
        : (selectedClient?.name ?? "All clients");
      const filename = `${sanitizeForFilename(scopeName)} Report ${reportStart} to ${reportEnd}.pdf`;
      const path = await saveReportPdf(filename, bytes);
      setReportSavedPath(path);
    } catch (err) {
      setReportError(toErrorMessage(err));
    } finally {
      setReportBusy(false);
    }
  }

  const loading = entries === null || billedPeriods === null;
  const groups = loading ? [] : summarizeAllHistory(entries, projects, clients, billedPeriods, now);
  const visibleGroups = showBilled ? groups : hideBilledPeriods(groups);
  const clientGroups = groupHistoryByClient(visibleGroups, projects);
  const allBilledHidden = !showBilled && groups.length > 0 && clientGroups.length === 0;
  const reportProjectOptions = reportClientId
    ? projects.filter((p) => p.clientId === reportClientId)
    : projects;
  const reportRangeValid = reportStart !== "" && reportEnd !== "" && reportStart <= reportEnd;

  return (
    <div className="space-y-4">
      {reportOpen && (
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
          <div className="flex items-center gap-1.5">
            {/* Native date/select inputs, not the custom dropdown Select —
                their popups are drawn by the OS so they never need to grow
                the app window (same reasoning as ProjectForm's currency
                select). */}
            <input
              type="date"
              aria-label="Report start date"
              value={reportStart}
              onChange={(e) => setReportStart(e.currentTarget.value)}
              className="min-w-0 flex-1 rounded-lg border-0 bg-white px-2 py-1.5 text-xs text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <span className="shrink-0 text-xs text-slate-400">to</span>
            <input
              type="date"
              aria-label="Report end date"
              value={reportEnd}
              onChange={(e) => setReportEnd(e.currentTarget.value)}
              className="min-w-0 flex-1 rounded-lg border-0 bg-white px-2 py-1.5 text-xs text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Report client filter"
              value={reportClientId}
              onChange={(e) => handleReportClientChange(e.currentTarget.value)}
              className="min-w-0 flex-1 rounded-lg border-0 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">All clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Report project filter"
              value={reportProjectId}
              onChange={(e) => setReportProjectId(e.currentTarget.value)}
              className="min-w-0 flex-1 rounded-lg border-0 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">All projects</option>
              {reportProjectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between px-0.5">
            <Switch checked={reportIncludePricing} onChange={setReportIncludePricing} label="Include pricing" />
          </div>
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={handleGenerateReport}
            disabled={!entries || !reportRangeValid || reportBusy}
          >
            <FileDown size={13} /> {reportBusy ? "Generating…" : "Generate PDF Report"}
          </Button>
          {reportError && <p className="text-center text-xs text-red-600">{reportError}</p>}
          {reportSavedPath && !reportError && (
            <p className="text-center text-xs text-slate-400">Saved to {reportSavedPath}</p>
          )}
        </div>
      )}

      {toggleError && <p className="text-center text-xs text-red-600">{toggleError}</p>}

      {loading && loadError ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-xs text-red-600">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadHistory}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">No time tracked</p>
            <p className="mt-0.5 text-xs text-slate-400">Nothing logged yet.</p>
          </div>
        </div>
      ) : allBilledHidden ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <Check size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">All caught up</p>
            <p className="mt-0.5 text-xs text-slate-400">Every tracked period has been billed.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onShowBilledChange(true)}>
            Show billed
          </Button>
        </div>
      ) : (
        <div className="space-y-4 border-t border-slate-100 pt-3">
          {clientGroups.map((clientGroup) => (
            <div key={clientGroup.clientId} className="space-y-2">
              <div className="flex items-center justify-between gap-2 px-0.5">
                <p className="truncate text-sm font-semibold text-slate-900">{clientGroup.clientName}</p>
                {clientGroup.unbilledTotals.length > 0 && (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {clientGroup.unbilledTotals.map((total) => (
                      <div key={total.currency} className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold tabular-nums text-slate-900">
                          {formatCurrency(total.amount, total.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => openClientEditor(clientGroup, total.currency)}
                          className="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
                        >
                          Mark billed
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editingClientCurrency?.clientId === clientGroup.clientId &&
                (() => {
                  const currency = editingClientCurrency.currency;
                  const busy = clientBusyKey === `${clientGroup.clientId}::${currency}`;
                  const allKeys = unbilledKeysFor(clientGroup, currency);
                  return (
                    <div className="space-y-1.5 px-0.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {selectedPeriods.size} of {allKeys.length} selected — check each week (or open a week to
                          check individual days) to include or exclude it
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPeriods(new Set(allKeys))}
                            disabled={busy}
                            className="font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
                          >
                            All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedPeriods(new Set())}
                            disabled={busy}
                            className="font-medium text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
                          >
                            None
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={clientInvoiceDraft}
                          onChange={(e) => setClientInvoiceDraft(e.currentTarget.value)}
                          placeholder="Invoice ID (optional)"
                          disabled={busy}
                          className="min-w-0 flex-1 rounded-lg border-0 bg-white px-2.5 py-1.5 text-xs text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                        <button
                          type="button"
                          onClick={() => handleMarkClientBilled(clientGroup, currency)}
                          disabled={busy || selectedPeriods.size === 0}
                          className="shrink-0 whitespace-nowrap rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                        >
                          Mark {selectedPeriods.size} billed
                        </button>
                        <button
                          type="button"
                          onClick={closeClientEditor}
                          disabled={busy}
                          className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 disabled:opacity-50"
                          aria-label="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })()}

              <div className="space-y-2">
                {clientGroup.projects.map((group) => {
                  const project = projects.find((p) => p.id === group.projectId);
                  if (!project) return null;
                  const unbilledTotal = summarizeUnbilledTotal(group, project);
                  return (
                    <div key={group.projectId} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2">
                      <div className="flex items-center justify-between gap-2 px-0.5">
                        <p className="truncate text-sm font-medium text-slate-700">{group.projectName}</p>
                        <div className="shrink-0 text-right">
                          <span className="block text-sm font-semibold tabular-nums text-slate-900">
                            {unbilledTotal.display}
                          </span>
                          {unbilledTotal.amount !== null && (
                            <span className="block text-xs tabular-nums text-slate-400">
                              {formatCurrency(unbilledTotal.amount, group.currency)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-1.5 divide-y divide-slate-200/80 border-t border-slate-200/80">
                        {group.periods.map((period) => {
                          const key = `${group.projectId}::${period.periodStartKey}`;
                          const isEditing = editingKey === key;
                          const isBusy = busyKey === key;
                          const inClientEditScope =
                            editingClientCurrency?.clientId === clientGroup.clientId &&
                            editingClientCurrency.currency === group.currency;
                          const selectionBusy =
                            inClientEditScope && clientBusyKey === `${clientGroup.clientId}::${group.currency}`;
                          const isExpanded = expandedPeriods.has(key);

                          // Weekly-interval periods have no `days` breakdown — a single
                          // week-level checkbox/badge, exactly as before.
                          if (!period.days) {
                            const inSelectionScope = !period.billed && inClientEditScope;
                            const isSelected = inSelectionScope && selectedPeriods.has(key);
                            return (
                              <div
                                key={key}
                                className={`flex flex-col gap-1 px-1 py-1 ${isSelected ? "rounded-lg bg-brand/5" : ""}`}
                              >
                                <div className="flex items-center gap-2">
                                  {inSelectionScope && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => togglePeriodSelection(key)}
                                      disabled={selectionBusy}
                                      aria-label={`Include ${weekLabel(period.periodStart, now)} in this bulk mark`}
                                      className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                                    />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onOpenLog(project, period.periodStart)}
                                    className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-1.5 py-0.5 -mx-1.5 -my-0.5 text-left transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                  >
                                    <span className="truncate text-xs text-slate-700">
                                      {weekLabel(period.periodStart, now)}
                                    </span>
                                    <span className="shrink-0 text-right">
                                      <span className="block text-xs tabular-nums text-slate-900">
                                        {period.display}
                                      </span>
                                      {period.amount !== null && (
                                        <span className="block text-xs tabular-nums text-slate-400">
                                          {formatCurrency(period.amount, group.currency)}
                                        </span>
                                      )}
                                    </span>
                                  </button>
                                </div>

                                {project.rate !== null &&
                                  period.billed &&
                                  (isEditing ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        autoFocus
                                        value={invoiceDraft}
                                        onChange={(e) => setInvoiceDraft(e.currentTarget.value)}
                                        placeholder="Invoice ID (optional)"
                                        disabled={isBusy}
                                        className="min-w-0 flex-1 rounded-lg border-0 bg-white px-2.5 py-1.5 text-xs text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveBilled(project.id, period.periodStartKey)}
                                        disabled={isBusy}
                                        className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={closeEditor}
                                        disabled={isBusy}
                                        className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 disabled:opacity-50"
                                        aria-label="Cancel"
                                      >
                                        <X size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUnmarkBilled(project.id, period.periodStartKey)}
                                        disabled={isBusy}
                                        className="shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                                      >
                                        Unmark
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => openEditor(key, period.invoiceId)}
                                      className="self-start rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                    >
                                      <Badge colorScheme="success" className="py-0.5">
                                        <Check size={12} /> Billed{period.invoiceId ? ` · ${period.invoiceId}` : ""}
                                      </Badge>
                                    </button>
                                  ))}
                              </div>
                            );
                          }

                          // Hourly/daily-interval periods: a week-level row that expands
                          // to individual, independently billable days.
                          const days = period.days;
                          const unbilledDayKeys = days
                            .filter((d) => !d.billed)
                            .map((d) => `${group.projectId}::${d.dayKey}`);
                          const inSelectionScope = unbilledDayKeys.length > 0 && inClientEditScope;
                          const selectedCount = unbilledDayKeys.filter((k) => selectedPeriods.has(k)).length;
                          const allSelected = inSelectionScope && selectedCount === unbilledDayKeys.length;
                          const someSelected = inSelectionScope && selectedCount > 0 && !allSelected;
                          const billedDayCount = days.length - unbilledDayKeys.length;

                          return (
                            <div key={key} className="flex flex-col gap-1 px-1 py-1">
                              <div className="flex items-center gap-2">
                                {inSelectionScope && (
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                      if (el) el.indeterminate = someSelected;
                                    }}
                                    onChange={() =>
                                      setSelectedPeriods((prev) => {
                                        const next = new Set(prev);
                                        if (allSelected) unbilledDayKeys.forEach((k) => next.delete(k));
                                        else unbilledDayKeys.forEach((k) => next.add(k));
                                        return next;
                                      })
                                    }
                                    disabled={selectionBusy}
                                    aria-label={`Include all unbilled days in ${weekLabel(period.periodStart, now)} in this bulk mark`}
                                    className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(key)}
                                  aria-label={isExpanded ? "Collapse" : "Expand"}
                                  aria-expanded={isExpanded}
                                  className="shrink-0 rounded-full p-0.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
                                >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOpenLog(project, period.periodStart)}
                                  className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg px-1.5 py-0.5 -mx-1.5 -my-0.5 text-left transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                >
                                  <span className="truncate text-xs text-slate-700">
                                    {weekLabel(period.periodStart, now)}
                                  </span>
                                  <span className="shrink-0 text-right">
                                    <span className="block text-xs tabular-nums text-slate-900">
                                      {period.display}
                                    </span>
                                    {period.amount !== null && (
                                      <span className="block text-xs tabular-nums text-slate-400">
                                        {formatCurrency(period.amount, group.currency)}
                                      </span>
                                    )}
                                  </span>
                                </button>
                              </div>

                              {project.rate !== null &&
                                (period.billed ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpanded(key)}
                                    className="ml-6 self-start rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                  >
                                    <Badge colorScheme="success" className="py-0.5">
                                      <Check size={12} /> Billed{period.invoiceId ? ` · ${period.invoiceId}` : ""}
                                    </Badge>
                                  </button>
                                ) : (
                                  billedDayCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpanded(key)}
                                      className="ml-6 self-start text-xs text-slate-400 underline-offset-2 hover:underline"
                                    >
                                      {billedDayCount} of {days.length} days billed
                                    </button>
                                  )
                                ))}

                              {isExpanded && (
                                <div className="ml-6 mt-1 space-y-1 border-l border-slate-200/80 pl-2">
                                  {days.map((day) => {
                                    const dayKeyFull = `${group.projectId}::${day.dayKey}`;
                                    const dayIsEditing = editingKey === dayKeyFull;
                                    const dayIsBusy = busyKey === dayKeyFull;
                                    const daySelected = inClientEditScope && selectedPeriods.has(dayKeyFull);
                                    return (
                                      <div
                                        key={dayKeyFull}
                                        className={`flex flex-col gap-1 py-0.5 ${daySelected ? "rounded-lg bg-brand/5" : ""}`}
                                      >
                                        <div className="flex items-center gap-2">
                                          {!day.billed && inClientEditScope && (
                                            <input
                                              type="checkbox"
                                              checked={daySelected}
                                              onChange={() => togglePeriodSelection(dayKeyFull)}
                                              disabled={selectionBusy}
                                              aria-label={`Include ${dayHeading(day.day)} in this bulk mark`}
                                              className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
                                            />
                                          )}
                                          <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-1.5 py-0.5">
                                            <span className="truncate text-xs text-slate-500">
                                              {dayHeading(day.day)}
                                            </span>
                                            <span className="shrink-0 text-right">
                                              <span className="block text-xs tabular-nums text-slate-700">
                                                {day.display}
                                              </span>
                                              {day.amount !== null && (
                                                <span className="block text-xs tabular-nums text-slate-400">
                                                  {formatCurrency(day.amount, group.currency)}
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                        </div>

                                        {project.rate !== null &&
                                          day.billed &&
                                          (dayIsEditing ? (
                                            <div className="flex items-center gap-1.5">
                                              <input
                                                type="text"
                                                autoFocus
                                                value={invoiceDraft}
                                                onChange={(e) => setInvoiceDraft(e.currentTarget.value)}
                                                placeholder="Invoice ID (optional)"
                                                disabled={dayIsBusy}
                                                className="min-w-0 flex-1 rounded-lg border-0 bg-white px-2.5 py-1.5 text-xs text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleSaveBilled(project.id, day.dayKey)}
                                                disabled={dayIsBusy}
                                                className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                                              >
                                                Save
                                              </button>
                                              <button
                                                type="button"
                                                onClick={closeEditor}
                                                disabled={dayIsBusy}
                                                className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 disabled:opacity-50"
                                                aria-label="Cancel"
                                              >
                                                <X size={14} />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleUnmarkBilled(project.id, day.dayKey)}
                                                disabled={dayIsBusy}
                                                className="shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                                              >
                                                Unmark
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => openEditor(dayKeyFull, day.invoiceId)}
                                              className="self-start rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                            >
                                              <Badge colorScheme="success" className="py-0.5">
                                                <Check size={12} /> Billed{day.invoiceId ? ` · ${day.invoiceId}` : ""}
                                              </Badge>
                                            </button>
                                          ))}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
