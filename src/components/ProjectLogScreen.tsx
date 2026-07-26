import { useCallback, useEffect, useState } from "react";
import { Check, Download, FileText, Plus } from "lucide-react";
import { listBilledPeriods, listTimeEntries, saveTextFile } from "../lib/tauriCommands";
import { buildTimeLogCsv, formatDuration, weekEnd, weekStart, weekStartKey, weekLabel } from "../lib/history";
import { toErrorMessage } from "../lib/errors";
import type { BilledPeriod, Project, TimeEntry } from "../types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface Props {
  project: Project;
  anchor: Date;
  onEditEntry: (entry: TimeEntry) => void;
  onAddEntry: () => void;
}

function logDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function logTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function ProjectLogScreen({ project, anchor, onEditEntry, onAddEntry }: Props) {
  const [entries, setEntries] = useState<TimeEntry[] | null>(null);
  const [billedPeriods, setBilledPeriods] = useState<BilledPeriod[] | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  // Distinct from `exportError` (which is scoped to the CSV export action)
  // so a failed initial load surfaces its own message and Retry instead of
  // leaving the list stuck on "Loading…" forever.
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(() => {
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
    loadData();
  }, [loadData]);

  const now = new Date();
  const start = weekStart(anchor);
  const end = weekEnd(anchor);
  const billedRecord = (billedPeriods ?? []).find(
    (b) => b.projectId === project.id && b.periodStart === weekStartKey(anchor),
  );
  const billed = billedRecord !== undefined;
  const closedEntries =
    entries
      ?.filter((e) => e.projectId === project.id && e.endedAt)
      .filter((e) => {
        const started = new Date(e.startedAt);
        return started >= start && started < end;
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()) ?? [];

  async function handleExport() {
    if (!entries) return;
    setExportError(null);
    try {
      const inPeriod = entries.filter((e) => {
        const started = new Date(e.startedAt);
        return started >= start && started < end;
      });
      const csv = buildTimeLogCsv(inPeriod, project, billed, billedRecord?.invoiceId ?? null);
      const filename = `${project.name} — ${weekLabel(anchor, now)}.csv`;
      const path = await saveTextFile(filename, csv);
      setSavedPath(path);
    } catch (err) {
      setExportError(toErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{project.name}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-xs text-slate-400">{weekLabel(anchor, now)}</p>
            {billed && (
              <Badge colorScheme="success" className="py-0.5">
                <Check size={12} /> Billed{billedRecord?.invoiceId ? ` · ${billedRecord.invoiceId}` : ""}
              </Badge>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onAddEntry}
          className="flex shrink-0 items-center gap-1 rounded-full py-1.5 pl-2 pr-3 text-xs font-medium text-brand transition-colors hover:bg-brand/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <Plus size={14} /> Add entry
        </button>
      </div>

      {entries === null && loadError ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-xs text-red-600">{loadError}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            Retry
          </Button>
        </div>
      ) : entries === null ? (
        <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
      ) : closedEntries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">No sessions logged</p>
            <p className="mt-0.5 text-xs text-slate-400">Nothing to show for this period yet.</p>
          </div>
        </div>
      ) : (
        <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto border-y border-slate-100">
          {closedEntries.map((entry) => {
            const entryStart = new Date(entry.startedAt);
            const entryEnd = new Date(entry.endedAt as string);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => onEditEntry(entry)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{logDate(entryStart)}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {logTime(entryStart)} – {logTime(entryEnd)}
                  </p>
                  {entry.note && <p className="mt-0.5 truncate text-xs text-slate-500">{entry.note}</p>}
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                  {formatDuration(entry.durationSeconds)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!entries || closedEntries.length === 0}
        >
          <Download size={13} /> Export CSV
        </Button>
        {exportError && <p className="text-center text-xs text-red-600">{exportError}</p>}
        {savedPath && !exportError && <p className="text-center text-xs text-slate-400">Saved to {savedPath}</p>}
      </div>
    </div>
  );
}
