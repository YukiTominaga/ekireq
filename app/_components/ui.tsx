"use client";

import type { CSSProperties, ReactNode } from "react";
import { C } from "@/app/lib/tokens";

type BtnVariant = "primary" | "secondary" | "ghost" | "outline";
type BtnSize = "sm" | "md";

type BtnProps = {
  children: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  style?: CSSProperties;
};

export function Btn({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  type = "button",
  style = {},
}: BtnProps) {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 6,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    fontFamily: "inherit",
    fontSize: size === "sm" ? 13 : 14,
    padding: size === "sm" ? "6px 12px" : "10px 16px",
    opacity: disabled ? 0.5 : 1,
  };
  const variants: Record<BtnVariant, CSSProperties> = {
    primary: { background: C.slate900, color: C.white },
    secondary: { background: C.slate100, color: C.slate900 },
    ghost: { background: "transparent", color: C.slate600 },
    outline: {
      background: C.white,
      color: C.slate900,
      border: `1px solid ${C.slate200}`,
    },
  };
  return (
    <button
      type={type}
      style={{ ...base, ...variants[variant], ...style }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

type PillButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  bg: string;
  border: string;
  color: string;
  ariaLabel?: string;
  title?: string;
};

export function PillButton({
  children,
  onClick,
  disabled,
  bg,
  border,
  color,
  ariaLabel,
  title,
}: PillButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: bg,
        border: `1px solid ${border}`,
        color,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

type BadgeProps = {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export function Badge({ children, active, onClick }: BadgeProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 500,
        border: `1px solid ${active ? C.slate900 : C.slate200}`,
        background: active ? C.slate900 : C.white,
        color: active ? C.white : C.slate600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}
