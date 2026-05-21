"use client";

import type { ReactNode } from "react";
import { C } from "@/app/lib/tokens";
import { Btn } from "./ui";

type Props = {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  confirmingLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  position?: "absolute" | "fixed";
  labelledById: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  confirmingLabel,
  cancelLabel = "キャンセル",
  busy = false,
  position = "absolute",
  labelledById,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div
      style={{
        position,
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={busy ? undefined : onCancel}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15,23,42,0.45)",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        style={{
          position: "relative",
          background: C.white,
          borderRadius: 14,
          width: "100%",
          maxWidth: 360,
          padding: 18,
          boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h3
          id={labelledById}
          style={{ fontSize: 15, fontWeight: 700, color: C.slate900 }}
        >
          {title}
        </h3>
        <p style={{ fontSize: 13, color: C.slate600, lineHeight: 1.6 }}>
          {body}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 4,
          }}
        >
          <Btn variant="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Btn>
          <Btn variant="primary" onClick={onConfirm} disabled={busy}>
            {busy && confirmingLabel ? confirmingLabel : confirmLabel}
          </Btn>
        </div>
      </div>
    </div>
  );
}
