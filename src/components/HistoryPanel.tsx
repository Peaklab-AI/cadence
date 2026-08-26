import { useCallback, useEffect, useState } from "react";
import { Check, Clock, FileDown, X } from "lucide-react";
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
  type ProjectPeriodHistory,
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

  function openEditor(key: string, period: ProjectPeriodHistory) {
    setToggleError(null);
    setEditingKey(key);
    setInvoiceDraft(period.invoiceId ?? "");
  }

  function closeEditor() {
    setEditingKey(null);
    setInvoiceDraft("");
  }

  async function handleSaveBilled(project: Project, period: ProjectPeriodHistory) {
    const key = `${project.id}::${period.periodStartKey}`;
    setBusyKey(key);
    setToggleError(null);
    try {
      await markPeriodBilled(project.id, period.periodStartKey, invoiceDraft.trim() || null);
      setBilledPeriods(await listBilledPeriods());
      closeEditor();
    } catch (err) {
      setToggleError(toErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUnmarkBilled(project: Project, period: ProjectPeriodHistory) {
    const key = `${project.id}::${period.periodStartKey}`;
    setBusyKey(key);
    setToggleError(null);
    try {
      await unmarkPeriodBilled(project.id, period.periodStartKey);
      setBilledPeriods(await listBilledPeriods());
      closeEditor();
    } catch (err) {
      setToggleError(toErrorMessage(err));
    } finally {
      setBusyKey(null);
    }
  }

  function openClientEditor(clientId: string, currency: string) {
    setToggleError(null);
    setEditingClientCurrency({ clientId, currency });
    setClientInvoiceDraft("");
  }

  function closeClientEditor() {
    setEditingClientCurrency(null);
    setClientInvoiceDraft("");
  }

  async function handleMarkClientBilled(clientGroup: ClientHistory, currency: string) {
    const key = `${clientGroup.clientId}::${currency}`;
    setClientBusyKey(key);
    setToggleError(null);
    try {
      const invoiceId = clientInvoiceDraft.trim() || null;
      const targets = clientGroup.projects
        .filter((group) => group.currency === currency)
        .flatMap((group) => group.periods.filter((p) => !p.billed).map((p) => ({ projectId: group.projectId, periodStartKey: p.periodStartKey })));
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
                          onClick={() => openClientEditor(clientGroup.clientId, total.currency)}
                          className="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
                        >
                          Mark billed
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {editingClientCurrency?.clientId === clientGroup.clientId && (
                <div className="flex items-center gap-1.5 px-0.5">
                  <input
                    type="text"
                    autoFocus
                    value={clientInvoiceDraft}
                    onChange={(e) => setClientInvoiceDraft(e.currentTarget.value)}
                    placeholder="Invoice ID (optional)"
                    disabled={clientBusyKey === `${clientGroup.clientId}::${editingClientCurrency.currency}`}
                    className="min-w-0 flex-1 rounded-lg border-0 bg-white px-2.5 py-1.5 text-xs text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    type="button"
                    onClick={() => handleMarkClientBilled(clientGroup, editingClientCurrency.currency)}
                    disabled={clientBusyKey === `${clientGroup.clientId}::${editingClientCurrency.currency}`}
                    className="shrink-0 whitespace-nowrap rounded-full bg-brand px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
                  >
                    Mark {editingClientCurrency.currency} billed
                  </button>
                  <button
                    type="button"
                    onClick={closeClientEditor}
                    disabled={clientBusyKey === `${clientGroup.clientId}::${editingClientCurrency.currency}`}
                    className="shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 disabled:opacity-50"
                    aria-label="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

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
                          return (
                            <div key={key} className="flex flex-col gap-1 px-1 py-1">
                              <button
                                type="button"
                                onClick={() => onOpenLog(project, period.periodStart)}
                                className="flex min-w-0 items-center justify-between gap-3 rounded-lg px-1.5 py-0.5 -mx-1.5 -my-0.5 text-left transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
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
                                      onClick={() => handleSaveBilled(project, period)}
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
                                      onClick={() => handleUnmarkBilled(project, period)}
                                      disabled={isBusy}
                                      className="shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                                    >
                                      Unmark
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openEditor(key, period)}
                                    className="self-start rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                  >
                                    <Badge colorScheme="success" className="py-0.5">
                                      <Check size={12} /> Billed{period.invoiceId ? ` · ${period.invoiceId}` : ""}
                                    </Badge>
                                  </button>
                                ))}
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
