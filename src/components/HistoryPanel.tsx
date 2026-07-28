import { useCallback, useEffect, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { listBilledPeriods, listTimeEntries, markPeriodBilled, unmarkPeriodBilled } from "../lib/tauriCommands";
import { weekLabel, summarizeAllHistory, hideBilledPeriods, type ProjectPeriodHistory } from "../lib/history";
import { INTERVAL_BADGE_META } from "../lib/intervalMeta";
import { formatCurrency } from "../lib/currency";
import { toErrorMessage } from "../lib/errors";
import type { BilledPeriod, Client, Project, TimeEntry } from "../types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface Props {
  clients: Client[];
  projects: Project[];
  onOpenLog: (project: Project, anchor: Date) => void;
  showBilled: boolean;
  onShowBilledChange: (showBilled: boolean) => void;
}

export function HistoryPanel({ clients, projects, onOpenLog, showBilled, onShowBilledChange }: Props) {
  const [entries, setEntries] = useState<TimeEntry[] | null>(null);
  const [billedPeriods, setBilledPeriods] = useState<BilledPeriod[] | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [invoiceDraft, setInvoiceDraft] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  // Separate from `toggleError` (which is scoped to mark/unmark-billed
  // actions and gets cleared the moment any of those runs) so a failed
  // initial load doesn't get silently wiped before the user can see or
  // retry it.
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const now = new Date();
  const loading = entries === null || billedPeriods === null;
  const groups = loading ? [] : summarizeAllHistory(entries, projects, clients, billedPeriods, now);
  const visibleGroups = showBilled ? groups : hideBilledPeriods(groups);
  const allBilledHidden = !showBilled && groups.length > 0 && visibleGroups.length === 0;

  return (
    <div className="space-y-4">
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
        <div className="space-y-3 border-t border-slate-100 pt-3">
          {visibleGroups.map((group) => {
            const meta = INTERVAL_BADGE_META[group.interval];
            const project = projects.find((p) => p.id === group.projectId);
            if (!project) return null;
            return (
              <div key={group.projectId} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{group.projectName}</p>
                    <p className="truncate text-xs text-slate-500">{group.clientName}</p>
                  </div>
                  <Badge colorScheme={meta.colorScheme} className="shrink-0 py-0.5">
                    {meta.label}
                  </Badge>
                </div>

                <div className="mt-2 divide-y divide-slate-200/80 border-t border-slate-200/80">
                  {group.periods.map((period) => {
                    const key = `${group.projectId}::${period.periodStartKey}`;
                    const isEditing = editingKey === key;
                    const isBusy = busyKey === key;
                    return (
                      <div key={key} className="flex flex-col gap-1.5 px-1 py-2">
                        <button
                          type="button"
                          onClick={() => onOpenLog(project, period.periodStart)}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-lg px-1.5 py-1 -mx-1.5 -my-1 text-left transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                        >
                          <span className="truncate text-sm text-slate-700">
                            {weekLabel(period.periodStart, now)}
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-semibold tabular-nums text-slate-900">
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
                              {period.billed && (
                                <button
                                  type="button"
                                  onClick={() => handleUnmarkBilled(project, period)}
                                  disabled={isBusy}
                                  className="shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                                >
                                  Unmark
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEditor(key, period)}
                              className="self-start rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                            >
                              {period.billed ? (
                                <Badge colorScheme="success" className="py-0.5">
                                  <Check size={12} /> Billed{period.invoiceId ? ` · ${period.invoiceId}` : ""}
                                </Badge>
                              ) : (
                                <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white hover:text-slate-600">
                                  Mark billed
                                </span>
                              )}
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
      )}
    </div>
  );
}
