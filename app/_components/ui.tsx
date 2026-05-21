"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./Icon";

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

const BTN_SIZE_CLS: Record<BtnSize, string> = {
  sm: "text-[13px] py-1.5 px-3",
  md: "text-sm py-2.5 px-4",
};

const BTN_VARIANT_CLS: Record<BtnVariant, string> = {
  primary: "bg-slate-900 text-white",
  secondary: "bg-slate-100 text-slate-900",
  ghost: "bg-transparent text-slate-600",
  outline: "bg-white text-slate-900 border border-slate-200",
};

export function Btn({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled,
  type = "button",
  style,
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium font-[inherit] cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed ${BTN_SIZE_CLS[size]} ${BTN_VARIANT_CLS[variant]}`}
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
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium font-[inherit] cursor-pointer border ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-600 border-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

type PillVariant = "default" | "heart";

type PillButtonProps = {
  icon: string;
  children?: ReactNode;
  active?: boolean;
  variant?: PillVariant;
  ariaLabel?: string;
  onClick?: () => void;
};

export function PillButton({
  icon,
  children,
  active = false,
  variant = "default",
  ariaLabel,
  onClick,
}: PillButtonProps) {
  const isHeartActive = active && variant === "heart";
  const cls = isHeartActive
    ? "bg-red-50 text-red-500 border-red-200"
    : "bg-slate-50 text-slate-500 border-slate-200";
  const iconFill = isHeartActive ? "currentColor" : "none";
  const iconStroke = isHeartActive ? 0 : 1.5;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={variant === "heart" ? active : undefined}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-xs font-medium font-[inherit] cursor-pointer border ${cls}`}
    >
      <Icon name={icon} size={12} sw={iconStroke} fill={iconFill} />
      {children}
    </button>
  );
}
