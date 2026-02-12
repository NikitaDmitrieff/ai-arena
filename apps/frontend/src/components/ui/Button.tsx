"use client";

import React from "react";
import { clsx } from "clsx";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "warning" | "soft";
  icon?: React.ReactNode;
};

export default function Button({
  variant = "primary",
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "btn-reset inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold font-sora transition-all duration-200 ease-in-out disabled:opacity-50 disabled:pointer-events-none border-3 border-black shadow-hard hover:shadow-hard-lg hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-hard-active active:translate-x-0.5 active:translate-y-0.5";
  const variants = {
    primary: "bg-pixel-teal text-black hover:bg-accent-hover",
    danger: "bg-pixel-red text-black hover:bg-[#FF5252]",
    warning: "bg-pixel-yellow text-black hover:bg-[#FFC700]",
    soft: "bg-white text-black hover:bg-neutral-50",
  } as const;

  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
