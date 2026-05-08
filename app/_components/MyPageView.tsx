"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { C } from "@/app/lib/tokens";
import { subscribeMyPosts, type Post } from "@/app/lib/firestore";
import { getUniqueStations, type StationWithMeta } from "@/app/lib/stations";
import { formatTime } from "@/app/lib/format";
import { Btn } from "./ui";
import { Icon } from "./Icon";

type Props = {
  user: User | null;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
};

type StationGroup = {
  key: string;
  stationName: string;
  prefecture: string;
  line: string;
  posts: Post[];
  latestMs: number;
};

export function MyPageView({ user, isAdmin, onLogin, onLogout }: Props) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyPosts(user.uid, setPosts);
    return () => unsub();
  }, [user]);

  const stationMetaByKey = useMemo(() => {
    const m = new Map<string, StationWithMeta>();
    for (const s of getUniqueStations()) m.set(s.key, s);
    return m;
  }, []);

  const groups: StationGroup[] = useMemo(() => {
    if (!posts) return [];
    const byKey = new Map<string, Post[]>();
    for (const p of posts) {
      const arr = byKey.get(p.stationKey);
      if (arr) arr.push(p);
      else byKey.set(p.stationKey, [p]);
    }
    return Array.from(byKey.entries())
      .map(([key, list]) => ({
        key,
        posts: list,
        stationName: list[0].stationName,
        prefecture: list[0].prefecture,
        line: stationMetaByKey.get(key)?.line ?? "",
        latestMs: list[0].createdAt?.toMillis() ?? 0,
      }))
      .sort((a, b) => b.latestMs - a.latestMs);
  }, [posts, stationMetaByKey]);

  const isOpen = (k: string) => openMap[k] ?? groups.length === 1;

  function toggleOpen(key: string, currentlyOpen: boolean) {
    setOpenMap((m) => ({ ...m, [key]: !currentlyOpen }));
  }

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
          padding: "13px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, color: C.slate600 }}>投稿</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.slate900 }}>
          {posts === null
            ? "..."
            : `${posts.length}件 / ${groups.length}駅`}
        </span>
      </div>

      {posts !== null && groups.length === 0 && (
        <div
          style={{
            background: C.white,
            borderRadius: 10,
            border: `1px solid ${C.slate200}`,
            padding: "28px 20px",
            textAlign: "center",
            color: C.slate500,
            fontSize: 13,
            lineHeight: 1.7,
            marginBottom: 14,
          }}
        >
          まだ投稿がありません。
          <br />
          地図から駅をタップして投稿してみよう
        </div>
      )}

      {groups.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 14,
          }}
        >
          {groups.map((g) => {
            const open = isOpen(g.key);
            return (
              <div
                key={g.key}
                style={{
                  background: C.white,
                  borderRadius: 10,
                  border: `1px solid ${C.slate200}`,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleOpen(g.key, open)}
                  aria-expanded={open}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "12px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: C.slate900,
                        marginBottom: 2,
                      }}
                    >
                      {g.stationName}駅
                    </div>
                    <div style={{ fontSize: 11, color: C.slate500 }}>
                      {g.prefecture}
                      {g.line ? ` · ${g.line}` : ""}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.slate600,
                      background: C.slate100,
                      borderRadius: 999,
                      padding: "2px 8px",
                    }}
                  >
                    {g.posts.length}件
                  </span>
                  <Icon
                    name={open ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={C.slate400}
                  />
                </button>
                {open && (
                  <div style={{ borderTop: `1px solid ${C.slate100}` }}>
                    {g.posts.map((post) => (
                      <div
                        key={post.id}
                        style={{
                          padding: "12px 14px",
                          borderBottom: `1px solid ${C.slate100}`,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                            color: C.slate800,
                            marginBottom: 8,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {post.text}
                        </p>
                        {post.categories.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 4,
                              marginBottom: 8,
                            }}
                          >
                            {post.categories.map((cat) => (
                              <span
                                key={cat}
                                style={{
                                  fontSize: 11,
                                  padding: "2px 7px",
                                  borderRadius: 20,
                                  background: C.slate100,
                                  color: C.slate600,
                                }}
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 12,
                              color: C.slate500,
                            }}
                          >
                            <Icon
                              name="heart"
                              size={12}
                              sw={1.5}
                              color={C.slate400}
                            />
                            {post.likesCount}
                          </span>
                          <span style={{ fontSize: 11, color: C.slate400 }}>
                            {formatTime(post.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Btn variant="secondary" style={{ width: "100%" }} onClick={onLogout}>
        ログアウト
      </Btn>
    </div>
  );
}
