"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { C } from "@/app/lib/tokens";
import { getMyPostCount } from "@/app/lib/firestore";
import { Btn } from "./ui";
import { Icon } from "./Icon";

type Props = {
  user: User | null;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
};

export function MyPageView({ user, isAdmin, onLogin, onLogout }: Props) {
  const [postCount, setPostCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyPostCount(user.uid)
      .then((n) => {
        if (!cancelled) setPostCount(n);
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: 28,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: C.slate100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="user-circle" size={36} color={C.slate300} />
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: C.slate700 }}>
          ログインしてください
        </p>
        <p
          style={{
            fontSize: 13,
            color: C.slate400,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          ログインすると投稿やいいねができます
        </p>
        <Btn onClick={onLogin} style={{ width: "100%", maxWidth: 260 }}>
          <Icon name="log-in" size={15} color={C.white} />
          ログイン / 新規登録
        </Btn>
      </div>
    );
  }

  const initial = (user.displayName || user.email || "U")[0]?.toUpperCase();

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        background: C.slate50,
        padding: 16,
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 10,
          border: `1px solid ${C.slate200}`,
          padding: 18,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: C.slate900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: C.white,
              overflow: "hidden",
            }}
          >
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt=""
                width={46}
                height={46}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initial
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ fontWeight: 600, fontSize: 15 }}>
                {user.displayName || "ユーザー"}
              </p>
              {isAdmin && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    color: C.white,
                    background: C.blue600,
                    padding: "2px 7px",
                    borderRadius: 999,
                  }}
                >
                  管理者
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: C.slate500, marginTop: 2 }}>
              {user.email ?? ""}
            </p>
          </div>
        </div>
      </div>
      <div
        style={{
          background: C.white,
          borderRadius: 10,
          border: `1px solid ${C.slate200}`,
          marginBottom: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "13px 16px",
          }}
        >
          <span style={{ fontSize: 13, color: C.slate600 }}>投稿した数</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.slate900 }}>
            {postCount === null ? "..." : `${postCount}件`}
          </span>
        </div>
      </div>
      <Btn variant="secondary" style={{ width: "100%" }} onClick={onLogout}>
        ログアウト
      </Btn>
    </div>
  );
}
