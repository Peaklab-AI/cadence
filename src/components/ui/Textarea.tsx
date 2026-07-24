import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";
import { FieldLabel } from "./FieldLabel";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, id, ...props }, ref) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className={cn("w-full", className)}>
      {label && <FieldLabel htmlFor={textareaId}>{label}</FieldLabel>}
      <textarea
        id={textareaId}
        ref={ref}
        className={cn(
          "block w-full resize-none rounded-xl border-0 bg-slate-50 px-4 py-3 text-base text-slate-900 ring-1 ring-inset ring-slate-200/70 transition-all placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand",
          props.disabled && "cursor-not-allowed bg-slate-50 text-slate-400",
        )}
        {...props}
      />
    </div>
  );
});
Textarea.displayName = "Textarea";
