"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { C } from "@/app/lib/tokens";
import { updateUserDisplayName } from "@/app/lib/auth";
import {
  deletePost,
  subscribeMyPosts,
  updateMyPostsUserName,
  type Post,
} from "@/app/lib/firestore";
import { getUniqueStations, type StationWithMeta } from "@/app/lib/stations";
import { formatTime } from "@/app/lib/format";
import { Btn, PillButton } from "./ui";
import { ConfirmDialog } from "./ConfirmDialog";
import { Icon } from "./Icon";
import { InstallCard } from "./InstallCard";
import { useToast } from "./Toast";
import { UserAvatar } from "./UserAvatar";

const NAME_MAX_LENGTH = 20;

type Props = {
  user: User | null;
  isAdmin: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onRefreshUser: () => void;
};

type StationGroup = {
  key: string;
  stationName: string;
  prefecture: string;
  line: string;
  posts: Post[];
  latestMs: number;
};

export function MyPageView({
  user,
  isAdmin,
  onLogin,
  onLogout,
  onRefreshUser,
}: Props) {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [stationMetaByKey, setStationMetaByKey] = useState<
    Map<string, StationWithMeta>
  >(() => new Map());
  const showToast = useToast();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeMyPosts(user.uid, setPosts);
    return () => unsub();
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    getUniqueStations().then((stations) => {
      if (cancelled) return;
      const m = new Map<string, StationWithMeta>();
      for (const s of stations) m.set(s.key, s);
      setStationMetaByKey(m);
    });
    return () => {
      cancelled = true;
    };
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

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteTarget(null);
  }

  async function handleConfirmDelete() {
    if (!user || !deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deletePost({
        postId: deleteTarget.id,
        stationKey: deleteTarget.stationKey,
      });
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      showToast("削除に失敗しました", "error");
    } finally {
      setDeleting(false);
    }
  }

  function openEditName() {
    if (!user) return;
    setNameInput(user.displayName ?? "");
    setEditingName(true);
  }

  function closeEditName() {
    if (savingName) return;
    setEditingName(false);
  }

  async function handleSaveName() {
    if (!user || savingName) return;
    const trimmed = nameInput.trim();
    if (trimmed.length === 0 || trimmed.length > NAME_MAX_LENGTH) return;
    if (trimmed === (user.displayName ?? "")) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await updateUserDisplayName(trimmed);
      await updateMyPostsUserName(user.uid, trimmed);
      onRefreshUser();
      setEditingName(false);
    } catch (e) {
      console.error(e);
      showToast("名前の変更に失敗しました", "error");
    } finally {
      setSavingName(false);
    }
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
    <>
    <div
      className="no-scrollbar"
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
          <UserAvatar
            photoURL={user.photoURL}
            fallback={initial ?? "U"}
            size={46}
            bg={C.slate900}
            fg={C.white}
            fontSize={16}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
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
          <PillButton
            icon="pencil"
            ariaLabel="ユーザー名を編集"
            onClick={openEditName}
          >
            編集
          </PillButton>
        </div>
      </div>

      <InstallCard />

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
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {post.userId === user.uid && (
                              <PillButton
                                icon="trash"
                                ariaLabel="この投稿を削除"
                                onClick={() => setDeleteTarget(post)}
                              >
                                削除
                              </PillButton>
                            )}
                            <span style={{ fontSize: 11, color: C.slate400 }}>
                              {formatTime(post.createdAt)}
                            </span>
                          </div>
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
    <ConfirmDialog
      open={!!deleteTarget}
      title="投稿を削除"
      body="この投稿を削除しますか？削除すると元に戻せません。"
      confirmLabel="削除する"
      confirmingLabel="削除中…"
      busy={deleting}
      position="fixed"
      labelledById="mypage-delete-modal-title"
      onCancel={closeDeleteModal}
      onConfirm={handleConfirmDelete}
    />
    {editingName && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          onClick={closeEditName}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mypage-edit-name-title"
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
            id="mypage-edit-name-title"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.slate900,
            }}
          >
            ユーザー名を変更
          </h3>
          <p style={{ fontSize: 12, color: C.slate500, lineHeight: 1.6 }}>
            変更するとあなたの過去の投稿の表示名も新しい名前になります。
          </p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={NAME_MAX_LENGTH}
            placeholder="ユーザー名"
            disabled={savingName}
            autoFocus
            aria-label="ユーザー名"
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 14,
              borderRadius: 8,
              border: `1px solid ${C.slate200}`,
              background: C.white,
              color: C.slate900,
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              fontSize: 11,
              color: C.slate400,
              textAlign: "right",
            }}
          >
            {nameInput.trim().length} / {NAME_MAX_LENGTH}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Btn variant="ghost" onClick={closeEditName} disabled={savingName}>
              キャンセル
            </Btn>
            <Btn
              variant="primary"
              onClick={handleSaveName}
              disabled={
                savingName ||
                nameInput.trim().length === 0 ||
                nameInput.trim() === (user.displayName ?? "")
              }
            >
              {savingName ? "保存中…" : "保存"}
            </Btn>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
