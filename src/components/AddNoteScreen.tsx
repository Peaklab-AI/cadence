import { useState } from "react";
import { Textarea } from "./ui/Textarea";
import { Button } from "./ui/Button";

interface Props {
  onSkip: () => void;
  onSave: (note: string) => void;
}

/** Shown right after hitting pause, before the session is actually closed —
 * an optional beat to jot down what the work was for, so the project log
 * reads as more than a bare time range later. Skippable: pausing never
 * blocks on this. */
export function AddNoteScreen({ onSkip, onSave }: Props) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSkip() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSkip();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSave() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSave(note);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">Add a note about what you worked on?</p>
      <Textarea
        autoFocus
        rows={3}
        value={note}
        onChange={(e) => setNote(e.currentTarget.value)}
        placeholder="What was this session for?"
      />
      <div className="flex items-center gap-2">
        <Button variant="outline" fullWidth disabled={submitting} onClick={handleSkip}>
          Skip
        </Button>
        <Button variant="primary" fullWidth disabled={submitting} onClick={handleSave}>
          Save &amp; pause
        </Button>
      </div>
    </div>
  );
}
