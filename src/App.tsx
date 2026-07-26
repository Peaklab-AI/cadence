import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { listen } from "@tauri-apps/api/event";
import { TrackerProvider } from "./context/TrackerContext";
import { useTrackerState } from "./hooks/useTrackerState";
import { useTrackerLoadState } from "./hooks/useTrackerLoadState";
import { ProjectSelector } from "./components/ProjectSelector";
import { ProjectForm } from "./components/ProjectForm";
import { SwitchProjectScreen } from "./components/SwitchProjectScreen";
import { LeaveOffScreen } from "./components/LeaveOffScreen";
import { AddNoteScreen } from "./components/AddNoteScreen";
import { TrackerControls } from "./components/TrackerControls";
import { ConfirmPrompt } from "./components/ConfirmPrompt";
import { HistoryPanel } from "./components/HistoryPanel";
import { ProjectLogScreen } from "./components/ProjectLogScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { TimeEntryForm } from "./components/TimeEntryForm";
import { Button } from "./components/ui/Button";
import { cancelLeaveTrackingOff, confirmLeaveTrackingOff, pauseTracking, startTracking } from "./lib/tauriCommands";
import { toErrorMessage } from "./lib/errors";
import { weekEnd, weekStart } from "./lib/history";
import type { Project, TimeEntry } from "./types";

type Screen =
  | { kind: "tracker" }
  | { kind: "history" }
  | { kind: "settings" }
  | { kind: "editProject"; project: Project | null }
  | { kind: "switchProject"; project: Project }
  | { kind: "leaveOff" }
  | { kind: "addNote" }
  | { kind: "projectLog"; project: Project; anchor: Date }
  | {
      kind: "editTimeEntry";
      entry: TimeEntry | null;
      project: Project;
      anchor: Date;
    };

const WINDOW_WIDTH = 420;
// The container's own `p-4` padding (top + bottom), added on top of the
// measured content height below.
const CONTAINER_CHROME = 32;
// Safety-net clamps for the dynamic resize, not target sizes — real content
// never gets close to either bound. They only guard against a transient
// near-empty reading during the AnimatePresence exit/enter gap between
// screens (see the resize effect below).
const MIN_WINDOW_HEIGHT = 200;
const MAX_WINDOW_HEIGHT = 640;

function screenTitle(screen: Screen): string {
  switch (screen.kind) {
    case "tracker":
      return "";
    case "history":
      return "History";
    case "settings":
      return "Settings";
    case "editProject":
      return screen.project ? "Edit project" : "New project";
    case "switchProject":
      return "Switch project";
    case "leaveOff":
      return "Leave tracking off?";
    case "addNote":
      return "Add a note?";
    case "projectLog":
      return "Project log";
    case "editTimeEntry":
      return screen.entry ? "Edit entry" : "Add entry";
  }
}

// Space below the header before the body starts (was `gap-4` when both sat
// in the same flex column) — kept as a constant since the header is now
// measured separately from the body it used to share a container with.
const HEADER_GAP = 16;

/** Default date for a new manual entry: today, unless today falls outside
 * whichever period is currently being viewed, in which case the period's
 * own start date (so "Add entry" from a past week defaults into that week,
 * not today). */
function clampDateToPeriod(now: Date, anchor: Date): Date {
  const start = weekStart(anchor);
  const end = weekEnd(anchor);
  return now >= start && now < end ? now : start;
}

function MainView() {
  const snapshot = useTrackerState();
  const loadState = useTrackerLoadState();
  const [screen, setScreen] = useState<Screen>({ kind: "tracker" });
  const headerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // The window is a fixed-size popover, not user-resizable, so we resize it
  // ourselves to fit whatever is actually rendered. A ResizeObserver on the
  // body wrapper (the current screen, inside AnimatePresence) reacts to
  // every layout change — switching screens, a list growing/shrinking, a
  // conditional field appearing — instead of a hand-picked height per
  // screen kind, which goes stale the moment a screen's content changes
  // shape. The header is measured separately (read fresh inside the same
  // callback) since it isn't part of the body wrapper — but it toggles
  // in lockstep with the body on every screen change, so a single observer
  // on the body is enough to catch both.
  //
  // The 80ms debounce coalesces the brief near-empty DOM state between one
  // screen's exit and the next one's enter (AnimatePresence `mode="wait"`
  // unmounts before mounting), so navigating between screens doesn't cause
  // a visible shrink-then-grow flash. Resizing keeps the window's top-left
  // anchored under the tray icon (Tauri's `setSize` doesn't move the
  // origin), so it only ever grows/shrinks downward.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const win = getCurrentWindow();
    let debounce: number | undefined;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        const headerHeight = headerRef.current ? headerRef.current.offsetHeight + HEADER_GAP : 0;
        const height = Math.min(
          MAX_WINDOW_HEIGHT,
          Math.max(MIN_WINDOW_HEIGHT, headerHeight + el.scrollHeight + CONTAINER_CHROME),
        );
        win.setSize(new LogicalSize(WINDOW_WIDTH, height));
      }, 80);
    });
    observer.observe(el);
    return () => {
      window.clearTimeout(debounce);
      observer.disconnect();
    };
  }, []);

  // Rust holds the window open (instead of hiding it) when dismissed while
  // idle, and asks here before actually letting it go.
  useEffect(() => {
    const unlisten = listen("confirm-close-requested", () => setScreen({ kind: "leaveOff" }));
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  // Shared slot for start/pause/switch failures — these are simple
  // fire-and-forget actions from the tracker screen (or redirect back to it
  // on failure), so one slot rendered there covers all of them rather than
  // threading error state through every call site.
  const [actionError, setActionError] = useState<string | null>(null);

  // Once tracking starts (from the tray or the main window), reflect that
  // project in the selector. Adjusted during render (not an effect) so it
  // takes effect in the same commit instead of causing an extra render.
  const [syncedProjectId, setSyncedProjectId] = useState<string | null>(null);
  if (snapshot?.activeProjectId && snapshot.activeProjectId !== syncedProjectId) {
    setSyncedProjectId(snapshot.activeProjectId);
    setSelectedProjectId(snapshot.activeProjectId);
  }

  if (!snapshot) {
    if (loadState.status === "error") {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white p-4 text-center">
          <p className="text-sm text-slate-500">Something went wrong loading Cadence.</p>
          <p className="text-xs text-red-600">{loadState.message}</p>
          <Button variant="outline" size="sm" onClick={loadState.retry}>
            Retry
          </Button>
        </div>
      );
    }
    return (
      <div className="flex h-screen items-center justify-center overflow-hidden rounded-2xl bg-white text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  const isTracking = snapshot.status === "tracking" || snapshot.status === "promptPending";
  const selectedProject = snapshot.projects.find((p) => p.id === selectedProjectId) ?? null;
  const activeProject = snapshot.projects.find((p) => p.id === snapshot.activeProjectId) ?? null;

  function goToTracker() {
    setScreen({ kind: "tracker" });
  }

  // Each screen's back button steps to whichever screen it was reached
  // from, not always the main tracker view — e.g. leaving a project's
  // detailed log (reached from History) goes back to History, not past it.
  function handleBack() {
    setActionError(null);
    switch (screen.kind) {
      case "leaveOff":
        cancelLeaveTrackingOff();
        goToTracker();
        break;
      case "projectLog":
        setScreen({ kind: "history" });
        break;
      case "editTimeEntry":
        setScreen({ kind: "projectLog", project: screen.project, anchor: screen.anchor });
        break;
      default:
        goToTracker();
    }
  }

  return (
    <div className="flex h-screen flex-col overflow-y-auto rounded-2xl bg-white p-4">
      {screen.kind !== "tracker" && (
        <header ref={headerRef} className="mb-4 flex shrink-0 items-center">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 rounded-md text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
          >
            <ArrowLeft size={16} />
            {screenTitle(screen)}
          </button>
        </header>
      )}

      {/* This centers the body within whatever leftover space exists below
          the (always top-pinned) header — a no-op once the window is sized
          exactly to fit, but keeps short screens (e.g. the
          leave-tracking-off confirmation) vertically centered instead of
          pinned under the header if the window ever ends up a beat taller
          than the content itself. `contentRef` (what the resize effect
          measures) stays naturally sized — no flex-grow — so this never
          affects the measured height. */}
      <div className="flex flex-1 flex-col justify-center">
        <div ref={contentRef} className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
          {screen.kind === "tracker" && (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4"
            >
              {actionError && <p className="-mb-1 text-center text-xs text-red-600">{actionError}</p>}
              <TrackerControls
                status={snapshot.status}
                startedAt={snapshot.startedAt}
                canStart={Boolean(selectedProject)}
                onStart={async () => {
                  if (!selectedProject) return;
                  setActionError(null);
                  try {
                    await startTracking(selectedProject.clientId, selectedProject.id);
                  } catch (err) {
                    setActionError(toErrorMessage(err));
                  }
                }}
                onPause={() => {
                  setActionError(null);
                  setScreen({ kind: "addNote" });
                }}
                onOpenHistory={() => {
                  setActionError(null);
                  setScreen({ kind: "history" });
                }}
                onNewProject={() => {
                  setActionError(null);
                  setScreen({ kind: "editProject", project: null });
                }}
                onOpenSettings={() => {
                  setActionError(null);
                  setScreen({ kind: "settings" });
                }}
                activeProject={activeProject}
              />

              <div className="pt-1">
                <div className="mb-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                <ProjectSelector
                  clients={snapshot.clients}
                  projects={snapshot.projects}
                  selectedProjectId={selectedProjectId}
                  onSelectProject={(projectId) => {
                    if (isTracking && projectId !== selectedProjectId) {
                      const project = snapshot.projects.find((p) => p.id === projectId);
                      if (project) setScreen({ kind: "switchProject", project });
                      return;
                    }
                    setSelectedProjectId(projectId);
                  }}
                  onEditProject={(project) => setScreen({ kind: "editProject", project })}
                />
              </div>
            </motion.div>
          )}

          {screen.kind === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <HistoryPanel
                clients={snapshot.clients}
                projects={snapshot.projects}
                onOpenLog={(project, anchor) => setScreen({ kind: "projectLog", project, anchor })}
              />
            </motion.div>
          )}

          {screen.kind === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <SettingsScreen />
            </motion.div>
          )}

          {screen.kind === "projectLog" && (
            <motion.div
              key="projectLog"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <ProjectLogScreen
                project={screen.project}
                anchor={screen.anchor}
                onEditEntry={(entry) =>
                  setScreen({
                    kind: "editTimeEntry",
                    entry,
                    project: screen.project,
                    anchor: screen.anchor,
                  })
                }
                onAddEntry={() =>
                  setScreen({
                    kind: "editTimeEntry",
                    entry: null,
                    project: screen.project,
                    anchor: screen.anchor,
                  })
                }
              />
            </motion.div>
          )}

          {screen.kind === "editTimeEntry" && (
            <motion.div
              key="editTimeEntry"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <TimeEntryForm
                entry={screen.entry}
                projects={snapshot.projects}
                clients={snapshot.clients}
                defaultProjectId={screen.project.id}
                defaultDate={clampDateToPeriod(new Date(), screen.anchor)}
                onDone={() =>
                  setScreen({
                    kind: "projectLog",
                    project: screen.project,
                    anchor: screen.anchor,
                  })
                }
              />
            </motion.div>
          )}

          {screen.kind === "editProject" && (
            <motion.div
              key="editProject"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <ProjectForm
                clients={snapshot.clients}
                project={screen.project}
                onSaved={(project) => {
                  setSelectedProjectId(project.id);
                  goToTracker();
                }}
                onDeleted={() => {
                  setSelectedProjectId((id) => (id === screen.project?.id ? null : id));
                  goToTracker();
                }}
              />
            </motion.div>
          )}

          {screen.kind === "switchProject" && (
            <motion.div
              key="switchProject"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <SwitchProjectScreen
                project={screen.project}
                onConfirm={async () => {
                  try {
                    await startTracking(screen.project.clientId, screen.project.id);
                    setActionError(null);
                  } catch (err) {
                    setActionError(toErrorMessage(err));
                  }
                  goToTracker();
                }}
              />
            </motion.div>
          )}

          {screen.kind === "leaveOff" && (
            <motion.div
              key="leaveOff"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <LeaveOffScreen
                onConfirm={() => {
                  confirmLeaveTrackingOff();
                  goToTracker();
                }}
              />
            </motion.div>
          )}

          {screen.kind === "addNote" && (
            <motion.div
              key="addNote"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
            >
              <AddNoteScreen
                onSkip={async () => {
                  setActionError(null);
                  try {
                    await pauseTracking();
                  } catch (err) {
                    setActionError(toErrorMessage(err));
                  }
                  goToTracker();
                }}
                onSave={async (note) => {
                  setActionError(null);
                  try {
                    await pauseTracking(note.trim() || null);
                  } catch (err) {
                    setActionError(toErrorMessage(err));
                  }
                  goToTracker();
                }}
              />
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [windowLabel] = useState(() => getCurrentWindow().label);

  return <TrackerProvider>{windowLabel === "confirm" ? <ConfirmPrompt /> : <MainView />}</TrackerProvider>;
}

export default App;
