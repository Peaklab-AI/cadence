import { useCallback, useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Image as ImageIcon, X } from "lucide-react";
import {
  checkDataFolder,
  getReportSettings,
  getStorageSettings,
  setDataDirectory,
  setReportSettings,
  setSuppressHide,
} from "../lib/tauriCommands";
import { toErrorMessage } from "../lib/errors";
import type { ReportSettings, StorageSettings } from "../types";
import { Button } from "./ui/Button";
import { FieldLabel } from "./ui/FieldLabel";

/** Reads a File as a data URL — the format jsPDF's addImage and an <img> src
 * both accept directly, so the logo never needs to touch the filesystem
 * again after this point. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function SettingsScreen() {
  const [settings, setSettings] = useState<StorageSettings | null>(null);
  const [pendingDir, setPendingDir] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reportSettings, setReportSettingsState] = useState<ReportSettings | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = useCallback(() => {
    getStorageSettings()
      .then((data) => {
        setSettings(data);
        setError(null);
      })
      .catch((err) => setError(toErrorMessage(err)));
  }, []);

  const loadReportSettings = useCallback(() => {
    getReportSettings()
      .then((data) => {
        setReportSettingsState(data);
        setTitleDraft(data.title ?? "");
        setReportError(null);
      })
      .catch((err) => setReportError(toErrorMessage(err)));
  }, []);

  useEffect(() => {
    loadSettings();
    loadReportSettings();
  }, [loadSettings, loadReportSettings]);

  async function handleTitleBlur() {
    const trimmed = titleDraft.trim();
    if (trimmed === (reportSettings?.title ?? "")) return;
    setReportError(null);
    try {
      setReportSettingsState(await setReportSettings(trimmed || null, reportSettings?.logoDataUrl ?? null));
    } catch (err) {
      setReportError(toErrorMessage(err));
    }
  }

  async function handleLogoChosen(file: File) {
    setReportError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setReportSettingsState(await setReportSettings(reportSettings?.title ?? null, dataUrl));
    } catch (err) {
      setReportError(toErrorMessage(err));
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  /** Opens the native file picker for the logo input. On macOS, presenting
   * that OS panel takes key focus away from this popover window just like
   * clicking outside it would — without this guard, that would hide the
   * whole window out from under the open picker. `setSuppressHide` holds
   * the popover open while the panel is up; the `window` focus event fires
   * once the panel closes (chosen or cancelled), so it's cleared either
   * way. */
  function openLogoPicker() {
    setSuppressHide(true).catch(() => {});
    const onRefocus = () => {
      window.removeEventListener("focus", onRefocus);
      setSuppressHide(false).catch(() => {});
    };
    window.addEventListener("focus", onRefocus);
    logoInputRef.current?.click();
  }

  async function handleRemoveLogo() {
    setReportError(null);
    try {
      setReportSettingsState(await setReportSettings(reportSettings?.title ?? null, null));
    } catch (err) {
      setReportError(toErrorMessage(err));
    }
  }

  async function handleChooseFolder() {
    setError(null);
    setBusy(true);
    try {
      const selected = await open({ directory: true, multiple: false, title: "Choose a folder for Cadence data" });
      if (!selected || Array.isArray(selected)) return;
      const check = await checkDataFolder(selected);
      if (!check.writable) {
        setError("That folder can't be written to. Choose a different one.");
        return;
      }
      if (check.hasExistingData) {
        setPendingDir(selected);
        return;
      }
      setSettings(await setDataDirectory(selected, false));
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmOverwrite() {
    if (!pendingDir) return;
    setBusy(true);
    setError(null);
    try {
      setSettings(await setDataDirectory(pendingDir, true));
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setBusy(false);
      setPendingDir(null);
    }
  }

  if (!settings) {
    return error ? (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-xs text-red-600">{error}</p>
        <Button variant="outline" size="sm" onClick={loadSettings}>
          Retry
        </Button>
      </div>
    ) : (
      <p className="py-8 text-center text-sm text-slate-400">Loading…</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel>Data folder</FieldLabel>
        <p className="truncate rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200/70">
          {settings.dataDir}
        </p>
      </div>

      {settings.configuredDirMissing && (
        <p className="text-xs text-amber-600">
          Your chosen folder wasn't available when Cadence started (unplugged drive or removed sync folder?), so it
          fell back to the default location for this session. Restart Cadence once the folder is back, or choose a
          folder again below.
        </p>
      )}

      {pendingDir ? (
        <div className="flex flex-col gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          <p>
            <span className="font-medium">{pendingDir}</span> already has a Cadence data file. Switching will
            overwrite it with your current data.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPendingDir(null)} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" onClick={confirmOverwrite} disabled={busy}>
              Overwrite and switch
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={handleChooseFolder} disabled={busy}>
          <FolderOpen size={13} /> Choose Folder…
        </Button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {settings.warning && !error && <p className="text-xs text-amber-600">{settings.warning}</p>}

      <div className="border-t border-slate-100 pt-4">
        <FieldLabel>Report branding</FieldLabel>
        <p className="mb-2 text-xs text-slate-400">Shown at the top of generated PDF reports.</p>

        {reportSettings && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {reportSettings.logoDataUrl && (
                <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-1.5 ring-1 ring-inset ring-slate-200/70">
                  <img
                    src={reportSettings.logoDataUrl}
                    alt="Report logo"
                    className="h-8 max-w-[100px] rounded-md object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    aria-label="Remove logo"
                    className="rounded-full p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={openLogoPicker}>
                <ImageIcon size={13} /> {reportSettings.logoDataUrl ? "Replace logo…" : "Upload logo…"}
              </Button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) handleLogoChosen(file);
                }}
              />
            </div>

            <div>
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.currentTarget.value)}
                onBlur={handleTitleBlur}
                placeholder="Time report"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        )}

        {reportError && <p className="mt-2 text-xs text-red-600">{reportError}</p>}
      </div>
    </div>
  );
}
