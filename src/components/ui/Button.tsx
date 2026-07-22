import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "./cn";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: "primary" | "outline";
  size?: "sm" | "md";
  fullWidth?: boolean;
}

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "font-medium tracking-wide transition-colors flex items-center justify-center gap-2 border-2 border-transparent outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40";

  const variants = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    outline: "border-brand text-brand hover:bg-brand/5",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs rounded-full",
    md: "px-6 py-2.5 text-sm rounded-full",
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...props}
    >
      {children}
    </motion.button>
  );
}
