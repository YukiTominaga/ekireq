"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { C } from "@/app/lib/tokens";
import { CATEGORIES, type StationWithMeta } from "@/app/lib/stations";
import {
  addPost,
  reportPost,
  subscribePosts,
  toggleLike,
  type Post,
} from "@/app/lib/firestore";
import { Btn, Badge } from "./ui";
import { Icon } from "./Icon";

type Props = {
  station: StationWithMeta;
  user: User | null;
  onClose: () => void;
  onLoginRequest: () => void;
};

function formatTime(ts: Post["createdAt"]): string {
  if (!ts) return "";
  const d = ts.toDate();
  const m = String(d.getMonth() + 1);
  const day = String(d.getDate());
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
}

export function StationSheet({
  station,
  user,
  onClose,
  onLoginRequest,
}: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filterCats, setFilterCats] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftCats, setDraftCats] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return subscribePosts(station.key, setPosts);
  }, [station.key]);

  const filtered =
    filterCats.length === 0
      ? posts
      : posts.filter((p) => p.categories.some((c) => filterCats.includes(c)));

  async function handleToggleLike(post: Post) {
    if (!user) {
      onLoginRequest();
      return;
    }
    try {
      await toggleLike(post.id, user.uid);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleReport(post: Post) {
    if (!user) {
      onLoginRequest();
      return;
    }
    if (post.reportedBy.includes(user.uid)) return;
    if (!window.confirm("この投稿を通報しますか？")) return;
    try {
      await reportPost(post.id, user.uid);
    } catch (e) {
      console.error(e);
    }
  }

  async function handlePost() {
    if (!user || !draftText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addPost({
        stationKey: station.key,
        stationName: station.name,
        prefecture: station.prefecture,
        user,
        text: draftText.trim(),
        categories: draftCats,
      });
      setShowForm(false);
      setDraftText("");
      setDraftCats([]);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(15,23,42,0.35)",
        }}
      />
      <div
        style={{
          position: "relative",
          background: C.white,
          borderRadius: "16px 16px 0 0",
          width: "100%",
          maxHeight: "78%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          animation: "slideUp 0.28s ease-out",
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            background: C.slate200,
            borderRadius: 2,
            margin: "10px auto 0",
          }}
        />

        <div
          style={{
            padding: "10px 14px 8px",
            borderBottom: `1px solid ${C.slate100}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
                {station.name}駅
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: C.slate500 }}>
                  {station.prefecture} · {station.line}
                </span>
                <span style={{ fontSize: 11, color: C.slate400 }}>
                  {posts.length}件の投稿
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                flexShrink: 0,
                paddingTop: 2,
              }}
            >
              {user ? (
                <Btn size="sm" onClick={() => setShowForm((v) => !v)}>
                  <Icon name="plus" size={13} color={C.white} />
                  投稿
                </Btn>
              ) : (
                <Btn size="sm" variant="outline" onClick={onLoginRequest}>
                  ログイン
                </Btn>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                  color: C.slate400,
                }}
              >
                <Icon name="x" size={18} color={C.slate400} />
              </button>
            </div>
          </div>
        </div>

        {showForm && user && (
          <div
            style={{
              padding: "12px 14px",
              borderBottom: `1px solid ${C.slate100}`,
              background: C.slate50,
            }}
          >
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder={`${station.name}駅周辺に欲しい施設を投稿...`}
              rows={3}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: `1px solid ${C.slate200}`,
                fontSize: 13,
                fontFamily: "inherit",
                resize: "none",
                outline: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                gap: 5,
                flexWrap: "wrap",
                margin: "8px 0",
              }}
            >
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  active={draftCats.includes(cat)}
                  onClick={() =>
                    setDraftCats((s) =>
                      s.includes(cat)
                        ? s.filter((c) => c !== cat)
                        : [...s, cat],
                    )
                  }
                >
                  {cat}
                </Badge>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
                onClick={() => setShowForm(false)}
              >
                キャンセル
              </Btn>
              <Btn
                size="sm"
                style={{ flex: 2 }}
                onClick={handlePost}
                disabled={submitting || !draftText.trim()}
              >
                {submitting ? "投稿中..." : "投稿する"}
              </Btn>
            </div>
          </div>
        )}

        <div
          style={{
            padding: "8px 0 0",
            borderBottom: `1px solid ${C.slate100}`,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              padding: "0 14px 8px",
              scrollbarWidth: "none",
            }}
          >
            <Badge
              active={filterCats.length === 0}
              onClick={() => setFilterCats([])}
            >
              すべて
            </Badge>
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                active={filterCats.includes(cat)}
                onClick={() =>
                  setFilterCats((s) =>
                    s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat],
                  )
                }
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "36px 20px",
                color: C.slate400,
                fontSize: 13,
              }}
            >
              {posts.length === 0
                ? "この駅にはまだ投稿がありません"
                : "この条件の投稿はありません"}
            </div>
          )}
          {filtered.map((post) => {
            const liked = user ? post.likedBy.includes(user.uid) : false;
            return (
              <div
                key={post.id}
                style={{
                  padding: "12px 14px",
                  borderBottom: `1px solid ${C.slate100}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: C.slate200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.slate600,
                      }}
                    >
                      {post.userName[0] ?? "?"}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.slate700,
                      }}
                    >
                      {post.userName}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: C.slate400 }}>
                    {formatTime(post.createdAt)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: C.slate800,
                    marginBottom: 8,
                    paddingLeft: 34,
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
                      paddingLeft: 34,
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
                    paddingLeft: 34,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => handleToggleLike(post)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: liked ? C.red50 : C.slate50,
                      border: `1px solid ${liked ? C.red200 : C.slate200}`,
                      color: liked ? C.red500 : C.slate500,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    <Icon
                      name="heart"
                      size={12}
                      sw={liked ? 0 : 1.5}
                      color={liked ? C.red500 : C.slate400}
                      fill={liked ? C.red500 : "none"}
                    />
                    {post.likesCount}
                  </button>
                  {user && user.uid !== post.userId && (() => {
                    const reported = post.reportedBy.includes(user.uid);
                    return (
                      <button
                        onClick={() => handleReport(post)}
                        disabled={reported}
                        aria-label={reported ? "通報済み" : "通報する"}
                        title={reported ? "通報済み" : "通報する"}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: C.slate50,
                          border: `1px solid ${C.slate200}`,
                          color: reported ? C.slate400 : C.slate500,
                          borderRadius: 20,
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: reported ? "default" : "pointer",
                          fontFamily: "inherit",
                          opacity: reported ? 0.6 : 1,
                        }}
                      >
                        <Icon
                          name="flag"
                          size={12}
                          sw={1.5}
                          color={reported ? C.slate400 : C.slate500}
                        />
                        {reported ? "通報済み" : "通報"}
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
