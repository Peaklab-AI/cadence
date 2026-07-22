import { Button } from "./ui/Button";

interface Props {
  onConfirm: () => void;
}

/** Rust holds the window open and asks here before actually hiding it, so
 * dismissing the popover while idle doesn't silently leave tracking off
 * without a beat of confirmation. */
export function LeaveOffScreen({ onConfirm }: Props) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <p className="text-sm text-slate-600">You're not tracking any time right now.</p>
      <Button variant="primary" onClick={onConfirm}>
        Leave tracking off
      </Button>
    </div>
  );
}
