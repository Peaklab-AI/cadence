import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "./cn";

export interface BadgeProps extends HTMLMotionProps<"span"> {
  colorScheme?: "brand" | "success" | "warning" | "gray" | "violet";
  children: ReactNode;
}

const colorStyles: Record<NonNullable<BadgeProps["colorScheme"]>, string> = {
  brand: "bg-blue-50 text-blue-700 ring-blue-600/10",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/10",
  gray: "bg-slate-100 text-slate-600 ring-slate-600/10",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/10",
};

export function Badge({ colorScheme = "gray", className, children, ...props }: BadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        colorStyles[colorScheme],
        className,
      )}
      {...props}
    >
      {children}
    </motion.span>
  );
}
