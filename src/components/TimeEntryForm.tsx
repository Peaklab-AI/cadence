import { useEffect, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import type { Client, Project, TimeEntry } from "../types";
import { addManualTimeEntry, deleteTimeEntry, listTimeEntries, updateTimeEntry } from "../lib/tauriCommands";
import { toErrorMessage } from "../lib/errors";
import { INTERVAL_BADGE_META } from "../lib/intervalMeta";
import { Select } from "./ui/Select";
import { FieldLabel } from "./ui/FieldLabel";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";

interface Props {
  entry: TimeEntry | null;
  projects: Project[];
  clients: Client[];
  defaultProjectId: string;
  defaultDate: Date;
  onDone: () => void;
}

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toTimeInputValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Combines a `YYYY-MM-DD` + `HH:MM` pair (both in local time, as native
 * date/time inputs work in) into an RFC3339 UTC string, matching what Rust
 * writes for every other entry. */
function combineToIso(dateStr: string, timeStr: string): string | null {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mi] = timeStr.split(":").map(Number);
  if ([y, m, d, hh, mi].some((n) => Number.isNaN(n))) return null;
  return new Date(y, m - 1, d, hh, mi, 0, 0).toISOString();
}

export function TimeEntryForm({ entry, projects, clients, defaultProjectId, defaultDate, onDone }: Props) {
  const isEditing = entry !== null;

  const [projectId, setProjectId] = useState(entry?.projectId ?? defaultProjectId);
  const [date, setDate] = useState(() => toDateInputValue(entry ? new Date(entry.startedAt) : defaultDate));
  const [startTime, setStartTime] = useState(() =>
    entry ? toTimeInputValue(new Date(entry.startedAt)) : "09:00",
  );
  const [endTime, setEndTime] = useState(() =>
    entry?.endedAt ? toTimeInputValue(new Date(entry.endedAt)) : "17:00",
  );
  const [note, setNote] = useState(entry?.note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [allEntries, setAllEntries] = useState<TimeEntry[] | null>(null);
  useEffect(() => {
    // Non-blocking: this only feeds soft overlap-detection below, so a
    // failure just surfaces in the shared `error` slot (the user's own next
    // Save/Delete clears it) rather than needing its own retry UI.
    listTimeEntries()
      .then(setAllEntries)
      .catch((err) => setError(toErrorMessage(err)));
  }, []);

  const clientNameById = new Map(clients.map((c) => [c.id, c.name]));
  const projectOptions = projects.map((p) => ({
    label: p.name,
    value: p.id,
    sublabel: clientNameById.get(p.clientId) ?? "Unknown client",
    badge: INTERVAL_BADGE_META[p.interval],
  }));

  const startedAtIso = combineToIso(date, startTime);
  const endedAtIso = combineToIso(date, endTime);
  const rangeValid = startedAtIso !== null && endedAtIso !== null && endedAtIso > startedAtIso;

  const overlaps =
    rangeValid &&
    (allEntries ?? []).some((e) => {
      if (e.id === entry?.id || !e.endedAt) return false;
      return e.startedAt < (endedAtIso as string) && (startedAtIso as string) < e.endedAt;
    });

  async function handleSave() {
    if (!rangeValid || submitting) return;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    setSubmitting(true);
    setError(null);
    try {
      const trimmedNote = note.trim() || null;
      if (isEditing && entry) {
        await updateTimeEntry(
          entry.id,
          project.clientId,
          project.id,
          startedAtIso as string,
          endedAtIso as string,
          trimmedNote,
        );
      } else {
        await addManualTimeEntry(project.clientId, project.id, startedAtIso as string, endedAtIso as string, trimmedNote);
      }
      onDone();
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!entry || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteTimeEntry(entry.id);
      onDone();
    } catch (err) {
      setError(toErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel>Project</FieldLabel>
        <Select value={projectId} onChange={setProjectId} options={projectOptions} placeholder="Select a project…" />
      </div>

      <div>
        <FieldLabel htmlFor="entry-date">Date</FieldLabel>
        <input
          id="entry-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.currentTarget.value)}
          className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-base text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <FieldLabel htmlFor="entry-start">Start</FieldLabel>
          <input
            id="entry-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.currentTarget.value)}
            className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-base text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="flex-1">
          <FieldLabel htmlFor="entry-end">End</FieldLabel>
          <input
            id="entry-end"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.currentTarget.value)}
            className="block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-base text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="entry-note">Note</FieldLabel>
        <Textarea
          id="entry-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          placeholder="What was this session for?"
        />
      </div>

      {!rangeValid && (
        <p className="text-xs text-red-600">End time must be after start time.</p>
      )}
      {rangeValid && overlaps && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>This overlaps another session. You can still save if that&apos;s expected.</span>
        </div>
      )}

      {error && <p className="text-center text-xs text-red-600">{error}</p>}

      <div className="flex flex-col items-center gap-2 pt-1">
        <Button variant="primary" fullWidth disabled={!rangeValid || submitting} onClick={handleSave}>
          {isEditing ? "Save changes" : "Add entry"}
        </Button>

        {isEditing &&
          (confirmingDelete ? (
            <div className="flex w-full items-center gap-2">
              <Button variant="outline" fullWidth disabled={submitting} onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                fullWidth
                disabled={submitting}
                onClick={handleDelete}
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                Confirm delete
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Trash2 size={13} />
              Delete entry
            </button>
          ))}
      </div>
    </div>
  );
}
