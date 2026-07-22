import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Client, Interval, Project } from "../types";
import { addClient, addProject, deleteProject, updateProject } from "../lib/tauriCommands";
import { INTERVAL_OPTIONS } from "../lib/intervalMeta";
import { CURRENCY_OPTIONS } from "../lib/currency";
import { toErrorMessage } from "../lib/errors";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { SegmentedControl } from "./ui/SegmentedControl";
import { FieldLabel } from "./ui/FieldLabel";

interface Props {
  clients: Client[];
  /** When set, edits this project instead of creating a new one. */
  project: Project | null;
  onSaved: (project: Project) => void;
  onDeleted: () => void;
}

const RATE_LABEL: Record<Interval, string> = {
  hourly: "Rate per hour",
  daily: "Rate per day",
  weekly: "Rate per week",
};

const KNOWN_CURRENCY_CODES = CURRENCY_OPTIONS.map((option) => option.value);

export function ProjectForm({ clients, project, onSaved, onDeleted }: Props) {
  const isEditing = Boolean(project);

  const [clientId, setClientId] = useState<string | null>(project?.clientId ?? null);
  const [addingClient, setAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [projectName, setProjectName] = useState(project?.name ?? "");
  const [interval, setSelectedInterval] = useState<Interval>(project?.interval ?? "hourly");
  const [rateInput, setRateInput] = useState(project?.rate != null ? String(project.rate) : "");
  const [currencySelect, setCurrencySelect] = useState<string>(() => {
    if (!project?.currency) return "";
    return KNOWN_CURRENCY_CODES.includes(project.currency) ? project.currency : "other";
  });
  const [customCurrency, setCustomCurrency] = useState(() =>
    project?.currency && !KNOWN_CURRENCY_CODES.includes(project.currency) ? project.currency : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    if (!project || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteProject(project.id);
      onDeleted();
    } catch (err) {
      setError(toErrorMessage(err));
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    const name = projectName.trim();
    if (!name || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      let resolvedClientId = clientId;
      if (addingClient) {
        const clientName = newClientName.trim();
        if (!clientName) {
          setSubmitting(false);
          return;
        }
        const client = await addClient(clientName);
        resolvedClientId = client.id;
      }
      if (!resolvedClientId) {
        setSubmitting(false);
        return;
      }

      const trimmedRate = rateInput.trim();
      const rate = trimmedRate ? Number.parseFloat(trimmedRate) : null;
      const currency =
        currencySelect === ""
          ? null
          : currencySelect === "other"
            ? customCurrency.trim().toUpperCase() || null
            : currencySelect;

      const saved =
        isEditing && project
          ? await updateProject(project.id, name, resolvedClientId, interval, rate, currency)
          : await addProject(resolvedClientId, name, interval, rate, currency);
      onSaved(saved);
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = projectName.trim().length > 0 && (addingClient ? newClientName.trim().length > 0 : Boolean(clientId));

  return (
    <div className="flex flex-col gap-4">
      {addingClient ? (
        <Input
          autoFocus
          label="Client"
          placeholder="New client name"
          value={newClientName}
          onChange={(e) => setNewClientName(e.currentTarget.value)}
        />
      ) : (
        <div>
          <FieldLabel>Client</FieldLabel>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <Select
                value={clientId}
                placeholder="Select a client…"
                options={clients.map((c) => ({ label: c.name, value: c.id }))}
                onChange={setClientId}
              />
            </div>
            <button
              type="button"
              onClick={() => setAddingClient(true)}
              className="flex shrink-0 items-center justify-center rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label="Add client"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      )}

      <Input
        label="Project name"
        placeholder="e.g. Website redesign"
        value={projectName}
        onChange={(e) => setProjectName(e.currentTarget.value)}
      />

      <div>
        <FieldLabel>Check-in cadence</FieldLabel>
        <SegmentedControl options={INTERVAL_OPTIONS} value={interval} onChange={setSelectedInterval} />
      </div>

      <div>
        <FieldLabel>{RATE_LABEL[interval]} (optional)</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={rateInput}
            onChange={(e) => setRateInput(e.currentTarget.value)}
            className="flex-1"
          />
          {/* Native select, not the custom dropdown Select — its popup is
              drawn by the OS so it never needs to grow the app window. */}
          <select
            value={currencySelect}
            onChange={(e) => setCurrencySelect(e.currentTarget.value)}
            className="w-32 shrink-0 rounded-xl border-0 bg-slate-50 px-3 py-3 text-base font-medium text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Currency</option>
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
        </div>
        {currencySelect === "other" && (
          <Input
            className="mt-2"
            placeholder="Currency code, e.g. EUR"
            maxLength={3}
            value={customCurrency}
            onChange={(e) => setCustomCurrency(e.currentTarget.value.toUpperCase())}
          />
        )}
      </div>

      {error && <p className="text-center text-xs text-red-600">{error}</p>}

      <Button variant="primary" fullWidth className="mt-1" disabled={!canSubmit || submitting} onClick={handleSubmit}>
        {isEditing ? "Save changes" : "Create project"}
      </Button>

      {isEditing &&
        (confirmingDelete ? (
          <div className="flex w-full flex-col items-center gap-2">
            <p className="text-center text-xs text-slate-500">
              This permanently deletes the project along with all its tracked time and billing records.
            </p>
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
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="flex items-center gap-1.5 self-center rounded-md px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Trash2 size={13} />
            Delete project
          </button>
        ))}
    </div>
  );
}
