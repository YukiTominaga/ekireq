"use client";

import { useState } from "react";
import { C } from "@/app/lib/tokens";
import { signInWithGoogle } from "@/app/lib/auth";
import { Btn } from "./ui";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export function AuthModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "ログインに失敗しました";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 80,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15,23,42,0.4)",
        }}
      />
      <div
        style={{
          position: "relative",
          background: C.white,
          borderRadius: "16px 16px 0 0",
          width: "100%",
          padding: "0 18px 36px",
          animation: "slideUp 0.28s ease-out",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: C.slate200,
            borderRadius: 2,
            margin: "10px auto 16px",
          }}
        />
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
          ログイン
        </h2>
        <p
          style={{
            fontSize: 12,
            color: C.slate500,
            marginBottom: 18,
            lineHeight: 1.6,
          }}
        >
          Google アカウントでログインすると、投稿やいいねができます。
        </p>

        <Btn
          style={{ width: "100%", marginBottom: 10 }}
          onClick={handleGoogle}
          disabled={loading}
        >
          <GoogleG />
          {loading ? "処理中..." : "Google でログイン"}
        </Btn>

        {error && (
          <p
            style={{
              fontSize: 11,
              color: C.red500,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#fff"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#fff"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.93v2.34A8.99 8.99 0 0 0 9 18z"
        opacity="0.9"
      />
      <path
        fill="#fff"
        d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.94H.93A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.93 4.06l3.04-2.34z"
        opacity="0.7"
      />
      <path
        fill="#fff"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A8.99 8.99 0 0 0 9 0 8.99 8.99 0 0 0 .93 4.94L3.97 7.28C4.68 5.16 6.66 3.58 9 3.58z"
        opacity="0.5"
      />
    </svg>
  );
}
