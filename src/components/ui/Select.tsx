import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { useClickOutside } from "../../hooks/useClickOutside";
import { Badge, type BadgeProps } from "./Badge";
import { cn } from "./cn";
import { FieldLabel } from "./FieldLabel";

// The popover window is fixed-size and sized to fit each view's normal
// content, so an open dropdown can easily need more room than is currently
// available below it. Grow the window while open, then restore it exactly
// on close, rather than letting the window frame clip the options list.
const DROPDOWN_EXTRA_HEIGHT = 300;

export interface SelectOption {
  label: string;
  value: string;
  /** Secondary caption, e.g. the client a project belongs to. */
  sublabel?: string;
  /** Small pill next to the label, e.g. the project's tracking cadence. */
  badge?: { label: string; colorScheme: BadgeProps["colorScheme"] };
}

interface SelectProps {
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function Select({ label, value, onChange, options, placeholder = "Select…", disabled }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useClickOutside(containerRef, isOpen, () => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) return;
    const win = getCurrentWindow();
    let originalHeight: number | null = null;

    win.outerSize().then(async (size) => {
      const scale = await win.scaleFactor();
      const logical = size.toLogical(scale);
      originalHeight = logical.height;
      await win.setSize(new LogicalSize(logical.width, logical.height + DROPDOWN_EXTRA_HEIGHT));
    });

    return () => {
      if (originalHeight === null) return;
      win.outerSize().then(async (size) => {
        const scale = await win.scaleFactor();
        const logical = size.toLogical(scale);
        await win.setSize(new LogicalSize(logical.width, originalHeight as number));
      });
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand",
          disabled
            ? "cursor-not-allowed bg-slate-50 text-slate-300 ring-1 ring-inset ring-slate-200/70"
            : isOpen
              ? "bg-white text-slate-900 ring-2 ring-brand"
              : "bg-slate-50 text-slate-900 ring-1 ring-inset ring-slate-200/70 hover:bg-slate-100",
        )}
      >
        {selected ? (
          <span className="min-w-0 flex-1">
            {selected.sublabel && <span className="block truncate text-xs text-slate-400">{selected.sublabel}</span>}
            <span className="flex items-center gap-2">
              <span className="min-w-0 truncate text-base font-medium">{selected.label}</span>
              {selected.badge && (
                <Badge colorScheme={selected.badge.colorScheme} className="shrink-0">
                  {selected.badge.label}
                </Badge>
              )}
            </span>
          </span>
        ) : (
          <span className="truncate py-0.5 text-base font-normal text-slate-400">{placeholder}</span>
        )}
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl"
          >
            {options.length === 0 ? (
              <p className="p-4 text-center text-sm text-slate-400">No options yet</p>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 border-b border-slate-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50"
                >
                  <span className="min-w-0 flex-1">
                    {option.sublabel && <span className="block truncate text-xs text-slate-400">{option.sublabel}</span>}
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "min-w-0 truncate text-base font-medium",
                          option.value === value ? "text-slate-900" : "text-slate-400",
                        )}
                      >
                        {option.label}
                      </span>
                      {option.badge && (
                        <Badge colorScheme={option.badge.colorScheme} className="shrink-0">
                          {option.badge.label}
                        </Badge>
                      )}
                    </span>
                  </span>
                  {option.value === value && <Check className="h-4 w-4 shrink-0 text-brand" />}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
