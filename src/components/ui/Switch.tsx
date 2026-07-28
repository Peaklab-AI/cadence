import { motion } from "framer-motion";
import { cn } from "./cn";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        className,
      )}
    >
      {label && <span className="text-xs font-medium text-slate-500">{label}</span>}
      <span
        className={cn(
          "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
          checked ? "bg-brand justify-end" : "bg-slate-200 justify-start",
        )}
      >
        <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className="h-4 w-4 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  );
}
