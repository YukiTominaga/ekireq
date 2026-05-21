"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { C } from "@/app/lib/tokens";

type ToastVariant = "info" | "error";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ShowToast = (message: string, variant?: ToastVariant) => void;

const ToastContext = createContext<ShowToast | null>(null);

const TOAST_DURATION_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const show = useCallback<ShowToast>((message, variant = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastViewport
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      // aria-live で非モーダルに通知。エラーは role=alert 相当にしたいので
      // 個別 toast 側で role を切り替える。
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: "calc(12px + env(safe-area-inset-top))",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
        padding: "0 16px",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, TOAST_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [onDismiss]);

  const colors = useMemo(() => {
    if (toast.variant === "error") {
      return { bg: "#7f1d1d", fg: C.white };
    }
    return { bg: C.slate900, fg: C.white };
  }, [toast.variant]);

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      aria-live={toast.variant === "error" ? "assertive" : "polite"}
      style={{
        pointerEvents: "auto",
        background: colors.bg,
        color: colors.fg,
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        lineHeight: 1.5,
        maxWidth: 360,
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        animation: "fadeIn 0.18s ease-out",
      }}
    >
      {toast.message}
    </div>
  );
}
