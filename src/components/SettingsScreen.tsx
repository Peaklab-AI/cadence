import { useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen } from "lucide-react";
import { checkDataFolder, getStorageSettings, setDataDirectory } from "../lib/tauriCommands";
import { toErrorMessage } from "../lib/errors";
import type { StorageSettings } from "../types";
import { Button } from "./ui/Button";
import { FieldLabel } from "./ui/FieldLabel";

export function SettingsScreen() {
  const [settings, setSettings] = useState<StorageSettings | null>(null);
  const [pendingDir, setPendingDir] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStorageSettings()
      .then(setSettings)
      .catch((err) => setError(toErrorMessage(err)));
  }, []);

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

  if (!settings) return <p className="py-8 text-center text-sm text-slate-400">Loading…</p>;

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
    </div>
  );
}
