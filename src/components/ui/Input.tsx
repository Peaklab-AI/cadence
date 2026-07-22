import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "./cn";
import { FieldLabel } from "./FieldLabel";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, id, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("w-full", className)}>
      {label && <FieldLabel htmlFor={inputId}>{label}</FieldLabel>}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          "block w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-base text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand",
          props.disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
        )}
        {...props}
      />
    </div>
  );
});
Input.displayName = "Input";
