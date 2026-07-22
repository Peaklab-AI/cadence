import { Check, Pencil } from "lucide-react";
import type { Client, Project } from "../types";
import { INTERVAL_BADGE_META } from "../lib/intervalMeta";
import { Badge } from "./ui/Badge";
import { cn } from "./ui/cn";

interface Props {
  clients: Client[];
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onEditProject: (project: Project) => void;
}

export function ProjectSelector({ clients, projects, selectedProjectId, onSelectProject, onEditProject }: Props) {
  const clientNameById = new Map(clients.map((c) => [c.id, c.name]));

  if (projects.length === 0) {
    return <p className="py-3 text-center text-sm text-slate-400">No projects yet.</p>;
  }

  return (
    <div className="max-h-48 space-y-0.5 overflow-y-auto">
      {projects.map((project) => {
        const isSelected = project.id === selectedProjectId;
        const meta = INTERVAL_BADGE_META[project.interval];
        return (
          <div key={project.id} className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50">
            <button
              type="button"
              onClick={() => onSelectProject(project.id)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  isSelected ? "bg-brand text-white" : "ring-1 ring-inset ring-slate-300",
                )}
              >
                {isSelected && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-900">{project.name}</span>
                <span className="block truncate text-xs text-slate-400">
                  {clientNameById.get(project.clientId) ?? "Unknown client"}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onEditProject(project)}
              className="flex w-0 shrink-0 items-center justify-center overflow-hidden rounded-full text-slate-300 opacity-0 transition-all duration-150 hover:bg-slate-100 hover:text-brand focus-visible:w-6 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand group-hover:w-6 group-hover:opacity-100"
              aria-label={`Edit ${project.name}`}
            >
              <Pencil size={13} className="shrink-0" />
            </button>

            <Badge colorScheme={meta.colorScheme} className="shrink-0">
              {meta.label}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}
