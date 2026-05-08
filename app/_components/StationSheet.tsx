"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { C } from "@/app/lib/tokens";
import { CATEGORIES, type StationWithMeta } from "@/app/lib/stations";
import {
  addPost,
  AlreadyReportedError,
  deletePost,
  REPORT_REASONS,
  reportPost,
  subscribePosts,
  toggleLike,
  type Post,
  type ReportReason,
} from "@/app/lib/firestore";
import { formatTime } from "@/app/lib/format";
import { Btn, Badge } from "./ui";
import { Icon } from "./Icon";

type Props = {
  station: StationWithMeta;
  user: User | null;
  onClose: () => void;
  onLoginRequest: () => void;
};

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
  const [reportTarget, setReportTarget] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason | null>(null);
  const [reporting, setReporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  function handleReportClick(post: Post) {
    if (!user) {
      onLoginRequest();
      return;
    }
    setReportReason(null);
    setReportTarget(post);
  }

  function closeReportModal() {
    setReportTarget(null);
    setReportReason(null);
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
      alert("削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSubmitReport() {
    if (!user || !reportTarget || !reportReason || reporting) return;
    setReporting(true);
    try {
      await reportPost({
        post: reportTarget,
        user,
        reason: reportReason,
      });
      closeReportModal();
    } catch (e) {
      console.error(e);
      if (e instanceof AlreadyReportedError) {
        alert("この投稿は既に通報済みです");
      } else {
        alert("通報の送信に失敗しました");
      }
    } finally {
      setReporting(false);
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
    <>
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
                        overflow: "hidden",
                      }}
                    >
                      {post.userPhotoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.userPhotoURL}
                          alt=""
                          width={26}
                          height={26}
                          referrerPolicy="no-referrer"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        (post.userName[0] ?? "?")
                      )}
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
                  {post.userId !== user?.uid && (
                    <button
                      onClick={() => handleReportClick(post)}
                      aria-label="この投稿を通報"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: C.slate50,
                        border: `1px solid ${C.slate200}`,
                        color: C.slate500,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <Icon
                        name="flag"
                        size={12}
                        sw={1.5}
                        color={C.slate400}
                      />
                      {post.reportsCount}
                    </button>
                  )}
                  {post.userId === user?.uid && (
                    <button
                      onClick={() => setDeleteTarget(post)}
                      aria-label="この投稿を削除"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: C.slate50,
                        border: `1px solid ${C.slate200}`,
                        color: C.slate500,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <Icon
                        name="trash"
                        size={12}
                        sw={1.5}
                        color={C.slate400}
                      />
                      削除
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    {reportTarget && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          onClick={reporting ? undefined : closeReportModal}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
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
            id="report-modal-title"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.slate900,
            }}
          >
            投稿を通報
          </h3>
          <p style={{ fontSize: 12, color: C.slate500, lineHeight: 1.6 }}>
            通報の理由を選択してください。送信された通報は運営側で確認します。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {REPORT_REASONS.map((r) => {
              const checked = reportReason === r.code;
              return (
                <label
                  key={r.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${checked ? C.slate900 : C.slate200}`,
                    background: checked ? C.slate100 : C.white,
                    fontSize: 13,
                    color: C.slate800,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.code}
                    checked={checked}
                    onChange={() => setReportReason(r.code)}
                    style={{ accentColor: C.slate900 }}
                  />
                  {r.label}
                </label>
              );
            })}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Btn
              variant="ghost"
              onClick={closeReportModal}
              disabled={reporting}
            >
              キャンセル
            </Btn>
            <Btn
              variant="primary"
              onClick={handleSubmitReport}
              disabled={!reportReason || reporting}
            >
              {reporting ? "送信中…" : "通報する"}
            </Btn>
          </div>
        </div>
      </div>
    )}
    {deleteTarget && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          onClick={closeDeleteModal}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
          }}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
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
            id="delete-modal-title"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: C.slate900,
            }}
          >
            投稿を削除
          </h3>
          <p style={{ fontSize: 13, color: C.slate600, lineHeight: 1.6 }}>
            この投稿を削除しますか？削除すると元に戻せません。
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 4,
            }}
          >
            <Btn
              variant="ghost"
              onClick={closeDeleteModal}
              disabled={deleting}
            >
              キャンセル
            </Btn>
            <Btn
              variant="primary"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? "削除中…" : "削除する"}
            </Btn>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
