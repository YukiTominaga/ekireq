"use client";

import type { ReactNode } from "react";
import { C } from "@/app/lib/tokens";
import { Btn } from "./ui";
import {
  handleDialogBackdropClick,
  useModalDialog,
} from "./useModalDialog";

type Props = {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  confirmingLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
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
  labelledById,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return <ConfirmDialogImpl
    title={title}
    body={body}
    confirmLabel={confirmLabel}
    confirmingLabel={confirmingLabel}
    cancelLabel={cancelLabel}
    busy={busy}
    labelledById={labelledById}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />;
}

function ConfirmDialogImpl({
  title,
  body,
  confirmLabel,
  confirmingLabel,
  cancelLabel,
  busy,
  labelledById,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  confirmingLabel?: string;
  cancelLabel: string;
  busy: boolean;
  labelledById: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useModalDialog();
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledById}
      onCancel={(e) => {
        if (busy) {
          e.preventDefault();
          return;
        }
        onCancel();
      }}
      onClick={(e) => {
        if (busy) return;
        handleDialogBackdropClick(e, onCancel);
      }}
    >
      <div
        className="dlg-center"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
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
    </dialog>
  );
}
