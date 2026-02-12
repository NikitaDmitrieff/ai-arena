"use client";

import React from "react";
import { clsx } from "clsx";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "danger" | "warning" | "soft";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "pixel-btn",
    danger: "pixel-btn pixel-btn-danger",
    warning: "pixel-btn pixel-btn-warning",
    soft: "pixel-btn pixel-btn-secondary",
  } as const;

  const sizes = {
    sm: "pixel-btn-sm",
    md: "",
    lg: "pixel-btn-lg",
  } as const;

  return (
    <button
      className={clsx(
        variants[variant],
        sizes[size],
        "inline-flex items-center gap-2",
        className
      )}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
