import type { Project } from "../types";
import { Button } from "./ui/Button";

interface Props {
  project: Project;
  onConfirm: () => void;
}

export function SwitchProjectScreen({ project, onConfirm }: Props) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <p className="text-sm text-slate-600">
        This pauses your current session and starts tracking{" "}
        <span className="font-medium text-slate-900">{project.name}</span>.
      </p>
      <Button variant="primary" onClick={onConfirm}>
        Switch project
      </Button>
    </div>
  );
}
